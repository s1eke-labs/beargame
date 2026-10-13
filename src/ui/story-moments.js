import {civilizationEra, geographicRegions} from './districts.js';

/** Presentation only: caller owns the transient queue, lifetime and lifecycle resets. */
export const STORY_QUEUE_LIMIT = 3;
export const STORY_DURATION_MS = 6500;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => Number.isFinite(value) ? value : 0;
const count = value => new Intl.NumberFormat('zh-CN', {maximumFractionDigits:1}).format(number(value));
const busy = vm => !!(vm?.catchingUp || vm?.pendingOffline || vm?.pendingOperation);
const missions = vm => (vm?.progression?.spaceCards || vm?.space || []).filter(card => card.family === 'mission' && card.owned > 0);
const eraOrder = ['forest', 'settlement', 'industrial', 'stellar'];

/** Compare consecutive live snapshots only. Initial load/import must pass null or suppressed. */
export function storyMoments(previous, next, {suppressed = false} = {}) {
  if (!previous || !next || suppressed || busy(previous) || busy(next)) return [];
  // A backwards clock/reset is never a live milestone transition.
  if (number(next.stats?.totalTicks) < number(previous.stats?.totalTicks) || number(next.stats?.totalResets) !== number(previous.stats?.totalResets)) return [];
  const events = [];
  if (number(previous.bears?.value) === 0 && number(previous.stats?.maxBears) === 0 && number(next.bears?.value) > 0) {
    events.push({id:'first-bear', kind:'bear', caption:'蜜林记事 · 第一位伙伴', title:'小屋里，有了新的脚步声', body:'第一只小熊搬进了蜜林。一起生活的故事，从这里开始。'});
  }
  const beforeRegions = geographicRegions(previous).filter(region => region.id !== 'village');
  const afterRegions = geographicRegions(next).filter(region => region.id !== 'village');
  if (!beforeRegions.length && afterRegions.length) {
    const region = afterRegions[0];
    events.push({id:'first-region', kind:'region', caption:'蜜林记事 · 家园长大了', title:region.name, body:'几处设施连成了新的街区，家园的地图也添了一页。'});
  }
  if (!missions(previous).length && missions(next).length) {
    const mission = missions(next)[0];
    events.push({id:'first-spaceflight', kind:'space', caption:'蜜林记事 · 第一次远航', title:'从树梢，走向星空', body:`「${mission.name || '星空航行'}」已经启程。蜜林的故事，第一次写到了天上。`});
  }
  const beforeEra = civilizationEra(previous), afterEra = civilizationEra(next);
  if (eraOrder.indexOf(afterEra.id) > eraOrder.indexOf(beforeEra.id)) {
    events.push({id:`era-${afterEra.id}`, kind:'era', caption:'蜜林记事 · 新的一页', title:afterEra.name, body:'新的知识已写进书页，小熊们的文明又向前走了一步。'});
  }
  return events.slice(0, STORY_QUEUE_LIMIT);
}

/** `seen` may be a Set of previously displayed IDs. No save/localStorage writes. */
export function queueStoryMoments(queue = [], incoming = [], seen = []) {
  const existing = new Set(seen);
  return [...queue, ...incoming].filter(event => {
    if (!event?.id || existing.has(event.id)) return false;
    existing.add(event.id);
    return true;
  }).slice(0, STORY_QUEUE_LIMIT);
}

/** Mount outside replace-on-render content. `illustration` must be trusted internal art markup. */
export function renderStoryMoment(event, illustration = '') {
  if (!event) return '';
  const mark = {bear:'❦', region:'⌂', space:'✦', era:'✧'}[event.kind] || '❦';
  return `<section class="story-moment" data-story-moment="${escape(event.id)}"><span class="story-moment-mark" aria-hidden="true">${illustration || mark}</span><div class="story-moment-copy" role="status" aria-live="polite" aria-atomic="true"><small>${escape(event.caption)}</small><strong>${escape(event.title)}</strong><p>${escape(event.body)}</p></div><button type="button" class="story-moment-close" data-command="close-story-moment" aria-label="收起蜜林记事">×</button></section>`;
}

/** Describe only recorded deltas and current stock. No inferred unlocks or production forecasts. */
export function offlineInsights(report, vm) {
  if (!report || !(number(report.seconds) > 0)) return [];
  const insights = [], bears = number(report.bears), resources = vm?.resources || [];
  if (bears > 0) insights.push(`离开期间，伙伴净增加了 ${count(bears)} 只。`);
  else if (bears < 0) insights.push(`离开期间，伙伴净减少了 ${count(-bears)} 只。`);
  const capped = resources.filter(resource => number(report.resources?.[resource.id]) > .01 && Number.isFinite(resource.max) && resource.max > 0 && number(resource.value) >= resource.max - 1e-8);
  if (capped.length) insights.push(`${capped.slice(0, 2).map(resource => resource.name || resource.id).join('、')}现在已存满${capped.length > 2 ? `，共有 ${capped.length} 种物资达到容量` : ''}。`);
  const honey = resources.find(resource => resource.id === 'honey');
  if (honey && number(honey.rate) < 0 && !vm?.settings?.paused) insights.push('当前蜂蜜净产量为负，口粮正在减少。');
  if (!insights.length) {
    const gained = resources.find(resource => number(report.resources?.[resource.id]) > .01);
    if (gained) insights.push(`这段时间，${gained.name || gained.id}净增加了 ${count(report.resources[gained.id])}。`);
    else if (Object.values(report.resources || {}).some(value => number(value) < -.01)) insights.push('这段时间有物资净减少，下面列出了实际变化。');
    else insights.push('这段时间没有明显的物资或伙伴数量变化。');
  }
  return insights.slice(0, 3);
}

export function renderOfflineInsights(report, vm) {
  const insights = offlineInsights(report, vm);
  return insights.length ? `<div class="offline-insights"><strong>森林的小记</strong><ul>${insights.map(text => `<li>${escape(text)}</li>`).join('')}</ul></div>` : '';
}
