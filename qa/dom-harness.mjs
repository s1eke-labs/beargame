/** Minimal controlled DOM fixture for invoking the real app handlers. No browser/layout engine. */
import {createState,serialize} from '../src/engine/save.js';
import {constants} from '../src/engine/catalog.js';
let sequence=0,clock=1800000000000;
const originalNow=Date.now;
Date.now=()=>clock;
export function advance(ms){clock+=ms;}
export function now(){return clock;}
class Classes{constructor(){this.values=new Set();}add(...x){x.forEach(v=>this.values.add(v));}remove(...x){x.forEach(v=>this.values.delete(v));}contains(x){return this.values.has(x);}toggle(x,force){const yes=force??!this.values.has(x);yes?this.values.add(x):this.values.delete(x);return yes;}}
class Element{
 constructor(doc,id=''){this.doc=doc;this.id=id;this.dataset={};this.attributes={};this.classList=new Classes();this.style={setProperty(k,v){this[k]=v;}};this.innerHTML='';this.textContent='';this.scrollTop=0;this.isConnected=true;this.offsetParent={};this.listeners={};this.children=[];}
 set innerHTML(value){this._html=String(value);if(this.id==='app'){const main=this._html.match(/<main\b[^>]*id="main-content"[^>]*>([\s\S]*?)<\/main>/);if(main)this.doc.node('#main-content').innerHTML=main[1];}}
 get innerHTML(){return this._html||'';}
 querySelector(s){return this.doc.node(s);}
 querySelectorAll(){return [];}
 contains(el){return el===this||this.children.includes(el);}
 getElementsByClassName(){return [];}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 closest(selector){if(selector==='.home-controls')return /gather-button|refine-button|sky-event/.test(this.attributes.class||'')?this:null;return this;}
 matches(selector){return selector==='a[href="#home"]'&&this.attributes.href==='#home';}
 getAttribute(k){return this.attributes[k]??null;}
 setAttribute(k,v){this.attributes[k]=v;}
 focus(){this.doc.activeElement=this;}
 insertAdjacentHTML(position,value){this.innerHTML=value+this.innerHTML;}
 append(child){this.children.push(child);}
 remove(){this.isConnected=false;}
 click(){return this.doc.dispatch('click',{target:this,clientX:0,clientY:0,preventDefault(){}});}
 scrollIntoView(){}
 getBoundingClientRect(){return {left:0,top:0,width:44,height:44};}
}
class Document{
 constructor(){this.nodes=new Map();this.listeners={};this.hidden=false;this.documentElement=new Element(this);this.body=new Element(this);this.activeElement=this.body;this.modelContext={registerTool:tool=>{this.tools[tool.name]=tool;}};this.tools={};}
 node(s){if(!this.nodes.has(s))this.nodes.set(s,new Element(this,s.startsWith('#')?s.slice(1):''));return this.nodes.get(s);}
 querySelector(s){return this.node(s);}
 querySelectorAll(){return [];}
 contains(el){return el===this||this.children.includes(el);}
 getElementsByClassName(){return [];}
 createElement(){return new Element(this);}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 async dispatch(type,event={}){for(const fn of this.listeners[type]??[])await fn(event);}
}
export function sharedStorage(edit=()=>{}){const s=createState(17,clock);edit(s);const values=new Map([[constants.SAVE_KEY,serialize(s,clock)]]);return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
const unescape=value=>value.replace(/&(amp|lt|gt|quot|#39);/g,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[name]));
export function renderedButton(tab,query,root='#main-content'){
 const html=tab.doc.node(root).innerHTML;
 for(const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){
  const attrs={},dataset={};
  for(const a of match[1].matchAll(/([\w:-]+)(?:="([^"]*)"|='([^']*)')?/g)){attrs[a[1]]=unescape(a[2]??a[3]??'');if(a[1].startsWith('data-'))dataset[a[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attrs[a[1]];}
  if(Object.entries(query).every(([key,value])=>dataset[key]===String(value)))return {dataset,attrs,text:unescape(match[2].replace(/<[^>]*>/g,''))};
 }
 throw new Error(`Actual rendered control missing: ${JSON.stringify(query)} in ${root}`);
}
export async function clickRendered(tab,query,root){const button=renderedButton(tab,query,root);await tab.click(button.dataset,button.attrs);return button;}
export async function createTab(storage=sharedStorage()){
 const doc=new Document(),timers=[],timeouts=[],windows={listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},scrollTo(){}};
 const tab={doc,storage,timers,timeouts,window:windows,location:{hash:'',reload(){}},activate(){globalThis.document=doc;globalThis.window=windows;globalThis.localStorage=storage;globalThis.location=tab.location;globalThis.matchMedia=()=>({matches:true});globalThis.setInterval=(fn,ms)=>{timers.push({fn,ms});return timers.length;};globalThis.setTimeout=(fn,ms)=>{if(ms===0)timeouts.push(fn);return 1;};globalThis.clearTimeout=()=>{};globalThis.requestAnimationFrame=fn=>{fn();return 1;};globalThis.addEventListener=(...args)=>windows.addEventListener(...args);},snapshot(){tab.activate();return JSON.parse(doc.tools.read_game_state.execute().content[0].text);},async click(dataset,attrs={}){tab.activate();const e=new Element(doc);e.dataset=dataset;e.attributes=attrs;e.disabled=Object.hasOwn(attrs,"disabled");await e.click();},async event(type,event={}){tab.activate();await doc.dispatch(type,event);},async windowEvent(type,event={}){tab.activate();for(const fn of windows.listeners[type]??[])await fn(event);},step(){tab.activate();timers.find(t=>t.ms===200).fn();},async drain(){tab.activate();let count=0;while(timeouts.length){timeouts.shift()();await Promise.resolve();if(++count>10000)throw Error("DOM timer queue failed to settle");}await Promise.resolve();await Promise.resolve();await Promise.resolve();}};
 tab.activate();await import(`../src/main.js?qa-dom=${++sequence}`);if(!doc.tools.read_game_state)throw Error('Real app did not finish boot: '+doc.node('#app').innerHTML);return tab;
}
