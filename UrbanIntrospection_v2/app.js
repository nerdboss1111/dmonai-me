const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
const art=window.URBAN_ART;
const byId=id=>art.find(a=>a.id===id);
const display=a=>a.chapter==='original'?a.title:`Street Study ${String(a.number).padStart(2,'0')}`;
const chapter=a=>({chorus:'STREET CHORUS',solo:'SOLO SIGNALS',city:'CITY SHIFTS',original:'FIRST EDITION'})[a.chapter];
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readStore(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function saveStore(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
let saved=readStore('ui2-saved',[]).filter(id=>byId(id)),bag=readStore('ui2-bag',[]).filter(x=>byId(x.id)&&['Canvas','Art print'].includes(x.format));
let filter='new',query='',expanded=false,current='new-04',roomCurrent='new-04',motion=readStore('ui2-motion',!matchMedia('(prefers-reduced-motion:reduce)').matches);
let roomX=0,roomY=-12,roomScale=.9,toastTimer,returnFocus;
const initialRoom=()=>byId('new-04');
function announce(s){const t=$('#toast');t.textContent=s;t.classList.add('toast-on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('toast-on'),3200)}
function updateCounts(){$('#saved-count').textContent=saved.length;$('#saved-filter-count').textContent=saved.length;$('#bag-count').textContent=bag.length;$('#bag-open').setAttribute('aria-label',`Open preview bag, ${bag.length} items`)}
function toggleSave(id){const was=saved.includes(id);saved=was?saved.filter(x=>x!==id):[...saved,id];saveStore('ui2-saved',saved);updateCounts();render();if($('#detail').open)updateDetailSave();announce(was?'Removed from saved works.':'Saved on this device. The city remembers.')}
function updateDetailSave(){$('#detail-save').innerHTML=saved.includes(current)?'Saved to your collection <span>♥</span>':'Save this piece <span>♡</span>'}
function list(){const terms=query.trim().toLowerCase();return art.filter(a=>{
 const group=filter==='saved'?saved.includes(a.id):filter==='new'?a.chapter!=='original':filter==='original'?a.chapter==='original':a.chapter===filter;
 const match=!terms||`${display(a)} ${a.title} ${a.description} ${chapter(a)}`.toLowerCase().includes(terms);
 return group&&match;
})}
function render(){const grid=$('#art-grid');$$('.living-image',grid).forEach(s=>s._living?.destroy());const items=list();const visible=(expanded||filter!=='new'||query)?items:items.slice(0,12);
 $('#result-count').textContent=`${items.length} ${items.length===1?'work':'works'} ${filter==='saved'?'saved on this device':filter==='original'?'from the first edition':'to wander through'}`;
 if(!items.length){grid.innerHTML=`<div class="empty"><h3>${filter==='saved'&&!query?'NOTHING SAVED YET.':'NO STREET FOUND.'}</h3><p>${filter==='saved'&&!query?'Tap the heart on a work to keep it close.':'Try another color, figure, or city word.'}</p><button class="pill plain" data-reset>See the new twenty ↗</button></div>`}
 else grid.innerHTML=visible.map((a,i)=>`<article class="art-card ${i===0&&!query&&filter==='new'?'spotlight':''}"><button class="image-button" data-open="${a.id}" aria-label="Explore ${escapeHTML(display(a))}"><span class="living-image" data-art="${a.id}" style="--ratio:${a.ratio}"><img src="${a.image}" alt="${escapeHTML(a.alt)}" loading="lazy"></span><span class="art-badge">${chapter(a)}</span><span class="art-zoom" aria-hidden="true">↗</span></button><div class="card-meta"><div><h3>${escapeHTML(display(a))}</h3><small>${escapeHTML(a.title.toUpperCase())} / DEON MONAI</small></div><button class="save-card" data-save="${a.id}" aria-label="${saved.includes(a.id)?'Unsave':'Save'} ${escapeHTML(display(a))}" aria-pressed="${saved.includes(a.id)}">${saved.includes(a.id)?'♥':'♡'}</button></div></article>`).join('');
 $$('[data-art]',grid).forEach(stage=>LivingArt.mount(stage,byId(stage.dataset.art)));
 const more=$('#show-more');more.hidden=!(filter==='new'&&!query&&!expanded&&items.length>12);more.querySelector('span').textContent=`+ ${Math.max(0,items.length-12)}`;
 $$('[data-filter]').forEach(b=>{const on=b.dataset.filter===filter;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
}
function setFilter(next){filter=next;query='';$('#search').value='';expanded=false;render()}
function openDialog(id){const shown=$('dialog[open]');if(shown){shown.close();$$('.living-image',shown).forEach(s=>s._living?.destroy())}returnFocus=document.activeElement;$(id).showModal()}
function closeDialog(d){d.close();$$('.living-image',d).forEach(s=>s._living?.destroy());if(returnFocus?.isConnected)returnFocus.focus()}
function setMedia(stage,a){stage.style.setProperty('--ratio',a.ratio);stage.style.setProperty('--media-width',`${Math.round(Math.min(610,a.ratio*window.innerHeight*.66))}px`)}
function openArt(id){const a=byId(id);if(!a)return;current=id;$('#detail-chapter').textContent=`${chapter(a)} / URBAN INTROSPECTION`;
 $('#detail-title').textContent=display(a);$('#detail-description').textContent=a.description;
 const stage=$('#detail-stage');stage._living?.destroy();setMedia(stage,a);$('#detail-image').src=a.image;$('#detail-image').alt=a.alt;stage.classList.remove('zoomed');$('#format').value='Canvas';updateDetailSave();openDialog('#detail');requestAnimationFrame(()=>LivingArt.mount(stage,a,{ambient:true}));
}
function rotateRoom(){$('#room-art').style.transform=`rotateX(${roomX}deg) rotateY(${roomY}deg) scale(${roomScale})`}
function selectRoom(id){const a=byId(id);if(!a)return;roomCurrent=id;const stage=$('#room-art');stage._living?.destroy();stage.style.setProperty('--ratio',a.ratio);stage.style.setProperty('--room-width',`${Math.round(Math.min(440,a.ratio*410))}px`);
 $('#room-image').src=a.image;$('#room-image').alt=a.alt;$('#room-label').textContent=`${display(a).toUpperCase()} / DEON MONAI`;
 stage.setAttribute('aria-label',`${display(a)}. Drag or use arrow keys to turn the canvas.`);
 $$('[data-room-art]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.roomArt===id)));
 requestAnimationFrame(()=>LivingArt.mount(stage,a,{ambient:true}));
}
function openRoom(id='new-04'){openDialog('#room');selectRoom(id);rotateRoom()}
$('#room-strip').innerHTML=art.map(a=>`<button data-room-art="${a.id}" aria-label="Show ${escapeHTML(display(a))}" aria-pressed="false"><img src="${a.image}" alt="" loading="lazy"></button>`).join('');
function renderBag(){const root=$('#bag-items');root.innerHTML=bag.length?bag.map((x,i)=>{const a=byId(x.id);return `<div class="bag-item"><button data-open="${a.id}" aria-label="Explore ${escapeHTML(display(a))}"><img src="${a.image}" alt=""></button><div><h3>${escapeHTML(display(a))}</h3><p>${x.format.toUpperCase()} · PREVIEW ONLY</p><button data-remove="${i}">Remove</button></div></div>`}).join(''):'<div class="empty"><h3>ROOM FOR ART.</h3><p>Explore a work and add a canvas or print to your preview bag.</p><button class="pill plain" data-browse>Explore the collection ↗</button></div>';$('#bag-actions').hidden=!bag.length}
function updateBag(){saveStore('ui2-bag',bag);updateCounts();renderBag()}
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;
 if(b.hasAttribute('data-open'))openArt(b.dataset.open);
 else if(b.hasAttribute('data-save'))toggleSave(b.dataset.save);
 else if(b.hasAttribute('data-filter'))setFilter(b.dataset.filter);
 else if(b.hasAttribute('data-room-art'))selectRoom(b.dataset.roomArt);
 else if(b.hasAttribute('data-room'))openRoom();
 else if(b.hasAttribute('data-close'))closeDialog(b.closest('dialog'));
 else if(b.hasAttribute('data-remove')){bag.splice(Number(b.dataset.remove),1);updateBag()}
 else if(b.hasAttribute('data-browse')){closeDialog($('#bag'));$('#collection').scrollIntoView({behavior:motion?'smooth':'auto'})}
 else if(b.hasAttribute('data-reset'))setFilter('new');
 else if(b.hasAttribute('data-wall')){const dark=b.dataset.wall==='#292b2b';$('#room-scene').style.background=b.dataset.wall;$('#room-scene').classList.toggle('dark-wall',dark);$$('[data-wall]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}
 else if(b.hasAttribute('data-info'))showInfo(b.dataset.info);
});
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d)}));
$('#show-more').addEventListener('click',()=>{expanded=true;render()});
$('#search').addEventListener('input',e=>{query=e.target.value;expanded=true;render()});
$('#saved-open').addEventListener('click',()=>{setFilter('saved');$('#collection').scrollIntoView({behavior:motion?'smooth':'auto'})});
$('#detail-save').addEventListener('click',()=>toggleSave(current));
$('#detail-room').addEventListener('click',()=>openRoom(current));
$('#room-details').addEventListener('click',()=>openArt(roomCurrent));
$('#add-bag').addEventListener('click',()=>{const format=$('#format').value;if(bag.some(x=>x.id===current&&x.format===format)){announce('Already in your preview bag.');return}bag.push({id:current,format});updateBag();announce(`${display(byId(current))} added to your preview bag.`)});
$('#bag-open').addEventListener('click',()=>{renderBag();openDialog('#bag')});
$('#clear-bag').addEventListener('click',()=>{bag=[];updateBag();announce('Preview bag cleared.')});
$('#download-list').addEventListener('click',()=>{const text=`URBAN INTROSPECTION BY DEON MONAI — SECOND EDITION\nMy preview selection\n\n${bag.map(x=>`${display(byId(x.id))} — ${x.format}`).join('\n')}\n\nThis is a personal preview, not an order or reservation. Prices, sizes and availability are not yet set.\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='urban-introspection-preview-selection.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)});
$('#detail-stage').addEventListener('click',e=>e.currentTarget.classList.toggle('zoomed'));
$('#detail-stage').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.currentTarget.classList.toggle('zoomed')}});
$('#prev-art').addEventListener('click',()=>stepArt(-1));$('#next-art').addEventListener('click',()=>stepArt(1));
function stepArt(direction){const index=art.findIndex(a=>a.id===current);openArt(art[(index+direction+art.length)%art.length].id)}
$('#detail').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();stepArt(1)}if(e.key==='ArrowLeft'){e.preventDefault();stepArt(-1)}});
$('#room-scale').addEventListener('input',e=>{roomScale=Number(e.target.value)/100;rotateRoom()});
$('#depth-range').addEventListener('input',e=>{LivingArt.depth=Number(e.target.value)/100;LivingArt.refreshAll()});
$('#room-reset').addEventListener('click',()=>{roomX=0;roomY=-12;roomScale=.9;LivingArt.depth=1;$('#room-scale').value=90;$('#depth-range').value=100;rotateRoom();LivingArt.refreshAll()});
let drag=false,last=[0,0];const roomArt=$('#room-art');roomArt.addEventListener('pointerdown',e=>{drag=true;last=[e.clientX,e.clientY];roomArt.setPointerCapture(e.pointerId)});roomArt.addEventListener('pointermove',e=>{if(!drag)return;roomY=Math.max(-55,Math.min(55,roomY+(e.clientX-last[0])*.32));roomX=Math.max(-35,Math.min(35,roomX-(e.clientY-last[1])*.30));last=[e.clientX,e.clientY];rotateRoom()});for(const n of ['pointerup','pointercancel'])roomArt.addEventListener(n,()=>drag=false);
roomArt.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')roomY-=5;if(e.key==='ArrowRight')roomY+=5;if(e.key==='ArrowUp')roomX-=5;if(e.key==='ArrowDown')roomX+=5;roomY=Math.max(-55,Math.min(55,roomY));roomX=Math.max(-35,Math.min(35,roomX));rotateRoom()});
const hero=$('#hero-world'),feature=$('.hero-feature');hero.addEventListener('pointermove',e=>{if(!motion||e.pointerType==='touch')return;const b=hero.getBoundingClientRect();const x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;feature.style.transform=`rotate(-2deg) rotateY(${x*10}deg) rotateX(${-y*7}deg)`});hero.addEventListener('pointerleave',()=>feature.style.transform='');
$('#art-grid').addEventListener('pointermove',e=>{if(!motion||e.pointerType==='touch')return;const card=e.target.closest('.image-button');if(!card)return;const b=card.getBoundingClientRect();const x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;card.style.transform=`perspective(1000px) rotateY(${x*5}deg) rotateX(${-y*5}deg) translateY(-5px)`});$('#art-grid').addEventListener('pointerout',e=>{const card=e.target.closest('.image-button');if(card&&!card.contains(e.relatedTarget))card.style.transform=''});
function updateMotion(){document.documentElement.classList.toggle('motion-off',!motion);LivingArt.enabled=motion;LivingArt.refreshAll();$('#motion-toggle').textContent=`MOTION ${motion?'ON':'OFF'}`;$('#motion-toggle').setAttribute('aria-pressed',String(!motion));if(!motion){feature.style.transform='';$$('.image-button').forEach(x=>x.style.transform='')}}
$('#motion-toggle').addEventListener('click',()=>{motion=!motion;saveStore('ui2-motion',motion);updateMotion()});
const info={shop:['The shop is taking shape.','<p>The original artwork, art room, saved pieces and preview bag are ready to explore. Canvas sizes, prices, actual inventory, shipping, returns and payment checkout are not configured yet.</p><p>The thrift, upcycle and odd finds shelves will show real product photographs, measurements, condition notes and availability as Deon adds them.</p>'],privacy:['Your collection stays with you.','<p>Saved works, the preview bag and motion choice live in this browser on this device. This site does not ask for an email or take a payment. Clearing your browser storage removes these selections.</p><button class="pill plain" id="clear-local">Clear saved works and bag ↗</button>']};
function showInfo(key){$('#info-title').textContent=info[key][0];$('#info-body').innerHTML=info[key][1];openDialog('#info');if(key==='privacy')$('#clear-local').onclick=()=>{saved=[];bag=[];saveStore('ui2-saved',saved);saveStore('ui2-bag',bag);updateCounts();render();announce('Saved works and bag cleared.')}}
$('#year').textContent=new Date().getFullYear();updateCounts();render();LivingArt.mount($('.hero-feature'),byId('new-04'),{ambient:true});updateMotion();
