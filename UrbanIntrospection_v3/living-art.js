/* Original image pixels remain in place. Vector silhouettes select a single
   foreground layer, so the whole figure group moves together. */
(() => {
const silhouettes=new Set(['pick-01','pick-02','pick-36']);
function mount(stage,art,{ambient=false}={}){
 if(!stage||!art)return;
 if(stage._living?.id===art.id){stage._living.refresh();return}
 stage._living?.destroy();
 const image=stage.querySelector('img');if(!image)return;
 image.draggable=false;
 if(!silhouettes.has(art.id))return;
 const plane=document.createElement('span');plane.className='living-figure-plane';plane.setAttribute('aria-hidden','true');
 plane.style.backgroundImage=`url("${art.image}")`;
 const mask=`url("assets/mask-${art.number.toString().padStart(2,'0')}.svg")`;
 plane.style.maskImage=mask;plane.style.webkitMaskImage=mask;
 stage.append(plane);
 let raf=0,disposed=false,active=false,strength=0,mouse=[0,0],target=[0,0];
 function draw(t){raf=0;if(disposed)return;
  const allowed=LivingArt.enabled&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
  const desired=allowed?(active?LivingArt.depth:(ambient?LivingArt.depth*.17:0)):0;
  strength+=(desired-strength)*.14;mouse[0]+=(target[0]-mouse[0])*.16;mouse[1]+=(target[1]-mouse[1])*.16;
  const drift=ambient&&allowed?Math.sin(t*.0008+art.number)*.17:0;
  const size=Math.min(stage.clientWidth,620);
  const dx=(mouse[0]+drift)*size*.04*strength,dy=(-mouse[1]+drift*.3)*size*.024*strength;
  plane.style.transform=`translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,${(strength*30).toFixed(2)}px) rotateY(${(mouse[0]*4*strength).toFixed(2)}deg) rotateX(${(-mouse[1]*3*strength).toFixed(2)}deg) scale(${(1+strength*.012).toFixed(3)})`;
  plane.style.opacity=String(Math.min(1,strength*3));
  if(((active||ambient)&&allowed)||Math.abs(desired-strength)>.003||Math.abs(mouse[0]-target[0])>.01||Math.abs(mouse[1]-target[1])>.01)raf=requestAnimationFrame(draw);
 }
 const animate=()=>{if(!raf)raf=requestAnimationFrame(draw)};
 const move=e=>{const b=stage.getBoundingClientRect();target=[Math.max(-1,Math.min(1,((e.clientX-b.left)/b.width-.5)*2)),Math.max(-1,Math.min(1,((b.top+b.height/2-e.clientY)/b.height)*2))];active=true;stage.classList.add('engaged');animate()};
 const leave=()=>{active=false;target=[0,0];stage.classList.remove('engaged');animate()};
 for(const n of ['pointerenter','pointermove','pointerdown'])stage.addEventListener(n,move);
 for(const n of ['pointerleave','pointerup','pointercancel'])stage.addEventListener(n,leave);
 stage._living={id:art.id,refresh:animate,destroy(){disposed=true;cancelAnimationFrame(raf);for(const n of ['pointerenter','pointermove','pointerdown'])stage.removeEventListener(n,move);for(const n of ['pointerleave','pointerup','pointercancel'])stage.removeEventListener(n,leave);stage.classList.remove('engaged');plane.remove();stage._living=null}};
 animate();
}
window.LivingArt={mount,enabled:true,depth:1,refreshAll(){document.querySelectorAll('.living-image').forEach(s=>s._living?.refresh())}};
})();
