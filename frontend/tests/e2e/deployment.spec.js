import {expect} from '@playwright/test';
import {test} from './support.js';
test('default build keeps clean BrowserRouter URLs and keyboard skip without changing URL',async({page})=>{
 await page.goto('http://pilot.test/');await expect(page.locator('.home-shell')).toBeVisible();
 await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();await expect(page).toHaveURL('http://pilot.test/');
 await page.getByRole('button',{name:'Начать выставку →',exact:true}).click();await expect(page).toHaveURL('http://pilot.test/stories');await page.reload();await expect(page.locator('.selection-shell')).toBeVisible();
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 for(const image of await page.locator('img').all())expect(await image.getAttribute('src')).toMatch(/^\/assets\//);
});

import {registerResetRegression} from '../reset-regression.js';
registerResetRegression(test,route=>'http://pilot.test'+route);
