import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const baseline=JSON.parse(await readFile(new URL('./fixtures/pilot-baseline.json',import.meta.url),'utf8'));
test('approved pilot content, statistics implementation, Vercel and all images remain byte-identical',async()=>{
 for(const [path,hash] of Object.entries(baseline))assert.equal(createHash('sha256').update(await readFile(new URL('../'+path,import.meta.url))).digest('hex'),hash,path);
});
