/** 决策专用内容；样式和事件由宿主页面统一管理。 */
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(value||0);
const percent=value=>number(value*100)+'%';
export const timeLabel=seconds=>seconds<60?`${Math.ceil(seconds)} 秒`:seconds<3600?`${Math.ceil(seconds/60)} 分钟`:`${number(seconds/3600)} 小时`;
export function actionLabel(c,section,{detail=false}={}){
 const type=c.type||({buildings:'build',science:'research',workshop:'upgrade',crafts:'craft',trades:'trade'})[section];
 const labels={build:'建造',research:'研究',upgrade:'升级',craft:'制作',refine:'采木',trade:'交换',embassy:'建设使馆',praise:'转化信仰',hunt:'巡林',explore:'派熊远行',festival:'举办庆典',observe:'记录星象',faith:'提升祈愿',time:'建造',policy:'选择约定',queueEnqueue:'排队',adore:'转化颂愿',transcend:'提升升华',sacrifice:'转化',burnParagon:'转化传承',challengeStart:'开启所选试炼',reclaimReserves:'取回储备'};
 const label=section==='gifts'?'打开礼盒':type==='space'?(c.family==='mission'?'启程':'建造设施'):labels[type]||c.name;
 return detail&&label!==c.name?`${label} · ${c.name}`:label;
}

export function specializedDecision(c,{compact=false,paused=false}={}){
 if(c.type==='trade'&&c.tradePreview){
  const p=c.tradePreview;
  return `<div class="trade-preview"><p class="trade-odds">${esc(p.season)}季 · 交换成功 ${percent(p.success)}${p.friendly?` · 成功后友好馈赠 ${percent(p.friendly)}`:''}</p>${p.goods.map(g=>`<div class="trade-good"><strong>${esc(g.name)}</strong><span>${number(g.min)}${Math.abs(g.max-g.min)>.001?'–'+number(g.max):''}</span><small>每次交换获得概率 ${percent(g.totalChance)}${g.season?` · 当季 ${g.season>0?'+':''}${percent(g.season)}`:''}</small>${g.mayOverflow?`<small class="storage-warning">最多可存 ${number(g.room)}，部分回报可能溢出</small>`:''}</div>`).join('')}<small class="quiet-note">数量为触发回报时的范围${p.friendly?'，已包含可能的友好加成':''}；未成功仍消耗物资。</small></div>`;
 }
 if(c.type==='praise'&&c.conversionPreview){const p=c.conversionPreview;return `<div class="conversion-preview">投入当前 <b>${number(p.input)} 信仰</b> → 获得 <b>${number(p.output)} 颂愿</b><small>转化后信仰接近清零</small></div>`;}
 if(c.family==='mission')return `<div class="mission-status" role="status">${c.travelDays>0?paused?'正在航行 · 已随游戏暂停':`正在航行 · 约 ${timeLabel(c.travelSeconds)} 后抵达`:(c.reached||c.completed)?'已抵达':'尚未启程'}${!compact&&c.travelDays>0?`<small>还需 ${number(c.travelDays)} 个游戏日；随航速与时流变化</small>`:''}</div>`;
 return '';
}

export function completionLabel(c){return c.family==='mission'?(c.travelDays>0?'正在航行':'已抵达'):'已掌握';}
