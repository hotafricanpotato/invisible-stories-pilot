import test from "node:test";
import assert from "node:assert/strict";
import { createExhibitionModel } from "../src/state/model.js";
import { storyRegistry, createStoryRegistry, defineStory } from "../src/content/storyRegistry.js";
import { exhibitionConfig } from "../src/content/exhibitionConfig.js";
import { storyCatalog } from "../src/content/storyCatalog.js";
import { finishStory } from "./story-helpers.js";
const model = createExhibitionModel(storyRegistry, exhibitionConfig);
const finish = (s, id) => finishStory(s, id, model, storyRegistry);
test("three cards, sequential status, real completion and full statistics", () => {
  assert.deepEqual(storyCatalog.map(e => e.id), ["liza", "nikita", "ilya"]);
  let s = model.initialState();
  assert.equal(model.storyStatus(s, "liza"), "Доступна");
  assert.equal(model.storyStatus(s, "nikita"), "Недоступна");
  assert.equal(model.storyStatus(s, "ilya"), "Недоступна");
  assert.equal(model.canEnterStats(s), false);
  assert.equal(model.allowedPath("/stories/nikita/sunday", s), "/stories");
  assert.equal(model.allowedPath("/stories/ilya/introduction", s), "/stories");
  assert.equal(model.reducer(s, {type:"STORY_COMPLETE",storyId:"nikita"}), s);
  s = model.reducer(s, {type:"CURSOR",path:"/stories/liza/introduction"});
  assert.equal(model.storyStatus(s,"liza"),"В процессе");
  assert.equal(model.resumePath(model.restore(JSON.stringify(s)),"liza"),"/stories/liza/introduction");
  assert.equal(model.reducer(s,{type:"STORY_COMPLETE",storyId:"liza"}).stories.liza.completed,false);
  s = finish(s,"liza");
  assert.equal(model.storyStatus(s,"liza"),"Пройдена");
  assert.equal(model.storyStatus(s,"nikita"),"Доступна");
  assert.equal(model.completionMessage(s,"liza"),"История Лизы завершена. Теперь доступна история Никиты");
  assert.equal(model.canEnterStats(s),false);
  s = finish(s,"nikita");
  assert.equal(model.canEnterStats(s),false);
  assert.equal(model.completionMessage(s,"nikita"),"История Никиты завершена. Теперь доступна история Ильи");
  assert.equal(model.storyStatus(s,"ilya"),"Доступна");
  s=finish(s,"ilya");
  assert.equal(model.canEnterStats(s),true);
  assert.equal(model.completionMessage(s,"ilya"),"Все три истории завершены. Теперь доступна „Невидимая статистика“");
  for(const id of ['liza','nikita','ilya']) assert.equal(model.storyStatus(s,id),'Пройдена');
  assert.equal(s.quiz.completed,false);
  assert.deepEqual(s.quiz.answers,{});
});
test("full configuration fails closed without Ilya and opens after all three real modules complete",()=>{
  const fullOptions={...exhibitionConfig,mode:"full",availableStoryIds:["liza","nikita","ilya"]};
  const full=createExhibitionModel(storyRegistry,fullOptions);
  let s=finish(finish(model.initialState(),"liza"),"nikita");
  assert.equal(full.canEnterStats(s),false);
  assert.equal(full.allowedPath("/statistics/1",s),"/stories");
  const missing=createExhibitionModel(createStoryRegistry([storyRegistry.liza,storyRegistry.nikita]),fullOptions);
  assert.equal(missing.canEnterStats(s),false);
  assert.equal(full.storyStatus(s,"ilya"),"Доступна");
  s=finishStory(s,"ilya",full,storyRegistry);
  assert.equal(full.canEnterStats(s),true);
});
test("v4 independent partial Nikita stays intact while locked, then resumes after Liza",()=>{
  const old=createExhibitionModel(createStoryRegistry([storyRegistry.nikita]));
  let oldState=old.initialState();
  oldState=old.reducer(oldState,{type:"STORY_ADVANCE",storyId:"nikita",index:0});
  oldState=old.reducer(oldState,{type:"READ_POSITION",storyId:"nikita",sceneId:"messages_dima",position:1});
  oldState=old.reducer(oldState,{type:"STORY_ADVANCE",storyId:"nikita",index:1});
  for(const position of [2,3,2]) oldState=old.reducer(oldState,{type:"READ_POSITION",storyId:"nikita",sceneId:"keys",position});
  oldState.version=4;oldState.cursor="/stories/nikita/keys";
  oldState.stories.nikita.currentStepId="keys";
  oldState.legacyStatsAccess=true;oldState.legacyStoryAccess=["nikita"];
  oldState.stats={...oldState.stats,unlocked:3,completed:true,expanded:["global"],answer:1,revealed:true};
  let restored=model.restore(JSON.stringify(oldState));
  assert.equal(restored.cursor,"/stories");
  assert.deepEqual(restored.stories.nikita,oldState.stories.nikita);
  assert.deepEqual(restored.stats,oldState.stats);
  assert.equal(model.canEnterStats(restored),false);
  assert.equal(model.storyStatus(restored,"nikita"),"Недоступна");
  const preserved=structuredClone(restored.stories.nikita);
  restored=finish(restored,"liza");
  assert.equal(model.resumePath(restored,"nikita"),"/stories/nikita/keys");
  assert.equal(model.storyStatus(restored,"nikita"),"В процессе");
  assert.deepEqual(restored.stories.nikita,preserved);
});
test("legacy completed Nikita is revisitable but cannot bypass the new statistics condition",()=>{
  const oldRegistry=createStoryRegistry([storyRegistry.nikita]);
  const old=createExhibitionModel(oldRegistry);
  const s=finishStory(old.initialState(),"nikita",old,oldRegistry);
  s.version=3;s.legacyStatsAccess=true;
  const restored=model.restore(JSON.stringify(s));
  assert.equal(model.storyStatus(restored,"nikita"),"Пройдена");
  assert.equal(model.allowedPath("/stories/nikita/conclusion",restored),"/stories/nikita/conclusion");
  assert.equal(model.canEnterStats(restored),false);
  assert.equal(model.canEnterStats(finish(restored,"liza")),false);
  assert.equal(model.canEnterStats(finish(finish(restored,"liza"),"ilya")),true);
});
test("versions 1–4 retain quiz history without displaying or requiring it; reset starts at home",()=>{
  for(const version of [1,2,3,4]) {
    const input={...model.initialState(),version,cursor:"/quiz/complete",quiz:{answers:{0:"B"},completed:false}};
    let s=model.restore(JSON.stringify(input));
    assert.deepEqual(s.quiz,input.quiz);
    assert.equal(s.cursor,"/stories");
    assert.equal(model.canEnter(s,"liza"),true);
    s=finish(s,"liza");
    s=model.reducer(s,{type:"RESET"});
    assert.deepEqual(s,model.initialState());
    assert.equal(s.cursor,"/");
    assert.equal(model.storyStatus(s,"liza"),"Доступна");
    assert.equal(model.storyStatus(s,"nikita"),"Недоступна");
    assert.equal(model.allowedPath("/quiz/1",s),"/stories");
    assert.equal(model.canEnterStats(s),false);
  }
});

