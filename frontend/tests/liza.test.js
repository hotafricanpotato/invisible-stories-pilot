import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { storyRegistry, createStoryRegistry, sceneFragments, fragmentRange, defineStory } from "../src/content/storyRegistry.js";
import { createExhibitionModel } from "../src/state/model.js";
import { exhibitionConfig } from "../src/content/exhibitionConfig.js";
const source = JSON.parse(await readFile(new URL("./fixtures/liza-v2-source.json", import.meta.url), "utf8"));
const p = source.paragraphs;
const liza = storyRegistry.liza;
const indices = (a, b) => Array.from({length: b-a+1}, (_, i) => a+i);
const messageLine = m => `${m.sender}${m.time ? `, ${m.time}` : ""}: ${m.text}`;
const transcript = scene => sceneFragments(scene).flatMap(part => part.kind === "chat" ? part.messages.map(messageLine)
  : part.kind === "message" ? [messageLine(part.message)] : part.text.split("\n\n"));
const model = createExhibitionModel(storyRegistry, exhibitionConfig);
function quizDone(m = model) {
  let s = m.initialState();
  for (let i=0;i<5;i++) s=m.reducer(s,{type:"QUIZ_ANSWER",id:i,value:"A"});
  return m.reducer(s,{type:"QUIZ_COMPLETE"});
}
function finish(s, id, m=model, registry=storyRegistry) {
  const story=registry[id];
  for (let i=0;i<story.steps.length;i++) {
    const step=story.steps[i];
    if (step.kind==="scene") while(m.fragmentCount(s.stories[id],step.scene)<sceneFragments(step.scene).length)
      s=m.reducer(s,{type:"REVEAL_FRAGMENT",storyId:id,sceneId:step.id});
    if (step.kind==="materials") for(const material of story.materials) s=m.reducer(s,{type:"MATERIAL",storyId:id,id:material.id});
    if (step.kind==="map") {
      for(const q of story.questions) s=m.reducer(s,{type:"MAP_ANSWER",storyId:id,id:q.id,value:q.correct});
      s=m.reducer(s,{type:"MAP_REVEAL",storyId:id});
    }
    if(i<story.steps.length-1) s=m.reducer(s,{type:"STORY_ADVANCE",storyId:id,index:i});
  }
  return m.reducer(s,{type:"STORY_COMPLETE",storyId:id});
}

