import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { storyRegistry, createStoryRegistry, sceneFragments } from "../src/content/storyRegistry.js";
import { exhibitionConfig } from "../src/content/exhibitionConfig.js";
import { createExhibitionModel } from "../src/state/model.js";
import { finishStory } from "./story-helpers.js";
const ilya=storyRegistry.ilya;
const fixture=JSON.parse(await readFile(new URL('./fixtures/ilya-v4-source.json',import.meta.url),'utf8'));
const p=fixture.paragraphs;
const options={...exhibitionConfig,availableStoryIds:["liza","nikita","ilya"]};
const model=createExhibitionModel(storyRegistry,options);
const finish=(s,id,m=model)=>finishStory(s,id,m,storyRegistry);
const prerequisites=()=>finish(finish(model.initialState(),"liza"),"nikita");
const send=(s,type,data={})=>model.reducer(s,{type,storyId:"ilya",...data});
const lines=parts=>parts.flatMap(part=>part.kind==="chat"?part.messages.map(m=>`${m.sender}: ${m.text}`):part.kind==="message"?[`${part.message.sender}: ${part.message.text}`]:part.text.split('\n\n'));
function reachMaterials() {
  let s=prerequisites();
  for(let i=0;i<4;i++) {
    const scene=ilya.scenes[i];
    for(let position=2;position<=sceneFragments(scene).length;position++) s=send(s,"READ_POSITION",{sceneId:scene.id,position});
    s=send(s,"STORY_ADVANCE",{index:i});
  }
  return s;
}
test("Ilya 4.0 DOCX provenance and all artistic lines match verbatim in source order",async()=>{
  const doc=await readFile(new URL('../docs/sources/ilya-scenario-4.0.docx',import.meta.url));
  assert.equal(createHash('sha256').update(doc).digest('hex'),fixture.sha256);
  assert.equal(ilya.character,"Илья");assert.equal(ilya.age,16);assert.equal(ilya.scenarioVersion,"4.0");
  for(const scene of ilya.scenes) assert.deepEqual(lines(scene.fragments),fixture.fragmentSources[scene.id].map(i=>p[i]),scene.id);
  assert.deepEqual(ilya.scenes.map(s=>s.time),[8,24,41,59].map(i=>p[i]));
  for(const material of ilya.materials) {
    const actual=material.type==="dialogue"?lines(material.fragments):[...material.messages.map(m=>`${m.sender}: ${m.text}`),...material.monologue.split('\n\n')];
    assert.deepEqual(actual,fixture.fragmentSources[material.id].map(i=>p[i]),material.id);
  }
  assert.deepEqual(ilya.materials.map(m=>m.time),[72,85,98].map(i=>p[i]));
  assert.equal(ilya.materials[2].fragments.at(-1).text,"А у нас так принято.");
  assert.deepEqual(ilya.steps.map(s=>s.kind),["scene","scene","scene","scene","materials","map","conclusion","closing"]);
});
test("three exact questions, B/C/A keys, explanations, four factors, caveat and all final paragraphs",()=>{
  for(const [i,start] of [120,131,142].entries()) {
    const q=ilya.questions[i];
    assert.equal(q.title,p[start].split('. ',2)[1]);assert.equal(q.fragment,p[start+2]);
    assert.equal(`Вопрос: ${q.question}`,p[start+3]);
    assert.deepEqual(Object.entries(q.options).map(([key,value])=>`${key}. ${value}`),p.slice(start+5,start+8));
    assert.equal(`Правильный ответ: ${q.correct}.`,p[start+8]);assert.equal(q.explanation,p[start+10]);
  }
  assert.deepEqual(ilya.questions.map(q=>q.correct),['B','C','A']);
  assert.equal(ilya.conclusion.title,p[155]);
  assert.deepEqual(ilya.conclusion.factors.flatMap(f=>[f.title,f.text]),p.slice(156,164));
  assert.equal(ilya.conclusion.final_text,p[164]);
  assert.equal(ilya.steps.at(-1).content.text,p.slice(166,169).join('\n\n'));
});
test("all seven approved WebP originals match manifest hashes and presentation dimensions",async()=>{
  const artwork=[...Object.values(ilya.presentation.artwork),...Object.values(ilya.presentation.materialArtwork)];
  const manifest=await readFile(new URL('../docs/assets/ilya-approved/MANIFEST.csv',import.meta.url),'utf8');
  const rows=manifest.trim().split(/\r?\n/).slice(1);
  assert.equal(rows.length,7);assert.equal(artwork.length,7);
  assert.equal(new Set(artwork.map(a=>a.src)).size,7);
  for(const line of rows) {
    // Split only outside quoted CSV fields (scene labels can contain commas).
    const cells=line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const filename=cells[0], width=Number(cells.at(-3)), height=Number(cells.at(-2)), hash=cells.at(-1);
    const art=artwork.find(a=>a.src===`/assets/ilya/${filename}`);
    assert.ok(art,filename);assert.equal(art.width,width);assert.equal(art.height,height);
    assert.equal(art.placeholder,undefined);assert.equal(art.mobileSrc,undefined);assert.equal(art.layout,undefined);
    const data=await readFile(new URL(`../public/assets/ilya/${filename}`,import.meta.url));
    assert.equal(createHash('sha256').update(data).digest('hex'),hash,filename);
  }
  const css=await readFile(new URL('../src/story-design.css',import.meta.url),'utf8');
  for(const color of ['#e7e5d9','#f0f0e7','#65745b','#384437']) assert.ok(css.includes(color));
});
test("Ilya is test-only after Nikita; pilot statistics still opens after the first two",()=>{
  assert.equal(exhibitionConfig.mode,'pilot');
  let s=model.initialState();
  assert.equal(model.allowedPath('/stories/ilya/introduction',s),'/stories');
  s=finish(s,'liza');assert.equal(model.canEnter(s,'ilya'),false);
  s=finish(s,'nikita');assert.equal(model.canEnter(s,'ilya'),true);assert.equal(model.canEnterStats(s),true);
  const standard=createExhibitionModel(storyRegistry,exhibitionConfig);
  assert.equal(standard.canEnter(s,'ilya'),false);assert.equal(standard.canEnterStats(s),true);
  const full=createExhibitionModel(storyRegistry,{...options,mode:'full'});
  assert.equal(full.canEnterStats(s),false);
  s=finish(s,'ilya');assert.equal(full.canEnterStats(s),true);
  assert.deepEqual(model.reducer(s,{type:'RESET'}),model.initialState());
});
test("mixed chat is one whole unit, author fragments remain separate, no scene skipping",()=>{
  let s=prerequisites();
  assert.equal(send(s,'STORY_ADVANCE',{index:0}).stories.ilya.unlocked,0);
  s=reachMaterials();
  const chat=ilya.scenes[1].fragments.find(f=>f.kind==='chat');
  assert.equal(chat.messages.length,3);assert.equal(chat.title,p[33]);
  assert.equal(ilya.scenes[2].fragments.filter(f=>f.text===p[50]).length,1);
  assert.equal(ilya.materials[2].fragments.filter(f=>f.text===p[100]).length,1);
  assert.equal(s.stories.ilya.unlocked,4);
});
test("materials open freely, dialogue must be read, positions and maximum survive close/reload",()=>{
  let s=reachMaterials();
  const others=structuredClone({liza:s.stories.liza,nikita:s.stories.nikita,quiz:s.quiz,stats:s.stats});
  for(const id of ['kirill-conversation','mother-chat','family-feast']) s=send(s,'MATERIAL',{id});
  assert.deepEqual(s.stories.ilya.opened,['kirill-conversation','mother-chat','family-feast']);
  assert.equal(send(s,'STORY_ADVANCE',{index:4}).stories.ilya.unlocked,4);
  assert.equal(model.materialComplete(ilya,s.stories.ilya,ilya.materials[1]),true);
  assert.equal(send(s,'MATERIAL_POSITION',{id:'family-feast',position:8}),s);
  s=send(s,'MATERIAL_POSITION',{id:'family-feast',position:2});
  s=send(s,'MATERIAL_POSITION',{id:'family-feast',position:3});
  s=send(s,'MATERIAL_POSITION',{id:'family-feast',position:2});
  s=send(s,'MATERIAL',{id:'family-feast'});
  assert.equal(send(s,'MATERIAL_POSITION',{id:'family-feast',position:3}),s);
  s=model.restore(JSON.stringify(s));
  assert.equal(s.stories.ilya.materialPositions['family-feast'],2);
  assert.equal(s.stories.ilya.reachedMaterialPositions['family-feast'],3);
  for(const m of ilya.materials.filter(m=>m.type==='dialogue')) {
    s=send(s,'MATERIAL',{id:m.id});
    for(let position=2;position<=m.fragments.length;position++) s=send(s,'MATERIAL_POSITION',{id:m.id,position});
    assert.equal(model.materialComplete(ilya,s.stories.ilya,m),true);
  }
  s=send(s,'STORY_ADVANCE',{index:4});assert.equal(s.stories.ilya.unlocked,5);
  assert.deepEqual({liza:s.stories.liza,nikita:s.stories.nikita,quiz:s.quiz,stats:s.stats},others);
});
test("map requires all three answers; no scoring or loss on final completion",()=>{
  let s=finish(prerequisites(),'ilya');
  const quiz=structuredClone(s.quiz);
  assert.equal(s.stories.ilya.completed,true);
  assert.deepEqual(s.stories.ilya.answers,{responsibility:'B',normalization:'C',protection:'A'});
  assert.deepEqual(model.restore(JSON.stringify(s)),s);assert.deepEqual(s.quiz,quiz);
  const before=reachMaterials();
  assert.equal(send(before,'MAP_REVEAL'),before);
  assert.equal(send(before,'STORY_COMPLETE'),before);
});
test("versions 1–5 migrate without changing old story progress, quiz or statistics",()=>{
  const oldRegistry=createStoryRegistry([storyRegistry.liza,storyRegistry.nikita]);
  const old=createExhibitionModel(oldRegistry,exhibitionConfig);
  let complete=finishStory(finishStory(old.initialState(),'liza',old,oldRegistry),'nikita',old,oldRegistry);
  complete=old.reducer(complete,{type:'STATS_ADVANCE',index:0});
  for(const version of [1,2,3,4,5]) {
    const input=structuredClone(complete);input.version=version;
    if(version===1) {input.nikita=input.stories.nikita;delete input.stories;}
    const restored=model.restore(JSON.stringify(input));
    assert.equal(restored.stories.ilya.unlocked,0);assert.equal(restored.stories.ilya.completed,false);
    assert.deepEqual(restored.stories.nikita.opened,complete.stories.nikita.opened);
    assert.deepEqual(restored.stories.nikita.answers,complete.stories.nikita.answers);
    assert.deepEqual(restored.quiz,complete.quiz);assert.deepEqual(restored.stats,complete.stats);
    if(version>=3) assert.deepEqual(restored.stories.nikita,complete.stories.nikita);
    if(version>=2) assert.deepEqual(restored.stories.liza,complete.stories.liza);
  }
});
test("disabling and re-enabling local preview never deletes Ilya progress",()=>{
  let s=reachMaterials();s=send(s,'MATERIAL',{id:'kirill-conversation'});
  s=send(s,'MATERIAL_POSITION',{id:'kirill-conversation',position:2});
  const standard=createExhibitionModel(storyRegistry,exhibitionConfig);
  const hidden=standard.restore(JSON.stringify(s));
  assert.deepEqual(hidden.stories.ilya,s.stories.ilya);
  assert.equal(standard.allowedPath('/stories/ilya/materials',hidden),'/stories');
  assert.deepEqual(model.restore(JSON.stringify(hidden)).stories.ilya,s.stories.ilya);
});
