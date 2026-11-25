import test from 'node:test';
import assert from 'node:assert/strict';
import {assetUrl} from '../src/utils/assetUrl.js';
test('asset URL respects deployment base and leaves external/empty URLs unchanged',()=>{
 for(const base of ['/','/invisible-stories-pilot/']) assert.equal(assetUrl('/assets/liza/photo.webp',base),base+'assets/liza/photo.webp');
 for(const src of [undefined,null,'','https://example.org/photo.webp','data:image/png;base64,abc','relative.webp']) assert.equal(assetUrl(src,'/invisible-stories-pilot/'),src);
});
