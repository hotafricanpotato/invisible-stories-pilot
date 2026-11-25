import {expect} from '@playwright/test';
import {test} from './support.js';
import * as model from '../../src/state/model.js';
import {storyRegistry} from '../../src/content/storyRegistry.js';
import {finishStory} from '../story-helpers.js';
async function ratio(locator){return locator.evaluate(el=>{
 const rgb=s=>{const n=s.match(/[\d.]+/g).map(Number);return [...n.slice(0,3),n[3]??1];};const over=(a,b)=>[...a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])),1];
 const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 let bg=[255,255,255,1],layers=[];for(let a=el;a;a=a.parentElement)layers.unshift(rgb(getComputedStyle(a).backgroundColor));for(const l of layers)bg=over(l,bg);const fg=over(rgb(getComputedStyle(el).color),bg);return (Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
 });}
test('small navigation, statuses, material controls and start button meet 4.5:1, including primary hover',async({page})=>{
 await page.goto('http://pilot.test/');const start=page.getByRole('button',{name:'Начать выставку →'});expect(await ratio(start)).toBeGreaterThanOrEqual(4.5);await start.hover();expect(await ratio(start)).toBeGreaterThanOrEqual(4.5);
 const done=['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),model.initialState());await page.evaluate(s=>localStorage.setItem('invisible-stories:pilot:v1',JSON.stringify(s)),done);
 for(const route of ['/stories','/stories/liza/materials','/stories/nikita/materials','/stories/ilya/materials','/statistics/2']){
  await page.goto('http://pilot.test'+route);await page.mouse.move(0,0);
  for(const el of await page.locator('.route-strip span,.archive-card-status,.disclosure').all())expect(await ratio(el),await el.innerText()).toBeGreaterThanOrEqual(4.5);
  for(const el of await page.locator('main button.primary:not(:disabled)').all()){await el.hover();await expect.poll(()=>ratio(el),{message:await el.innerText()}).toBeGreaterThanOrEqual(4.5);}
 }
});
