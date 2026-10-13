// 同一视图内只同步变化的文本和属性，保留阅读节点、展开状态和输入焦点。
const keys=['id','data-live-key','data-breakdown','data-fold','data-resource','data-detail','data-job','data-ui-search','data-track-target'];
function key(node) {
  if(node.nodeType!==1)return '';
  for(const attr of keys)if(node.hasAttribute(attr))return `${node.nodeName}:${attr}:${node.getAttribute(attr)}`;
  if(node.hasAttribute('data-act'))return `${node.nodeName}:act:${node.getAttribute('data-act')}:${node.getAttribute('data-id')}:${node.getAttribute('data-amount')||'1'}`;
  return '';
}
const compatible=(left,right)=>left?.nodeType===right.nodeType && (left.nodeType!==1||left.nodeName===right.nodeName) && key(left)===key(right);
function patchNode(current,next) {
  if(current.nodeType!==1){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
  const active=current.ownerDocument.activeElement===current;
  for(const attr of [...current.attributes])if(!next.hasAttribute(attr.name)&&!(current.nodeName==='DETAILS'&&attr.name==='open'))current.removeAttribute(attr.name);
  for(const attr of [...next.attributes])if(!(current.nodeName==='DETAILS'&&attr.name==='open')&&!(active&&attr.name==='value')&&current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);
  if(current.nodeName==='INPUT'||current.nodeName==='TEXTAREA'){
    if(!active&&current.value!==next.value)current.value=next.value;
    return;
  }
  patchChildren(current,next);
}
function patchChildren(current,next) {
  const remaining=new Set(current.childNodes);
  let cursor=current.firstChild;
  for(const desired of [...next.childNodes]) {
    let match=compatible(cursor,desired)?cursor:null;
    if(!match&&key(desired))match=[...remaining].find(node=>compatible(node,desired));
    if(match){remaining.delete(match);if(match!==cursor)current.insertBefore(match,cursor);patchNode(match,desired);cursor=match.nextSibling;}
    else {const inserted=desired.cloneNode(true);current.insertBefore(inserted,cursor);}
  }
  for(const node of remaining)node.remove();
}
export function updateMarkup(element,html) {
  const template=element.ownerDocument?.createElement('template');
  // 受控 DOM 夹具不提供解析器；浏览器始终使用保留节点的分支。
  if(!template?.content){if(element.innerHTML!==html)element.innerHTML=html;return;}
  template.innerHTML=html;
  patchChildren(element,template.content);
}
