# Beargame engine API

Independent vanilla ES modules. All user-visible strings are newly authored Chinese copy.

```js
import { createGame, loadGame, importGame, catalog, constants } from './engine/index.js';
const game = loadGame(); // attempts localStorage, otherwise starts a new game
const vm = game.snapshot(); // aliases getViewModel() and getState()
const outcome = game.act('build', 'hive', 1); // {ok, message, ...}
game.dispatch({type:'build',id:'hive',amount:1}); // equivalent
game.tick(0.2); // elapsed real seconds; internally fixed 5Hz
game.subscribe((snapshot) => render(snapshot)); // returns unsubscribe
game.save(); // {ok, message}; synchronous, safe on storage failures
game.export(); // aliases exportSave(), returns versioned JSON text
game.importSave(text); // validates then replaces this game's state
game.setSetting('paused', true);
```

Options to createGame/loadGame: seed (integer), now (epoch milliseconds or function), storage (Storage-like object or null), save (exported JSON string, optional). importGame(text, options) returns a new game and throws a readable Error on invalid input. loadGame never destroys corrupt persisted data: it starts a clean session and reports a warning without autosaving over the corrupt slot.

Snapshot:
- resources: `{id,name,value,max,rate,visible,description}`; max can be null for uncapped; rate is per real second.
- buildings, crafts, science, workshop, jobs, faith, space, trades, challenges: action-card arrays with `{id,type,name,description,unlocked,available,reason,costs:[{id,name,value,owned}],owned,effects}`. Job cards also have `assigned`. `unlocked` is the mechanical gate; disabled reason gives the first missing requirement. One-use completed cards have owned=1 and completed=true. `effects` is display-ready text.
- actions: simple gather/refine/hunt/praise/observe cards.
- calendar: `{year,season,seasonName,day,weather,weatherName}`. season is 0–3.
- bears: `{value,max,free,happiness,jobs}`; happiness is a percentage.
- log: newest first `{id,text,kind,at}`.
- stats, settings, saveStatus, coverage, offlineReport, progression, resetPreview.

Action types: gather, refine, build, craft, research, upgrade, assign, unassign, hunt, trade, explore, praise, faith, space, observe, reset, challenge. Amount defaults to 1; accept a positive integer or `'max'` where meaningful. Toggle production with act('toggle', buildingId). A failed action never spends resources. Reset requires act('reset','confirm'); challenge selection requires act('challenge', challengeId) and starts a reset. UI must obtain its own clear confirmation before reset/challenge/import.

New games start empty. No demonstration stock, developer-speed controls, network calls, or purchased shortcuts are part of the runtime API. Ordinary time acceleration and time-crystal travel are earned game mechanics.

## Extended systems and consistency (2026-10-08)

- `snapshot().buildingStages` contains the five replacement-building action cards. `act('stage', id)` sells the current stage, refunds eligible material at 50%, clears its count, and selects the alternate blueprint. It does not grant the replacement buildings. Confirm the supplied `confirmationText` in the UI before calling.
- `act('sell', buildingId, amount)` supports a positive count or `max`; oil, kerosene, and thorium are not refunded. AI cores can reject sale once their level reaches 15.
- `snapshot().workshopDynamics.cards` exposes each unlocked independent automation switch. `act('automation', buildingId)` switches that extra process without changing the construction count.
- `snapshot().diplomacy` reports ambassador limits, upkeep, actual stock-supported output and trade modifiers. Ambassadors use the normal assign/unassign action and require the ambassadors prestige perk. Every advanced embassy good still requires its resource discovery and embassy level.
- `game.getLeadership({page, pageSize, filter})` returns a bounded roster. Default page size is 25, maximum 50, and pages are zero based. Filtering matches name, id, job and trait. The default snapshot roster is also bounded; the underlying bear simulation is not truncated.
- Core state now persists `ironWill`, `buildingStages`, `activeBuildings`, `automationDisabled`, `industryState`, `elderState`, `blackcoinState`, `zebraKarma`, `resourceUnlocked`, active/pending challenges and reserve storage. New properties have migration defaults within the version-1 save schema. Prices must stay positive and all imported numerical values are finite and range checked.
- Multiple challenge selection, reserves, elder feeding and the blackcoin market are exposed through `snapshot().progression.actions`; prefer dynamic cards to static catalogs.

Offline web production is disabled initially. When enabled, `loadGame({deferOffline:true})` schedules elapsed time and `await game.catchUpAsync(undefined,{onProgress,signal})` runs the independently authored compressed redshift generator. Both synchronous `simulate(seconds,{offline:true})` and asynchronous settlement use the same bulk rules. The normal maximum is 8,000 real seconds (10 game years), or 32,000 seconds after year 1000 or positive paragon.

Economy batches preserve the current seasonal/day/tick position; computable queue waits are rounded upward to whole-year segments, and the queue processes once after each segment. Calendar events are rounded bulk quantities and years advance after the economy segments. Negative honey balance is not consumed by the offline cached-rate path. Default offline cores do not produce new computing. This intentionally differs from the active clock, using the bulk settlement contracts. `offlineReport.ticks` is equivalent elapsed duration; the actual live tick counter is unchanged.

While settlement is scheduled/running, action, import, settings, normal ticking, save and export are locked. Storage remains at the last complete checkpoint. Failure or AbortSignal cancellation restores that checkpoint in memory. Closing/reopening before completion replays the unchanged stored checkpoint. The host yields between generator stages; unusually large imported bear populations can still make an individual manager stage expensive.

Use `await game.actAsync('shatter',id,amount,{onProgress,signal})` or `actAsync('useFurnaceHeat',...)` for potentially large time jumps. These preserve an atomic pre-payment checkpoint, process exact annual boundaries in batches of up to 25 yielded years/10 ms, and report `pendingOperation.kind='timeJump'`. The synchronous action API remains available for bounded callers.

Additional snapshots: `queue`, `engineers`, `embassies`, `achievements`, `badges`, `badgeTotals` and `undo`. Queue actions are `queueEnqueue` with `type:id`, `queueRemove`, `queueUp`, `queueDown` and `queueClear('confirm')`. Engineers use `engineerAssign`/`engineerUnassign` by recipe. Festival purchases require drama; carnivals enables cumulative years. Achievement records survive resets, while run counters restart. Presentation preserves hidden/secret entry behavior.

`undo` remains an inactive compatibility snapshot. General undo is disabled: no receipts are captured; `act('undo','undo')` rejects without altering state. Internal action-error rollback and settlement recovery are unchanged.

Seasonal gifts use `snapshot().gifts.cards` and `act('openGift','elderBox',1)`. Initial page construction checks the browser-local real date: December15–31 grants a held gift when absent, and opening is available after that date window. The nine reward branches are selected from actual progress at opening. No annual claim flag, periodic date poll, artificial clock control, import-side grant, or reset-side grant is added. Existing gift inventory and wrapping paper use the normal validated resource save fields.
