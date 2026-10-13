// The loading screen owns asset readiness; the simulation starts only afterwards.
const residentImages=new Map();
export function loadImage(url,{ImageClass=globalThis.Image,timeout=45000}={}){
 return new Promise((resolve,reject)=>{const image=new ImageClass();let ended=false;const done=error=>{if(ended)return;ended=true;clearTimeout(timer);image.onload=image.onerror=null;if(error)reject(error);else{residentImages.set(url,image);resolve(url);}};const timer=setTimeout(()=>done(new Error('图片加载超时')),timeout);image.onload=async()=>{try{await image.decode?.();done();}catch{done(new Error('图片解码失败'));}};image.onerror=()=>done(new Error('图片加载失败'));image.src=url;});
}
async function boot(){
 const root=document.querySelector('#loading-screen'),bar=document.querySelector('#loading-progress'),label=document.querySelector('#loading-label'),retry=document.querySelector('#loading-retry');
 const links=[...document.querySelectorAll('link[data-game-asset]')];let completed=0,failed=false;
 const progress=()=>{if(failed)return;bar.value=completed;bar.max=links.length+1;const fill=document.querySelector('#loading-fill');if(fill)fill.style.width=`${completed/(links.length+1)*100}%`;label.textContent=`正在准备家园 · ${Math.round(completed/(links.length+1)*100)}%`;};
 retry.hidden=true;progress();
 try{if([...document.querySelectorAll('link[rel=stylesheet]')].some(link=>!link.sheet))throw new Error('样式加载失败');await Promise.all(links.map(async link=>{await loadImage(link.href);completed++;progress();}));const warmup=document.createElement('div');warmup.id='art-cache';warmup.setAttribute('aria-hidden','true');warmup.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none';for(const image of residentImages.values()){image.alt='';warmup.append(image);}document.body.append(warmup);await import('./main.js');completed++;progress();document.querySelector('#app').removeAttribute('aria-hidden');root.classList.add('loading-complete');await new Promise(resolve=>{const timer=setTimeout(resolve,320);root.addEventListener('transitionend',()=>{clearTimeout(timer);resolve();},{once:true});});root.remove();}
 catch(error){failed=true;label.textContent='家园还没准备好，请检查网络后重试。';retry.hidden=false;retry.onclick=()=>location.reload();}
}
if(typeof document!=='undefined'&&document.querySelector('#loading-screen'))boot();