test("Liza 2.0 source DOCX provenance and every scene line/paragraph/order match verbatim", async () => {
  assert.equal(createHash("sha256").update(await readFile(new URL("../docs/sources/liza-scenario-2.0.docx",import.meta.url))).digest("hex"),source.sha256);
  const blocks=[ [...indices(9,13),...indices(15,18),20,21], [...indices(25,33),...indices(35,37)],
    [...indices(40,55),...indices(57,59)], [...indices(62,74),76,77], [...indices(153,159),...indices(161,163)] ];
  liza.scenes.forEach((scene,i)=>assert.deepEqual(transcript(scene),blocks[i].map(index=>p[index]),scene.id));
  assert.deepEqual(liza.scenes.map(s=>s.time),[7,24,39,61,152].map(i=>p[i]));
  assert.equal(liza.title,p[0]);
});
test("Liza materials, album, map keys/explanations and final text match approved source", () => {
  const [friend,album,teacher]=liza.materials;
  assert.deepEqual(friend.messages.map(messageLine),indices(82,87).map(i=>p[i]));
  assert.equal(friend.monologue,[p[89],p[90]].join("\n\n"));
  assert.equal(friend.time,p[81]);
  assert.equal(album.albumTitle,p[92]);
  assert.deepEqual(album.photos.map(x=>[x.description,x.caption]),[[p[93],p[94]],[p[95],p[96]]]);
  assert.equal(album.publication,p[97]);
  assert.equal(album.monologue,indices(99,101).map(i=>p[i]).join("\n\n"));
  assert.deepEqual(teacher.messages.map(messageLine),indices(105,108).map(i=>p[i]));
  assert.equal(teacher.monologue,[p[110],p[111]].join("\n\n"));
  assert.equal(teacher.chatTitle,p[104]); assert.equal(teacher.time,p[103]);
  for(const [i,start] of [115,123,131].entries()) {
    const q=liza.questions[i];
    assert.equal(q.title,p[start].split(". ").slice(1).join(". "));
    assert.equal(`Фрагмент истории: «${q.fragment}».`,p[start+1]);
    assert.deepEqual(Object.entries(q.options).map(([k,v])=>`${k}. ${v}`),indices(start+3,start+5).map(i=>p[i]));
    assert.equal(`Правильный ответ: ${q.correct}.`,p[start+6]);
    assert.equal(`Объяснение: ${q.explanation}`,p[start+7]);
  }
  assert.deepEqual(liza.questions.map(q=>q.correct),["B","C","A"]);
  assert.equal(liza.conclusion.title,p[141]);assert.equal(liza.conclusion.introduction,p[142]);
  assert.deepEqual(liza.conclusion.factors.flatMap(f=>[f.title,f.text]),indices(143,150).map(i=>p[i]));
  assert.equal(liza.steps.at(-1).content.text,[p[165],p[166]].join("\n\n"));
  assert.deepEqual(liza.steps.map(s=>s.kind),["scene","scene","scene","scene","materials","map","conclusion","scene","closing"]);
});
test("mixed chat is one whole UI unit; live dialogue still has one current reply", () => {
  assert.deepEqual(liza.scenes[0].fragments.map(f=>f.kind),["monologue","chat","monologue"]);
  for (const scene of liza.scenes) sceneFragments(scene).forEach((part,i)=>{
    assert.deepEqual(fragmentRange(scene,i+1),{start:i+1,end:i+1});
    if(part.kind==="chat") assert.ok(part.messages.length>1);
  });
});
test("independent testing keeps stories isolated; all available stories gate statistics and reset", () => {
  let s=quizDone();
  assert.equal(model.allowedPath("/stories/nikita/sunday",s),"/stories/nikita/sunday");
  assert.equal(model.allowedPath("/stories/liza/introduction",s),"/stories/liza/introduction");
  const untouched=structuredClone(s.stories.nikita),quiz=structuredClone(s.quiz);
  s=finish(s,"liza");
  assert.deepEqual(s.stories.nikita,untouched);assert.deepEqual(s.quiz,quiz);
  assert.equal(model.allowedPath("/statistics/1",s),"/stories/nikita/sunday");
  assert.equal(s.stories.liza.completed,true);
  s=finish(s,"nikita");assert.equal(model.allowedPath("/statistics/1",s),"/statistics/1");
  assert.deepEqual(model.restore(JSON.stringify(s)),s);
  assert.deepEqual(model.reducer(s,{type:"RESET"}),model.initialState());
});
test("old v1/v2/v3 Nikita sessions keep partial progress, materials, map, stats and cursor", () => {
  const oldRegistry=createStoryRegistry([storyRegistry.nikita]);
  const old=createExhibitionModel(oldRegistry);
  let complete=finish(quizDone(old),"nikita",old,oldRegistry);
  for(let i=0;i<3;i++) complete=old.reducer(complete,{type:"STATS_ADVANCE",index:i});
  complete=old.reducer(complete,{type:"STATS_COMPLETE"});complete.cursor="/complete";
  for(const version of [1,2,3]) for(const done of [false,true]) {
    const input=done ? structuredClone(complete) : quizDone(old);
    input.version=version;
    if(!done) {
      input.stories.nikita.unlocked=2;input.stories.nikita.currentStepId="keys";
      input.stories.nikita.revealedFragments.messages_dima=4;
      input.stories.nikita.revealedFragments.keys=5;input.stories.nikita.currentFragments.keys=3;
      input.cursor="/stories/nikita/keys";
    }
    if(version===1) { input.nikita=input.stories.nikita;delete input.stories; }
    const restored=model.restore(JSON.stringify(input));
    assert.equal(restored.version,4);
    assert.equal(restored.cursor,input.cursor);
    assert.equal(restored.stories.nikita.unlocked,done?6:2);
    assert.deepEqual(restored.stories.nikita.opened,done?complete.stories.nikita.opened:[]);
    assert.deepEqual(restored.stories.nikita.answers,done?complete.stories.nikita.answers:{});
    assert.equal(restored.stories.liza.unlocked,0);assert.equal(restored.stories.liza.completed,false);
    if(done) { assert.equal(restored.stats.completed,true);assert.equal(restored.stats.unlocked,3); }
    if(version===3&&!done) assert.equal(restored.stories.nikita.currentFragments.keys,3);
    assert.deepEqual(model.restore(JSON.stringify(restored)),restored);
  }
});
test("sequential future configuration requires Liza first without registering Ilya", () => {
  const sequential=createExhibitionModel(storyRegistry,{storyAccess:"sequential"});
  let s=quizDone(sequential);
  assert.equal(sequential.allowedPath("/stories/nikita/sunday",s),"/stories/liza/introduction");
  s=finish(s,"liza",sequential);
  assert.equal(sequential.allowedPath("/stories/nikita/sunday",s),"/stories/nikita/sunday");
  assert.deepEqual(Object.keys(storyRegistry),["liza","nikita"]);
  assert.equal(exhibitionConfig.finalQuizEnabled,false);
});


test("adding a third registry module automatically extends the statistics gate", () => {
  // Test-only reuse of approved Nikita data; no Ilya scenario is created or registered in production.
  const third=defineStory({...structuredClone(storyRegistry.nikita),id:"test-third"});
  const registry=createStoryRegistry([liza,storyRegistry.nikita,third]);
  const m=createExhibitionModel(registry,{storyAccess:"sequential"});
  let s=quizDone(m);
  s=finish(s,"liza",m,registry);s=finish(s,"nikita",m,registry);
  assert.equal(m.allowedPath("/statistics/1",s),"/stories/test-third/sunday");
  s=finish(s,"test-third",m,registry);
  assert.equal(m.allowedPath("/statistics/1",s),"/statistics/1");
});
