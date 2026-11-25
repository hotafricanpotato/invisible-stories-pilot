import {expect} from '@playwright/test';
import path from 'node:path';
import {test,noOverflow,completeFinalTestInBrowser} from './support.js';
import * as model from '../../src/state/model.js';
import {storyRegistry} from '../../src/content/storyRegistry.js';
import {finishStory} from '../story-helpers.js';
import content from '../../src/content/epilogue.json' with {type:'json'};
const ready=()=>['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),model.initialState());
const saved=page=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('invisible-stories:pilot:v1')));
async function seed(page,s){await page.goto('http://pilot.test/');await page.evaluate(s=>sessionStorage.setItem('invisible-stories:pilot:v1',JSON.stringify(s)),s);}
const artifacts=process.env.ARTIFACT_DIR||path.resolve('../../output');
test('statistics, real final test, exact epilogue, reload, history return, confirmed restart and screenshots',async({page},info)=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await seed(page,ready());await page.goto('http://pilot.test/statistics/3');await page.getByRole('button',{name:'Завершить просмотр',exact:true}).click();await completeFinalTestInBrowser(page);
 await expect(page).toHaveURL(/\/epilogue$/);await expect(page.getByRole('heading',{level:1})).toHaveText(content.title);await expect(page.locator('.statistics-shell')).toHaveCSS('background-color','rgb(241, 233, 225)');await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 const expected=content.blocks.filter(b=>b.type!=='divider').map(b=>b.text);
 const actual=await page.locator('.epilogue-text p,.epilogue-closing > p').evaluateAll(ps=>ps.map(p=>{const copy=p.cloneNode(true);copy.querySelector('.epilogue-sources')?.remove();return copy.textContent.trim();}));expect(actual).toEqual(expected);
 await expect(page.locator('.epilogue strong')).toHaveCount(4);await expect(page.locator('.epilogue em')).toHaveText(content.blocks.find(b=>b.type==='note').text);await expect(page.locator('.epilogue hr')).toHaveCount(2);await expect(page.locator('.epilogue img,.epilogue svg,.epilogue canvas')).toHaveCount(0);
 for(const source of content.sources)await expect(page.getByRole('link',{name:source.label,exact:true})).toHaveAttribute('href',source.url);
 const before=await saved(page);await page.reload();expect(await saved(page)).toEqual(before);
 for(const width of [320,390,430,768,1440,1920]){await page.setViewportSize({width,height:1000});await noOverflow(page);const clipped=await page.locator('.epilogue p,.epilogue h1,.epilogue a').evaluateAll(els=>els.filter(el=>{const b=el.getBoundingClientRect();return b.left<-.5||b.right>innerWidth+.5;}).map(el=>el.textContent));expect(clipped).toEqual([]);}
 const width=info.project.name==='desktop'?1440:390;await page.setViewportSize({width,height:1000});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${artifacts}/epilogue-${width}px.png`,fullPage:true});
 await page.getByRole('button',{name:'Вернуться к историям',exact:true}).click();await expect(page).toHaveURL(/\/stories$/);await expect(page.locator('.archive-card-status').filter({hasText:'Пройдена'})).toHaveCount(3);
 let current=await saved(page);expect(current.stories).toEqual(before.stories);expect(current.stats).toEqual(before.stats);expect(current.finalTest).toEqual(before.finalTest);
 await page.goto('http://pilot.test/complete');await expect(page).toHaveURL(/\/epilogue$/);const restart=page.getByRole('button',{name:'Пройти выставку заново',exact:true});await restart.focus();await page.keyboard.press('Enter');await expect(page.getByRole('region',{name:'Сброс прогресса'})).toBeVisible();expect(await saved(page)).toEqual(before);
 await page.getByRole('button',{name:'Отмена',exact:true}).click();await expect(restart).toBeFocused();expect(await saved(page)).toEqual(before);
 await restart.click();await page.getByRole('button',{name:'Удалить прогресс и начать',exact:true}).click();await expect(page).toHaveURL('http://pilot.test/');current=await saved(page);expect(current).toEqual(model.initialState());
 await page.getByRole('button',{name:'Начать выставку →',exact:true}).click();await expect(page).toHaveURL(/\/stories$/);await expect(page.locator('[aria-labelledby="card-liza"] .archive-card-status')).toHaveText('Доступна');await page.goto('http://pilot.test/epilogue');await expect(page).toHaveURL(/\/stories$/);
 expect(errors).toEqual([]);expect(requests.filter(url=>!url.startsWith('http://pilot.test/'))).toEqual([]);
});
test('old complete and epilogue cannot bypass story, statistics or final-test prerequisites',async({page})=>{
 for(const url of ['/complete','/epilogue']){
  await seed(page,model.initialState());await page.goto('http://pilot.test'+url);await expect(page).toHaveURL(/\/stories$/);
  let s=ready();await seed(page,s);await page.goto('http://pilot.test'+url);await expect(page).toHaveURL(/\/statistics\/1$/);
  s=model.reducer(s,{type:'STATS_COMPLETE'});delete s.finalTest;s.cursor='/complete';await seed(page,s);await page.goto('http://pilot.test'+url);await expect(page).toHaveURL(/\/final-test\/1$/);
  s=model.restore(JSON.stringify(s));s=model.reducer(s,{type:'FINAL_ANSWER',id:'1',value:'A'});s=model.reducer(s,{type:'FINAL_NEXT',page:1});s.finalTest.completed=true;await seed(page,s);await page.goto('http://pilot.test'+url);await expect(page).toHaveURL(/\/final-test\/2$/);
 }
});
