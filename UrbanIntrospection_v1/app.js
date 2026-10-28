const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const art=[
 {id:1,words:'rainbow stripes rooftop globe fashion',desc:'Ribbon-like color, striped globe heads and silhouettes that feel cut from another world. Every unexpected edge belongs to the original artwork.'},
 {id:2,words:'dance striped dress city movement',desc:'An unruly rooftop dance: graphic stripes, monochrome figures and a dress full of color. The strange proportions and surreal details stay exactly as they are.'},
 {id:3,words:'blue alien yellow shorts pink green',desc:'A bright blue figure takes the middle of the scene. Pink planes, yellow shorts and mismatched personalities turn the city into a little stage.'},
 {id:4,words:'fashion women polka dot globe rainbow',desc:'Polka dots, rainbow geometry and curious globe heads. The collage moves between fashion photograph and impossible little world.'},
 {id:5,words:'rainbow yellow clothes couple rooftop',desc:'Two figures, a city skyline and a wonderfully restless collision of stripes. A study in clothes with as much personality as the people wearing them.'},
 {id:6,words:'purple rainbow globe dancers pants trio',desc:'Three figures above the city, with bold rainbow bands and paint-like color inside their heads. All the original quirks, distortions and happy accidents remain.'},
 {id:7,words:'architecture stairs rainbow stage figures',desc:'A geometric rooftop becomes a stage. Dark silhouettes, bright planes and impossible characters share a world that refuses to sit still.'},
 {id:8,words:'beads globe rainbow figures monochrome',desc:'A bead-like head, rippling rainbow forms and photographic fragments. A colorful conversation between what looks familiar and what feels wonderfully off.'},
 {id:9,words:'beads fashion yellow pink silhouettes city',desc:'Layered fashion silhouettes, a bright yellow dress and a globe of tiny colors. The city behind them holds the collage together without explaining it.'}
];
const imagePath=id=>`assets/art-${String(id).padStart(2,'0')}.webp`;
const title=id=>`Study ${String(id).padStart(2,'0')}`;
function readStore(k,fallback){try{const v=JSON.parse(localStorage.getItem(k));return v??fallback}catch{return fallback}}
function writeStore(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
let saved=readStore('ui-saved',[]).filter(id=>art.some(a=>a.id===id));
let bag=readStore('ui-bag',[]).filter(x=>art.some(a=>a.id===x.id)&&['Canvas','Art print'].includes(x.format));
let filter='all',query='',expanded=false,current=6,roomCurrent=6,angleX=0,angleY=-12,scale=.9,toastTimer,returnFocus;
let motion=readStore('ui-motion',!matchMedia('(prefers-reduced-motion: reduce)').matches);
const heart=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12Z"/></svg>`;
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000)}
function counters(){$('#saved-count').textContent=saved.length;$('#filter-saved-count').textContent=saved.length;$('#bag-count').textContent=bag.length;$('#bag-open').setAttribute('aria-label',`Preview bag, ${bag.length} items`)}
function toggleSave(id){const exists=saved.includes(id);saved=exists?saved.filter(x=>x!==id):[...saved,id];writeStore('ui-saved',saved);counters();render();if($('#detail').open)updateDetailSave();toast(exists?'Removed from your saved art.':'A little piece of you. Saved on this device.')}
function updateDetailSave(){$('#detail-save').textContent=saved.includes(current)?'Saved to your collection ✓':'Save this piece';$('#detail-save').setAttribute('aria-pressed',String(saved.includes(current)))}
const emptyText={thrift:['THE NEXT GOOD FIND.','The thrift rack is being gathered. Clothes, textures and pieces with a past. Actual finds, measurements and condition notes will appear here when they’re ready.'],upcycled:['ANOTHER PLOT TWIST.','The second-life studio is where thrift finds get reworked. Finished pieces, before-and-after photos and their individual stories will appear here.'],finds:['EXPECT THE UNEXPECTED.','The things you didn’t know you were looking for. The odd-finds shelf will fill with real treasures as Deon discovers them.'],saved:['KEEP WHAT MOVES YOU.','Tap the heart on a piece to keep it here. Your saved art stays in this browser.']};
function render(){let items=art.filter(a=>(filter!=='saved'||saved.includes(a.id))&&(!query||(`${title(a.id)} ${a.words} ${a.desc}`).toLowerCase().includes(query)));if(['thrift','upcycled','finds'].includes(filter))items=[];let visible=expanded||filter==='saved'||query?items:items.slice(0,6);$('#result-count').textContent=`${items.length} ${items.length===1?'work':'works'} ${filter==='saved'?'saved on this device':'from the original series'}`;
 if(!items.length){let [heading,body]=emptyText[filter]||['NOTHING HERE JUST YET.','Try another word, or wander back through the whole art wall.'];if(query){heading='A DIFFERENT FEELING?';body='No artworks match that search. Try “rainbow”, “dance”, “blue”, or start again.'}$('#product-grid').innerHTML=`<div class="empty-state"><h3>${heading}</h3><p>${body}</p><button class="button outline" data-reset>Explore the art wall ↗</button></div>`}else $('#product-grid').innerHTML=visible.map(a=>`<article class="product-card"><button class="product-image" data-open="${a.id}" aria-label="Explore ${title(a.id)}"><img src="${imagePath(a.id)}" alt="${a.desc}" loading="lazy"><span class="product-type">ORIGINAL SERIES</span><span class="quick-view">Look a little closer <span>↗</span></span></button><button class="product-heart" data-save="${a.id}" aria-label="${saved.includes(a.id)?'Unsave':'Save'} ${title(a.id)}" aria-pressed="${saved.includes(a.id)}">${heart}</button><div class="product-info"><div><h3>${title(a.id)}</h3><small>DEON MONAI / URBAN INTROSPECTION</small></div><span>COMING TO THE SHOP</span></div></article>`).join('');$('#show-more').hidden=!(items.length>6&&!expanded&&!query&&filter!=='saved');$$('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===filter);b.setAttribute('aria-pressed',String(b.dataset.filter===filter))});}
function setFilter(f){filter=f;query='';$('#search').value='';expanded=false;render()}
function openDialog(id){const d=$(id);const was=$('dialog[open]');if(was)was.close();returnFocus=document.activeElement;d.showModal()}
function closeDialog(d){d.close();if(returnFocus?.isConnected)returnFocus.focus()}
function openArt(id){current=id;const a=art.find(x=>x.id===id);$('#detail-title').textContent=title(id);$('#detail-description').textContent=a.desc;$('#detail-image').src=imagePath(id);$('#detail-image').alt=a.desc;$('#detail-id').textContent=`SERIES INDEX ${String(id).padStart(2,'0')} · STUDY NUMBERS ARE NAVIGATION LABELS`;
 $('.detail-img-wrap').classList.remove('zoomed');$('#format').value='Canvas';updateDetailSave();openDialog('#detail')}
function roomTransform(){$('#canvas-object').style.transform=`rotateX(${angleX}deg) rotateY(${angleY}deg) scale(${scale})`}
function selectRoom(id){roomCurrent=id;const a=art.find(x=>x.id===id);$('#room-image').src=imagePath(id);$('#room-image').alt=a.desc;$('#room-number').textContent=title(id).toUpperCase();$$('[data-room-art]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.roomArt)===id);b.setAttribute('aria-pressed',String(Number(b.dataset.roomArt)===id))})}
function openRoom(id=6){selectRoom(id);openDialog('#room');roomTransform()}
$('#room-thumbs').innerHTML=art.map(a=>`<button data-room-art="${a.id}" aria-label="Show ${title(a.id)}" aria-pressed="false"><img src="${imagePath(a.id)}" alt="" loading="lazy"></button>`).join('');
function renderBag(){$('#bag-items').innerHTML=bag.length?bag.map((x,i)=>`<div class="bag-row"><button data-open="${x.id}" aria-label="Explore ${title(x.id)}"><img src="${imagePath(x.id)}" alt="${title(x.id)}"></button><div><h3>${title(x.id)}</h3><p>${x.format.toUpperCase()} · PREVIEW SELECTION</p><button data-remove="${i}">Remove</button></div></div>`).join(''):'<div class="empty-state"><h3>A LITTLE ROOM<br>FOR SOMETHING.</h3><p>Explore a piece of art and add a canvas or print to your preview bag.</p><button class="button outline" data-browse>Find your piece ↗</button></div>';$('#bag-actions').hidden=!bag.length}
function persistBag(){writeStore('ui-bag',bag);counters();renderBag()}
document.addEventListener('click',e=>{let b=e.target.closest('button,a');if(!b)return;
 if(b.hasAttribute('data-open'))openArt(Number(b.dataset.open));
 if(b.hasAttribute('data-save'))toggleSave(Number(b.dataset.save));
 if(b.hasAttribute('data-filter'))setFilter(b.dataset.filter);
 if(b.hasAttribute('data-filter-link')){setFilter(b.dataset.filterLink);$('#shop').scrollIntoView({behavior:motion?'smooth':'auto'})}
 if(b.hasAttribute('data-reset'))setFilter('all');
 if(b.hasAttribute('data-room'))openRoom();
 if(b.hasAttribute('data-room-art'))selectRoom(Number(b.dataset.roomArt));
 if(b.hasAttribute('data-close'))closeDialog(b.closest('dialog'));
 if(b.hasAttribute('data-remove')){bag.splice(Number(b.dataset.remove),1);persistBag()}
 if(b.hasAttribute('data-browse')){$('#bag').close();$('#shop').scrollIntoView({behavior:motion?'smooth':'auto'})}
 if(b.hasAttribute('data-wall')){$('#room-stage').style.background=b.dataset.wall;$$('[data-wall]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}
 if(b.hasAttribute('data-info'))showInfo(b.dataset.info);
});
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d)}}));
$('#show-more').addEventListener('click',()=>{expanded=true;render()});
$('#search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();filter='all';render()});
$('#search-open').addEventListener('click',()=>{$('#shop').scrollIntoView({behavior:motion?'smooth':'auto'});$('#search').focus({preventScroll:true})});
$('#saved-open').addEventListener('click',()=>{setFilter('saved');$('#shop').scrollIntoView({behavior:motion?'smooth':'auto'})});
$('#surprise').addEventListener('click',()=>openArt(art[Math.floor(Math.random()*art.length)].id));
$('#detail-save').addEventListener('click',()=>toggleSave(current));
$('#detail-room').addEventListener('click',()=>openRoom(current));
$('#room-details').addEventListener('click',()=>openArt(roomCurrent));
$('#add-bag').addEventListener('click',()=>{const format=$('#format').value;if(bag.some(x=>x.id===current&&x.format===format)){toast('That piece is already in your preview bag.');return}bag.push({id:current,format});persistBag();toast(`${title(current)} added to your preview bag.`)});
$('#bag-open').addEventListener('click',()=>{renderBag();openDialog('#bag')});
$('#clear-bag').addEventListener('click',()=>{bag=[];persistBag();toast('Your preview bag is clear.')});
function download(content,name,mime){let u=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)}
$('#download-list').addEventListener('click',()=>download(`URBAN INTROSPECTION BY DEON MONAI\nMy collection preview\n\n${bag.map(x=>`${title(x.id)} — ${x.format}`).join('\n')}\n\nThis is a personal selection, not an order or reservation. Prices, sizes, availability and checkout are not yet set.\n`,'my-urban-introspection-selection.txt','text/plain'));
$('.detail-img-wrap').addEventListener('click',e=>e.currentTarget.classList.toggle('zoomed'));
$('#room-scale').addEventListener('input',e=>{scale=Number(e.target.value)/100;roomTransform()});
$('#room-reset').addEventListener('click',()=>{angleX=0;angleY=-12;scale=.9;$('#room-scale').value=90;roomTransform()});
let dragging=false,lastX=0,lastY=0;const canvas=$('#canvas-object');canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!dragging)return;angleY=Math.max(-55,Math.min(55,angleY+(e.clientX-lastX)*.3));angleX=Math.max(-35,Math.min(35,angleX-(e.clientY-lastY)*.3));lastX=e.clientX;lastY=e.clientY;roomTransform()});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')angleY=Math.max(-55,angleY-5);if(e.key==='ArrowRight')angleY=Math.min(55,angleY+5);if(e.key==='ArrowUp')angleX=Math.max(-35,angleX-5);if(e.key==='ArrowDown')angleX=Math.min(35,angleX+5);roomTransform()});
$$('.tilt').forEach(el=>{el.addEventListener('pointermove',e=>{if(!motion||e.pointerType==='touch')return;const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(1000px) rotateX(${-y*11}deg) rotateY(${x*13}deg) translateY(-8px) scale(1.025)`});el.addEventListener('pointerleave',()=>el.style.transform='')});
function updateMotion(){document.documentElement.classList.toggle('motion-off',!motion);$('#motion-toggle').textContent=`Motion: ${motion?'on':'off'}`;$('#motion-toggle').setAttribute('aria-pressed',String(!motion));if(!motion)$$('.tilt').forEach(e=>e.style.transform='')}
$('#motion-toggle').addEventListener('click',()=>{motion=!motion;writeStore('ui-motion',motion);updateMotion()});
const info={shop:['The shop is taking shape.','<p>You’re exploring Deon’s original artwork and the identity of her upcoming store. The art room, saved collection and preview bag work now.</p><p>Canvas sizes, prices, inventory, shipping, returns and payment checkout have not been configured. Adding something to the preview bag does not place an order or reserve an item.</p><p>Thrift, upcycle and odd-finds categories will show actual product photos and condition details as items are added.</p>'],care:['A little care goes a long way.','<p>For artwork: keep it away from direct moisture and prolonged sunlight. Use a soft, dry cloth on frames. Final care instructions will depend on the materials used for each print or canvas.</p><p>For thrifted and upcycled items: follow each item’s care label and listing notes. Reworked pieces may combine materials that need different care.</p><p>Every secondhand listing should include measurements, fabric information when known, and clear photographs of wear or repairs.</p>'],privacy:['Your collection stays with you.','<p>Saved artworks, your preview bag and motion preferences are stored in this browser on this device. This website does not ask for your email, take payment or send your saved selections to Deon.</p><p>Clearing browser storage removes your selections. Hosting and sign-in services may operate under their own privacy terms.</p><button class="button outline" id="clear-local">Clear my saved art and bag</button>']};
function showInfo(key){$('#info-title').textContent=info[key][0];$('#info-body').innerHTML=info[key][1];openDialog('#info');if(key==='privacy')$('#clear-local').onclick=()=>{saved=[];bag=[];writeStore('ui-saved',saved);writeStore('ui-bag',bag);counters();render();toast('Your saved art and preview bag have been cleared.')}}
$('#brand-open').addEventListener('click',()=>location.href='brand.html');
$('#manifesto-save').addEventListener('click',()=>{const a=document.createElement('a');a.href='brand-downloads/urban-introspection-reminder.png';a.download='urban-introspection-reminder.png';a.click();toast('A small reminder, just for you.')});
$('#year').textContent=new Date().getFullYear();counters();render();updateMotion();

$('.detail-img-wrap').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.classList.toggle('zoomed')}});