test("pilot migration keeps old statistics and all story data but rejects every access bypass",()=>{
  const pilot=createExhibitionModel(storyRegistry,{...exhibitionConfig,mode:'pilot',availableStoryIds:['liza','nikita']});
  let old=finishStory(finishStory(pilot.initialState(),'liza',pilot,storyRegistry),'nikita',pilot,storyRegistry);
  for(let i=0;i<3;i++) old=pilot.reducer(old,{type:'STATS_ADVANCE',index:i});
  old=pilot.reducer(old,{type:'STATS_COMPLETE'});
  old.stats={...old.stats,filter:'Только нефизические',expanded:['global'],answer:1,revealed:true};
  old.quiz={answers:{0:'B',1:'C',2:'C',3:'A',4:'C'},completed:true};
  old.legacyStatsAccess=true;old.legacyStoryAccess=['nikita'];
  for(const version of [1,2,3,4,5,6]) {
    const input=structuredClone(old);input.version=version;input.cursor='/complete';
    if(version===1) { input.nikita=input.stories.nikita;delete input.stories; }
    let s=model.restore(JSON.stringify(input));
    assert.deepEqual(s.stats,old.stats);assert.deepEqual(s.quiz,old.quiz);
    assert.equal(s.cursor,'/stories');assert.equal(model.canEnterStats(s),false);
    for(const url of ['/statistics/1','/statistics/4','/complete']) assert.equal(model.allowedPath(url,s),'/stories');
    assert.equal(model.reducer(s,{type:'STATS_COMPLETE'}),s);
    assert.equal(model.reducer(s,{type:'STATS_ADVANCE',index:0}),s);
    if(version===1) s=finish(s,'liza');
    s=finish(s,'ilya');
    assert.equal(model.canEnterStats(s),true);
    assert.equal(model.allowedPath('/statistics/4',s),'/statistics/3');
    assert.deepEqual(s.stats,old.stats);
    assert.equal(model.allowedPath('/complete',s),'/complete');
  }
});
test("full completion, reset and repeat completion unlock statistics without quiz or legacy flags",()=>{
  let s=model.initialState();
  for(let round=0;round<2;round++) {
    for(const id of ['liza','nikita','ilya']) {
      assert.equal(model.canEnterStats(s),false);
      s=finish(s,id);
    }
    assert.equal(model.canEnterStats(s),true);
    assert.equal(model.completionMessage(s,'ilya'),'Все три истории завершены. Теперь доступна „Невидимая статистика“');
    if(round===0) {
      s=model.reducer(s,{type:'RESET'});assert.equal(s.cursor,'/');
      assert.equal(model.storyStatus(s,'liza'),'Доступна');
      for(const id of ['nikita','ilya']) assert.equal(model.storyStatus(s,id),'Недоступна');
      assert.equal(model.allowedPath('/statistics/1',s),'/stories');
    }
  }
});
