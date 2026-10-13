import test from 'node:test';
import assert from 'node:assert/strict';
import {syncPresentationLayout} from '../src/ui/layout.js';

test('管理面板隔离被遮住的场景，桌面展开后恢复，消息跟随实际资源栏',()=>{
  const attrs=new Map(),styles=new Map();let focused=false;
  const sceneButton={},world={contains:el=>el===sceneButton,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)};
  const controls={},main={focus:()=>focused=true};
  const app={ownerDocument:{activeElement:sceneButton,documentElement:{style:{setProperty:(k,v)=>styles.set(k,v)}}},querySelector:s=>({'.world-board':world,'.home-controls':controls,'#main-content':main,'#resource-bar':{getBoundingClientRect:()=>({bottom:193.5})}})[s]};
  syncPresentationLayout(app,{page:'research'},390);
  assert.equal(world.inert,true);assert.equal(attrs.get('aria-hidden'),'true');assert.equal(focused,true);assert.equal(controls.inert,true);assert.equal(styles.get('--hud-bottom'),'194px');
  syncPresentationLayout(app,{page:'research'},1440);
  assert.equal(world.inert,false);assert.equal(attrs.has('aria-hidden'),false);
  syncPresentationLayout(app,{page:'research',managementMapCollapsed:true},1440);
  assert.equal(world.inert,true);
  syncPresentationLayout(app,{page:'home',managementMapCollapsed:true},390);
  assert.equal(world.inert,false);assert.equal(controls.inert,false);
});
