import test from 'node:test';
import assert from 'node:assert/strict';
import { safeToolUrl, validateEntry, moveActivity, readStored, localDate, navigationTarget, diaryControls } from '../core.mjs';

test('only public HTTPS tool URLs without credentials are accepted', () => {
  assert.equal(safeToolUrl('https://example.org/tools/'), 'https://example.org/tools/');
  for (const url of ['javascript:alert(1)', 'http://example.org', 'https://me:pass@example.org', 'https://localhost/x', 'https://127.0.0.1', 'https://192.168.0.1', 'https://[::1]']) assert.equal(safeToolUrl(url), null);
});
test('diary requires valid date, bounded text, and one of the offered moods', () => {
  const entry = { date: '2026-11-07', title: '작은 변화', mood: 'calm', body: '오늘의 성찰' };
  assert.equal(validateEntry(entry), null);
  for (const patch of [{date:'2026-02-30'}, {title:' '}, {body:'x'.repeat(10001)}, {mood:'unknown'}, {date:'2026-1-1'}]) assert.ok(validateEntry({...entry, ...patch}));
});
test('moving an activity preserves all IDs and cannot move past the edge', () => {
  const list = [{id:'a'}, {id:'b'}, {id:'c'}];
  assert.deepEqual(moveActivity(list, 'b', -1).map(x=>x.id), ['b','a','c']);
  assert.deepEqual(moveActivity(list, 'a', -1), list);
  assert.deepEqual(moveActivity(list, 'missing', 1), list);
  assert.deepEqual(list.map(x=>x.id), ['a','b','c']);
});
test('corrupt browser storage falls back instead of breaking the app', () => {
  assert.deepEqual(readStored('{oops', []), []);
  assert.deepEqual(readStored('null', []), []);
  assert.deepEqual(readStored('[1]', []), [1]);
});
test('local date follows local calendar components', () => {
  assert.equal(localDate(new Date(2026,10,7,0,1)), '2026-11-07');
});
test('tools anchor keeps the diary origin when deciding whether unsaved changes may leave', () => {
  assert.equal(navigationTarget('diary','tools',true,false), 'diary');
  assert.equal(navigationTarget('diary','tools',true,true), 'hub');
  assert.equal(navigationTarget('hub','tools',false,false), 'hub');
});
test('logout remains available even when offline writes are pending', () => {
  assert.deepEqual(diaryControls(true),{editingDisabled:true,logoutDisabled:false});
});
