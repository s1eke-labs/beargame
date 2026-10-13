/**
 * Compatibility hooks for callers of the retired general-undo feature.
 * Actions commit immediately: no resource snapshots, receipts, timers, or
 * trade penalties are retained. Settlement rollback still uses the engine's
 * independent state checkpoints; it is not a player-facing undo operation.
 */
export const UNDO_SECONDS=0;
export const UNDO_TICKS=0;
const unavailable='操作已立即生效，不支持通用撤销。';

export function beginUndoAction(){return null;}
export function finishUndoAction(){return false;}
export function clearUndo(){}
export function advanceUndoClock(){return false;}
export function onUndoDay(){}
// Without trade reversal there are no refunded attempts or anti-reroll debts.
// Returning false keeps the ordinary paid-trade RNG path unchanged.
export function consumeUndoTrade(){return false;}

// Kept for checkpoint callers. No undo session exists to capture or restore,
// and even an old supplied receipt must never reactivate the retired feature.
export function captureUndoSession(){return null;}
export function restoreUndoSession(){}
export function undoView(){
 return {pending:false,available:false,description:'',remainingTicks:0,remainingSeconds:0,reason:unavailable};
}
export function actUndo(ctx,type){
 if(type!=='undo')return undefined;
 return ctx.result(false,unavailable);
}
