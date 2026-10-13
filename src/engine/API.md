# 蜜林小熊文明引擎接口

引擎使用原生 ES 模块实现，面向玩家的文案均为中文。

```js
import { createGame, loadGame, importGame, catalog, constants } from './engine/index.js';
const game = loadGame(); // 尝试读取 localStorage，否则创建新游戏
const vm = game.snapshot(); // 也可调用 getViewModel() 或 getState()
const outcome = game.act('build', 'hive', 1); // 返回 {ok, message, ...}
game.dispatch({type:'build',id:'hive',amount:1}); // 等价操作
game.tick(0.2); // 经过的真实秒数；内部以固定 5 Hz 推进
game.subscribe((snapshot) => render(snapshot)); // 返回取消订阅函数
game.save(); // 同步返回 {ok, message}，安全处理存储失败
game.export(); // 等同 exportSave()，返回带版本号的 JSON 文本
game.importSave(text); // 校验后替换当前游戏状态
game.setSetting('paused', true);
```

`createGame` 和 `loadGame` 接受以下选项：`seed` 为整数种子；`now` 为纪元毫秒数或返回该值的函数；`storage` 为类似 `Storage` 的对象或 `null`；可选的 `save` 为已导出的 JSON 字符串。`importGame(text, options)` 返回新游戏，输入无效时抛出可读的 `Error`。`loadGame` 不会破坏损坏的持久化数据，而是启动新会话并给出警告，不会自动保存并覆盖损坏的存档槽。

## 状态快照

- `resources`：`{id,name,value,max,rate,visible,description}`。无上限资源的 `max` 可以为 `null`；`rate` 为每真实秒的速率。
- `buildings`、`crafts`、`science`、`workshop`、`jobs`、`faith`、`space`、`trades`、`challenges`：操作卡片数组，字段为 `{id,type,name,description,unlocked,available,reason,costs:[{id,name,value,owned}],owned,effects}`。职业卡另有 `assigned`。`unlocked` 表示规则解锁条件，禁用原因给出首个未满足条件。一次性卡片完成后为 `owned=1`、`completed=true`；`effects` 可直接显示。
- `actions`：采集、精炼、狩猎、赞颂和观测等简单操作卡片。
- `calendar`：`{year,season,seasonName,day,weather,weatherName}`，其中 `season` 为 0–3。
- `bears`：`{value,max,free,happiness,jobs}`，幸福度以百分比表示。
- `log`：按新到旧排列的 `{id,text,kind,at}` 记录。
- 其他字段：`stats`、`settings`、`saveStatus`、`coverage`、`offlineReport`、`progression`、`resetPreview`。

### 按需决策预览

`snapshot(options)` 可请求当前选项的实际生产变化。预览不扣款、不推进时钟、不消耗随机数，也不修改存档；速率均为每真实秒的净收支，暂停时表示恢复生产后的速率。它们只比较当前季节、库存和加成下的同一时刻，不能当成长期产量保证。

```js
const buildingView = game.snapshot({buildingTargets:['hive','library']});
const selectedView = game.snapshot({batchTarget:{section:'buildings',id:'hive'}});
const transferView = game.snapshot({jobTransfer:{from:'woodcutter',to:'scholar',amount:5}});
```

- `buildingTargets`：待预览的普通建筑标识符数组，去重后最多计算 6 项。`batchTarget.section === 'buildings'` 时会优先加入该建筑；无效标识符、尚未开放且未持有的建筑、已达到数量上限的建筑不返回预览。不传入目标时，`buildingPreviews` 为空数组。
- `buildingPreviews` 中每项为 `{id,name,amount:1,available,mode,resources,energy,housing,note}`，始终比较新增一座。`mode:'purchase'` 表示当前能购买，计算包含实际建造费用扣除与新增设施的影响；`mode:'structure'` 表示当前物资未齐，仅比较新增设施，不扣除建造费用。界面必须区分这两种预估。
- 建筑预览的 `resources` 只包含发生变化的资源，每项为 `{id,name,beforeRate,afterRate,rateDelta,beforeCapacity,afterCapacity,capacityDelta}`。无上限容量可能为 `null`；不能计算有限容量差时，`capacityDelta` 为 `null`。`energy` 包含供给、需求及能源效率的前后值：`beforeSupply/afterSupply`、`beforeDemand/afterDemand`、`beforeEfficiency/afterEfficiency`。`housing` 为 `{before,after,delta}`。
- `jobTransfer` 为 `{from,to,amount}`，`amount` 默认 1，接受正整数或 `'max'`。响应 `jobTransferPreview` 为 `{from,to,requested,actualCount,available,reason,resources,note}`；未请求时为 `null`。`actualCount` 已计入原岗位人数和目标容量；不可调动时为 0，`reason` 说明原因。`resources` 只包含净收支有变化的资源，每项为 `{id,name,beforeRate,afterRate,rateDelta}`。

预览不会保留操作资格。确认操作前应读取最新预览，并以 `act()` 的结果为准。

## 基础操作

操作类型包括 `gather`、`refine`、`build`、`craft`、`research`、`upgrade`、`assign`、`unassign`、`reassign`、`hunt`、`trade`、`explore`、`praise`、`faith`、`space`、`observe`、`reset`、`challenge`。数量默认为 1，在适用时接受正整数或 `'max'`。`act('toggle', buildingId)` 切换生产状态。失败的操作不消耗资源。重置须调用 `act('reset','confirm')`；`act('challenge', challengeId)` 选择挑战并开始重置。界面须在重置、挑战或导入前取得明确确认。

