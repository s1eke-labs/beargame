/** Proposed additional regression. First test exposes pre-existing reload ownership friction until owned-lease release is integrated. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage} from './dom-harness.mjs';
const LEASE='honeywood-active-tab-v1';
const honey=tab=>tab.snapshot().resources.find(r=>r.id==='honey').value;
test('pagehide releases the owned lease so a refreshed page can immediately continue',async()=>{
 const storage=sharedStorage(s=>s.resources.honey=10),old=await createTab(storage);
 await old.windowEvent('pagehide');const refreshed=await createTab(storage);
 await refreshed.click({act:'gather',id:'honey'});assert.equal(honey(refreshed),11);
});
test('pagehide from a stale page never releases the current owner lease',async()=>{
 const storage=sharedStorage(s=>s.resources.honey=10),a=await createTab(storage),b=await createTab(storage);
 await b.click({command:'takeover'});const owned=storage.values.get(LEASE);await a.windowEvent('pagehide');assert.equal(storage.values.get(LEASE),owned);
 await b.click({act:'gather',id:'honey'});assert.equal(honey(b),11);
});
