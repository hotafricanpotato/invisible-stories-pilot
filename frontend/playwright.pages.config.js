import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/pages',outputDir:'test-results/pages',workers:1,timeout:60000,
 use:{headless:true,launchOptions:{...(process.env.PLAYWRIGHT_BUNDLED_CHROMIUM ? {} : {executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'}),args:['--no-sandbox']}},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}],
});