`act('reassign','原岗位标识符:目标岗位标识符',amount)` 将在岗伙伴直接调入另一岗位，例如 `game.act('reassign','woodcutter:scholar',5)`。它先检查岗位门槛、挑战限制与容量，再一次性变更；失败不会先撤回伙伴，成功返回实际调动人数 `actualCount`。数量超过原岗位人数或目标剩余容量时只调动可行人数；`'max'` 表示当前最多。选人沿用原岗位撤回规则，不占用已有空闲伙伴；调动的工程熊会清除原制作配方，其他工程熊的配方不变。该操作不新增存档字段。

新游戏从空库存开始。运行时接口不提供演示库存、开发加速控件、网络调用或付费捷径。普通时间加速和时间水晶旅行属于需要通过游戏进度获得的规则。

## 扩展系统与一致性（2026-10-08）

- `snapshot().buildingStages` 包含五种替换建筑卡片。`act('stage', id)` 出售当前阶段，返还符合条件材料的 50%，清空数量并选用另一蓝图，但不赠送替换建筑。调用前须在界面展示并确认 `confirmationText`。
- `act('sell', buildingId, amount)` 接受正整数或 `max`；石油、煤油和钍不返还。人工智能核心达到 15 级后可能拒绝出售。
- `snapshot().workshopDynamics.cards` 提供已解锁的独立自动化开关；`act('automation', buildingId)` 切换附加流程，不改变建筑数量。
- `snapshot().diplomacy` 提供大使上限、维护成本、实际库存能支持的产出及贸易修正。大使使用普通的分配与撤职操作，需要大使声望特权。使馆高级商品仍各自要求资源发现和使馆等级。
- `game.getLeadership({page, pageSize, filter})` 返回分页名册。默认每页 25 位，最多 50 位，页码从 0 开始。筛选匹配姓名、标识符、职业和特质。默认快照名册也有分页限制，底层居民模拟不截断。
- 核心存档保留 `ironWill`、`buildingStages`、`activeBuildings`、`automationDisabled`、`industryState`、`elderState`、`blackcoinState`、`zebraKarma`、`resourceUnlocked`、进行中与待开始的挑战及储备。新增属性在版本 1 存档结构内提供迁移默认值。价格必须为正，所有导入数值均检查有限性和范围。
- 多挑战选择、储备、长者供养和黑币市场由 `snapshot().progression.actions` 提供，应优先使用动态卡片。

## 离线与时间结算

网页离线生产默认关闭。开启后，`loadGame({deferOffline:true})` 安排经过时长，`await game.catchUpAsync(undefined,{onProgress,signal})` 执行压缩离线结算生成器。同步的 `simulate(seconds,{offline:true})` 与异步结算共用批量规则。通常最多结算 8,000 真实秒（10 游戏年）；到达第 1000 年或拥有正数声望后，上限为 32,000 秒。

经济批次保留当前季节、日期和步内位置；可计算的队列等待时间向上取整到整年区间，每段结束后处理一次队列。日历事件按批次取整，年份在经济区间处理后推进。缓存速率的离线路径不扣除负净产量的蜂蜜；默认离线核心不产生新的算力。批量结算与实时模拟遵循不同约定。结算调用返回的 `ticks` 表示等效模拟步数，不改变实际实时步数计数。

安排或执行结算时，操作、导入、设置、普通时钟、保存与导出均被锁定，存储保留最后一个完整检查点。失败或 `AbortSignal` 取消时，内存恢复该检查点；结算完成前关闭再打开，会从未变的存储检查点重放。生成器阶段之间让出主线程，但异常大的导入人口仍可能让单个管理阶段耗时较长。

可能产生长时间跳跃时，使用 `await game.actAsync('shatter',id,amount,{onProgress,signal})` 或 `actAsync('useFurnaceHeat',...)`。它们保留扣款前的原子检查点，按精确年度边界分批处理，每批最多 25 年或 10 毫秒后让出执行权，并报告 `pendingOperation.kind='timeJump'`。耗时有界的调用仍可使用同步接口。

## 队列、工程师与成就

附加快照字段包括 `queue`、`engineers`、`embassies`、`achievements`、`badges`、`badgeTotals` 和 `undo`。队列使用带 `type:id` 参数的 `queueEnqueue`，以及 `queueRemove`、`queueUp`、`queueDown`、`queueClear('confirm')`。工程师按配方使用 `engineerAssign` 和 `engineerUnassign`。购买节庆需要戏剧研究，嘉年华允许累积年数。成就记录跨重置保留，当轮计数重新开始；展示遵循隐藏和秘密条目的规则。

`undo` 仅保留为未激活的兼容快照。通用撤销已停用，不再记录操作凭据；`act('undo','undo')` 会拒绝且不修改状态。内部操作失败回滚和结算恢复保持有效。

## 季节礼物

使用 `snapshot().gifts.cards` 和 `act('openGift','elderBox',1)`。页面初次创建时检查浏览器本地真实日期：12 月 15–31 日期间，未持有礼盒时发放一个；离开该日期窗口后可开启。九种奖励分支根据开启时的实际进度选择。不增加年度领取标志、周期日期轮询、人为时钟控件、导入发放或重置发放。现有礼物库存与包装纸沿用普通的资源存档校验字段。
