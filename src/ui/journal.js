// 手记按玩家关心的变化归组；未读状态只在明确阅读操作后更新。
export function noticeCategory(note) {
  if (note.category === 'return' || note.id.startsWith('offline:')) return 'return';
  if (note.id.startsWith('discovery:') || note.id.startsWith('system:')) return 'unlock';
  if (note.id.startsWith('story:')) return 'growth';
  return 'other';
}

export function journalGroups(notes) {
  return [['return','离开后的变化'],['unlock','新功能与研究'],['growth','家园成长'],['other','林间动态']]
    .map(([id,title]) => ({id,title,notes:notes.filter(note=>noticeCategory(note)===id)}))
    .filter(group=>group.notes.length);
}

export function markNoticesRead(notes, ids) {
  const displayed = new Set(ids);
  return notes.map(note=>displayed.has(note.id)?{...note,read:true}:note);
}
