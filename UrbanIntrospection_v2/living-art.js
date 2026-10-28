/* Whole-figure depth from Deon's exact image pixels. No generative retouching. */
(() => {
const cutouts=new Set(['new-02','new-04','new-07','new-10','new-13']);
const groups={
 'new-01':[[.15,.28,.13],[.44,.20,.18],[.70,.29,.11],[.89,.23,.14]],
 'new-02':[[.51,.20,.18]],'new-03':[[.20,.25,.17],[.52,.15,.19],[.83,.22,.15]],
 'new-04':[[.50,.10,.16]],'new-05':[[.16,.26,.12],[.35,.25,.12],[.54,.26,.12],[.73,.27,.12],[.89,.26,.11]],
 'new-06':[[.17,.29,.12],[.39,.26,.12],[.61,.25,.12],[.82,.23,.12]],
 'new-07':[[.50,.20,.20]],'new-08':[[.15,.24,.12],[.33,.23,.12],[.51,.22,.13],[.72,.24,.14],[.89,.25,.13]],
 'new-09':[[.13,.25,.13],[.34,.28,.12],[.55,.30,.12],[.76,.27,.12],[.92,.26,.11]],
 'new-10':[[.51,.19,.19]],'new-11':[[.12,.24,.13],[.31,.24,.13],[.51,.23,.13],[.72,.25,.13],[.89,.25,.12]],
 'new-12':[[.14,.23,.14],[.38,.21,.16],[.65,.22,.14],[.88,.22,.13]],
 'new-13':[[.52,.15,.16]],'new-14':[[.23,.24,.15],[.52,.21,.19],[.80,.30,.12]],
 'new-15':[[.19,.26,.15],[.51,.20,.17],[.79,.26,.14]],
 'new-16':[[.43,.26,.19],[.61,.31,.14]],'new-17':[[.35,.57,.12],[.51,.55,.12],[.67,.57,.12]],
 'new-18':[[.42,.33,.12],[.62,.34,.12]],
 'old-01':[[.25,.34,.105],[.59,.23,.15],[.855,.355,.09]],
 'old-02':[[.15,.36,.085],[.52,.22,.077],[.81,.34,.09]],
 'old-03':[[.315,.385,.075],[.495,.30,.077],[.84,.36,.085]],
 'old-04':[[.18,.20,.115],[.55,.315,.13],[.84,.30,.115]],
 'old-05':[[.28,.29,.10],[.72,.30,.10]],
 'old-06':[[.265,.31,.115],[.545,.33,.08],[.765,.195,.15]],
 'old-07':[[.16,.245,.062],[.44,.38,.06],[.825,.30,.065]],
 'old-08':[[.15,.43,.12],[.43,.36,.115],[.79,.45,.12]],
 'old-09':[[.12,.40,.075],[.385,.49,.12],[.66,.48,.075],[.88,.41,.075]],
 'old-10':[[.24,.20,.115],[.49,.22,.10],[.79,.22,.13]],
 'old-11':[[.13,.44,.075],[.34,.22,.13],[.81,.29,.11]],
 'old-12':[[.19,.28,.105],[.43,.35,.105],[.75,.18,.13],[.965,.32,.085]]
};
function maskFor(id){return (groups[id]||[]).flatMap(([x,y,r])=>{
  const cx=(x*100).toFixed(1),hy=(y*100).toFixed(1),by=(Math.min(.8,y+.39)*100).toFixed(1);
  const bx=Math.min(24,Math.max(12,r*120)).toFixed(1),hx=Math.min(24,r*125).toFixed(1);
  return [`radial-gradient(ellipse ${bx}% 57% at ${cx}% ${by}%,#000 65%,transparent 98%)`,`radial-gradient(ellipse ${hx}% ${Math.min(23,r*135).toFixed(1)}% at ${cx}% ${hy}%,#000 68%,transparent 98%)`];
}).join(',')}
function mount(stage,art,{ambient=false}={}){
 if(!stage||!art)return;
 if(stage._living?.id===art.id){stage._living.refresh();return}
 stage._living?.destroy();
 const original=stage.querySelector('img');if(!original)return;
 original.draggable=false;
 let plane=stage.querySelector('.figure-cutout');const owned=!plane;
 if(!plane&&groups[art.id]){
   plane=document.createElement('span');plane.className='living-figure-plane';plane.setAttribute('aria-hidden','true');plane.style.backgroundImage=`url("${cutouts.has(art.id)?`assets/${art.id}-figure.webp`:art.image}")`;
   if(!cutouts.has(art.id)){plane.style.maskImage=maskFor(art.id);plane.style.webkitMaskImage=plane.style.maskImage}stage.append(plane);
 }
 if(!plane)return;
 let raf=0,disposed=false,active=false,strength=0,mouse=[0,0],target=[0,0];
 function draw(t){raf=0;if(disposed)return;
   const allowed=LivingArt.enabled&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
   const desired=allowed?(active?LivingArt.depth:(ambient?LivingArt.depth*.18:0)):0;
   strength+=(desired-strength)*.14;mouse[0]+=(target[0]-mouse[0])*.16;mouse[1]+=(target[1]-mouse[1])*.16;
   const drift=ambient&&allowed?Math.sin(t*.0008+art.number)*.17:0;
   const size=Math.min(stage.clientWidth,620);
   const dx=(mouse[0]+drift)*size*.045*strength,dy=(-mouse[1]+drift*.3)*size*.027*strength;
   plane.style.transform=`translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,${(strength*30).toFixed(2)}px) rotateY(${(mouse[0]*5*strength).toFixed(2)}deg) rotateX(${(-mouse[1]*3*strength).toFixed(2)}deg) scale(${(1+strength*.014).toFixed(3)})`;
   if(owned)plane.style.opacity=String(Math.min(1,strength*3));
   else plane.style.opacity=String(allowed?1:0);
   if(((active||ambient)&&allowed)||Math.abs(desired-strength)>.003||Math.abs(mouse[0]-target[0])>.01||Math.abs(mouse[1]-target[1])>.01)raf=requestAnimationFrame(draw);
 }
 const animate=()=>{if(!raf)raf=requestAnimationFrame(draw)};
 const move=e=>{const b=stage.getBoundingClientRect();target=[Math.max(-1,Math.min(1,((e.clientX-b.left)/b.width-.5)*2)),Math.max(-1,Math.min(1,((b.top+b.height/2-e.clientY)/b.height)*2))];active=true;stage.classList.add('engaged');animate()};
 const leave=()=>{active=false;target=[0,0];stage.classList.remove('engaged');animate()};
 for(const n of ['pointerenter','pointermove','pointerdown'])stage.addEventListener(n,move);
 for(const n of ['pointerleave','pointerup','pointercancel'])stage.addEventListener(n,leave);
 stage._living={id:art.id,refresh:animate,destroy(){disposed=true;cancelAnimationFrame(raf);for(const n of ['pointerenter','pointermove','pointerdown'])stage.removeEventListener(n,move);for(const n of ['pointerleave','pointerup','pointercancel'])stage.removeEventListener(n,leave);stage.classList.remove('engaged');if(owned)plane.remove();else{plane.style.opacity='0';plane.style.transform=''}stage._living=null}};
 animate();
}
window.LivingArt={mount,enabled:true,depth:1,refreshAll(){document.querySelectorAll('.living-image').forEach(s=>s._living?.refresh())}};
})();
