import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storyMoments, queueStoryMoments, renderStoryMoment, offlineInsights, renderOfflineInsights, STORY_QUEUE_LIMIT} from '../src/ui/story-moments.js';

const vm = () => ({bears:{value:0},stats:{maxBears:0,totalTicks:0,totalResets:0},buildings:[],science:[],resources:[],space:[],settings:{paused:false}});
test('initial load, import suppression and in-flight settlement never celebrate', () => {
  const before=vm(), after=vm();after.bears.value=1;
  assert.deepEqual(storyMoments(null,after),[]);
  assert.deepEqual(storyMoments(before,after,{suppressed:true}),[]);
  for(const flag of ['catchingUp','pendingOffline','pendingOperation']) {
    assert.deepEqual(storyMoments({...before,[flag]:1},after),[]);
    assert.deepEqual(storyMoments(before,{...after,[flag]:1}),[]);
  }
});
test('only the first population arrival, never routine replacement, is a story moment', () => {
  const before=vm(), after=vm();after.bears.value=1;
  assert.equal(storyMoments(before,after)[0].id,'first-bear');
  before.stats.maxBears=2;assert.deepEqual(storyMoments(before,after),[]);
  before.bears.value=1;after.bears.value=2;assert.deepEqual(storyMoments(before,after),[]);
});
test('region story follows real geographic threshold, not a visible or single building', () => {
  const before=vm(), after=vm();after.buildings=[{id:'mine',owned:1}];
  assert.deepEqual(storyMoments(before,after),[]);
  after.buildings.push({id:'quarry',owned:1});
  assert.equal(storyMoments(before,after)[0].id,'first-region');
  assert.equal(storyMoments(before,after)[0].title,'矿脉山岭');
  assert.deepEqual(storyMoments(after,after),[]);
});
test('first spaceflight requires an owned mission, not rocket research or an unlocked card', () => {
  const before=vm(), after=vm();after.space=[{id:'orbitalLaunch',family:'mission',name:'初探星空',unlocked:true,owned:0}];
  assert.deepEqual(storyMoments(before,after),[]);
  after.space[0].owned=1;assert.equal(storyMoments(before,after)[0].id,'first-spaceflight');
  assert.deepEqual(storyMoments(after,after),[]);
});
test('era crossing celebrates only forward movement and the actual final era', () => {
  const before=vm(), after=vm();after.science=[{id:'construction',completed:true},{id:'rocketry',completed:true}];
  assert.deepEqual(storyMoments(before,after).map(event=>event.id),['era-stellar']);
  assert.deepEqual(storyMoments(after,before),[]);
  after.stats.totalResets=1;assert.deepEqual(storyMoments(before,after),[]);
});
test('queue is bounded, stable, deduplicated and has no side effects', () => {
  const queue=[{id:'a'}], incoming=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
  assert.deepEqual(queueStoryMoments(queue,incoming).map(event=>event.id),['a','b','c']);
  assert.equal(queueStoryMoments(queue,incoming).length,STORY_QUEUE_LIMIT);
  assert.deepEqual(queueStoryMoments([],incoming,new Set(['a','b'])).map(event=>event.id),['c','d']);
  assert.equal(queue.length,1);assert.equal(incoming.length,4);
});
test('render is nonmodal, safely escaped, politely announced and dismissible', () => {
  const html=renderStoryMoment({id:'x"',kind:'bear',caption:'<script>',title:'A&B',body:'<img>'});
  assert.match(html,/role="status"/);assert.match(html,/aria-live="polite"/);assert.match(html,/data-command="close-story-moment"/);
  assert.match(html,/&lt;script&gt;/);assert.match(html,/A&amp;B/);assert.doesNotMatch(html,/<script>|<img>|role="dialog"|autofocus/);
  assert.equal(renderStoryMoment(null),'');
  assert.match(renderStoryMoment({id:'bear'},'<span class="atlas"></span>'),/class="atlas"/);
});
test('offline insights use actual net population, current capacity and current honey rates', () => {
  const current=vm();current.resources=[{id:'wood',name:'木材',value:100,max:100,rate:2},{id:'honey',name:'蜂蜜',value:20,max:500,rate:-1}];
  const report={seconds:600,bears:-2,resources:{wood:30,honey:-40}};
  assert.deepEqual(offlineInsights(report,current),['离开期间，伙伴净减少了 2 只。','木材现在已存满。','当前蜂蜜净产量为负，口粮正在减少。']);
  current.settings.paused=true;assert.equal(offlineInsights(report,current).length,2);
  assert.deepEqual(offlineInsights(null,current),[]);
  assert.deepEqual(offlineInsights({seconds:0},current),[]);
});
test('offline copy does not invent milestones or future unlocks, and all helpers are pure', () => {
  const before=vm(), after=vm(),report={seconds:120,bears:1,resources:{wood:4}};
  after.bears.value=1;after.resources=[{id:'wood',name:'<木材>',value:4,max:100}];
  const original=JSON.stringify([before,after,report]);
  storyMoments(before,after);const html=renderOfflineInsights(report,after);
  assert.match(html,/伙伴净增加了 1 只/);assert.doesNotMatch(html,/解锁|下一步|任务/);
  report.bears=0;assert.match(renderOfflineInsights(report,after),/&lt;木材&gt;/);report.bears=1;
  assert.equal(JSON.stringify([before,after,report]),original);
});
test('CSS has reduced-motion support and a touch-sized close button', () => {
  const css=readFileSync(new URL('../src/styles/story-moments.css',import.meta.url),'utf8');
  assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/\.motion-reduced \.story-moment/);assert.match(css,/min-height:44px/);
});
