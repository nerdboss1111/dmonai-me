/* Original Urban Introspection soundscape. Starts only after a visitor chooses sound. */
(() => {
  'use strict';
  const path='/UrbanIntrospection_audio/city-groove.mp3';
  const track=new Audio(path); track.loop=true; track.preload='none';
  const read=(key,fallback)=>{try{const n=Number(localStorage.getItem(key));return Number.isFinite(n)&&localStorage.getItem(key)!==null?Math.min(1,Math.max(0,n)):fallback}catch{return fallback}};
  const save=(key,value)=>{try{localStorage.setItem(key,String(value))}catch{}};
  let musicVolume=read('urban-audio-music',.40), effectsVolume=read('urban-audio-effects',.45);
  let enabled=false,starting=false,context=null,fxBus=null,ambientBus=null,ambientSource=null,phase=0,paused=false,lastHover=0;
  track.volume=musicVolume;

  const shell=document.createElement('div');
  shell.className='urban-audio';
  shell.innerHTML='<button class="urban-audio-toggle" type="button" aria-pressed="false" aria-label="Turn music and sound effects on"><span class="audio-icon" aria-hidden="true">♫</span><span class="audio-copy"><span class="audio-state">SOUND OFF</span><small class="audio-action">TAP TO LISTEN</small></span></button><button class="urban-audio-settings" type="button" aria-label="Sound settings" aria-expanded="false" aria-controls="urban-audio-panel">⚙</button><div class="urban-audio-panel" id="urban-audio-panel" hidden><strong>THE CITY HAS A SOUND.</strong><p>A dreamy groove and little sounds for the journey.</p><label>Music <input class="audio-music" type="range" min="0" max="100" step="1" aria-label="Music volume"></label><label>Sound effects <input class="audio-effects" type="range" min="0" max="100" step="1" aria-label="Sound effects volume"></label><div class="urban-audio-status" role="status" aria-live="polite"></div></div>';
  track.hidden=true;track.setAttribute('aria-hidden','true');shell.append(track);document.body.append(shell);
  const toggle=shell.querySelector('.urban-audio-toggle'),state=shell.querySelector('.audio-state'),action=shell.querySelector('.audio-action'),settings=shell.querySelector('.urban-audio-settings'),panel=shell.querySelector('.urban-audio-panel'),status=shell.querySelector('.urban-audio-status'),musicSlider=shell.querySelector('.audio-music'),effectsSlider=shell.querySelector('.audio-effects');
  musicSlider.value=Math.round(musicVolume*100);effectsSlider.value=Math.round(effectsVolume*100);

  // Modal dialogs are in the browser's top layer; put a mute button there too.
  const dialogToggles=[...document.querySelectorAll('dialog')].map(dialog=>{
    const button=document.createElement('button');button.type='button';button.className='urban-audio-dialog';button.setAttribute('aria-pressed','false');button.textContent='♫ SOUND OFF · TAP TO LISTEN';button.addEventListener('click',switchSound);dialog.append(button);return button;
  });
  function update(){
    shell.dataset.state=starting?'starting':enabled?'on':'off';toggle.setAttribute('aria-pressed',String(enabled));toggle.setAttribute('aria-label',enabled?'Mute music and sound effects':'Turn music and sound effects on');
    state.textContent=starting?'STARTING SOUND':enabled?'SOUND ON':'SOUND OFF';action.textContent=enabled?'TAP TO MUTE':'TAP TO LISTEN';
    for(const b of dialogToggles){b.setAttribute('aria-pressed',String(enabled));b.textContent=enabled?'♫ SOUND ON · MUTE':'♫ SOUND OFF · TAP TO LISTEN';b.setAttribute('aria-label',enabled?'Mute music and sound effects':'Turn music and sound effects on')}
  }
  function ensureContext(){
    if(context)return context;
    const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)return null;
    context=new Ctor();fxBus=context.createGain();ambientBus=context.createGain();fxBus.connect(context.destination);ambientBus.connect(context.destination);fxBus.gain.value=effectsVolume;
    const buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.32;
    ambientSource=context.createBufferSource();ambientSource.buffer=buffer;ambientSource.loop=true;
    const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=360;ambientSource.connect(filter);filter.connect(ambientBus);ambientBus.gain.value=0;ambientSource.start();
    return context;
  }
  function ambient(){if(!context||!ambientBus)return;const levels=[.015,.065,.045,.024,.008];const amount=enabled&&!paused&&!document.hidden?effectsVolume*(levels[phase]||0):0;ambientBus.gain.setTargetAtTime(amount,context.currentTime,.5);if(fxBus)fxBus.gain.setTargetAtTime(effectsVolume,context.currentTime,.08)}
  function tone(freq,at=0,duration=.35,amount=.035,pan=0){
    if(!enabled||document.hidden||!context||!fxBus||effectsVolume===0)return;
    const t=context.currentTime+at,o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.975,t+duration);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(amount,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);if(context.createStereoPanner){const p=context.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(fxBus)}else g.connect(fxBus);o.start(t);o.stop(t+duration+.02);
  }
  function whoosh(amount=.06){
    if(!enabled||document.hidden||!context||!fxBus||effectsVolume===0)return;
    const t=context.currentTime,buffer=context.createBuffer(1,Math.floor(context.sampleRate*.23),context.sampleRate),d=buffer.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.35;
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(500,t);filter.frequency.exponentialRampToValueAtTime(1800,t+.18);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(amount,t+.045);gain.gain.exponentialRampToValueAtTime(.0001,t+.23);source.connect(filter);filter.connect(gain);gain.connect(fxBus);source.start(t);
  }
  function sparkle(){tone(659,0,.36,.035,-.3);tone(880,.13,.42,.03,.25);tone(987,.29,.48,.022,-.05)}
  function step(){if(!enabled||document.hidden||phase!==2||paused||!context||effectsVolume===0)return;tone(93,0,.14,.035,Math.random()*.5-.25);whoosh(.012)}
  setInterval(step,620);
  function scene(next){
    const n=Math.max(0,Math.min(4,Number(next)||0));shell.dataset.scene=String(n);if(n===phase)return;phase=n;ambient();
    if(enabled&&phase===1)whoosh(.045);if(enabled&&phase===3)sparkle();if(enabled&&phase===4)tone(523,0,.55,.025,.1);
  }
  async function switchSound(){
    if(starting)return;
    if(enabled){enabled=false;track.pause();ambient();status.textContent='Sound is off.';update();return}
    starting=true;update();status.textContent='Starting sound…';
    try{
      // Both calls happen inside the gesture, which browsers require for audio.
      const play=track.play();const c=ensureContext();const resume=c&&c.state==='suspended'?c.resume():Promise.resolve();
      await Promise.all([play,resume]);enabled=true;status.textContent='Sound is on. Adjust music and effects above.';ambient();tone(523,0,.3,.025);update();
    }catch(error){track.pause();enabled=false;ambient();status.textContent='Sound could not start. Tap again to retry.';update()}
    finally{starting=false;update()}
  }
  toggle.addEventListener('click',switchSound);
  settings.addEventListener('click',()=>{panel.hidden=!panel.hidden;settings.setAttribute('aria-expanded',String(!panel.hidden))});
  musicSlider.addEventListener('input',()=>{musicVolume=Number(musicSlider.value)/100;track.volume=musicVolume;save('urban-audio-music',musicVolume)});
  effectsSlider.addEventListener('input',()=>{effectsVolume=Number(effectsSlider.value)/100;save('urban-audio-effects',effectsVolume);ambient()});
  document.addEventListener('visibilitychange',()=>{if(!enabled)return;ambient();if(document.hidden)track.pause();else track.play().catch(()=>{enabled=false;ambient();status.textContent='Tap to turn sound back on.';update()})});
  document.addEventListener('click',event=>{
    if(!enabled||event.target.closest('.urban-audio,.urban-audio-dialog'))return;
    const target=event.target.closest('button,a');if(!target)return;
    if(target.matches('[data-room],#start-flight,#replay,#replay-footer'))whoosh(.045);
    else if(target.matches('[data-open],[data-open-art],[data-product],[data-room-art],.art-card-image')){whoosh(.028);tone(587,0,.24,.018)}
    else if(target.matches('[data-save],.save-art,[data-wall]'))tone(784,0,.2,.02);
  });
  document.addEventListener('pointerover',event=>{
    if(!enabled||event.pointerType!=='mouse')return;
    const target=event.target.closest('[data-open],[data-open-art],[data-product],.art-card-image');
    if(!target||(event.relatedTarget&&target.contains(event.relatedTarget))||Date.now()-lastHover<850)return;
    lastHover=Date.now();tone(740,0,.18,.011,Math.random()*.5-.25);
  });
  const flight=document.getElementById('flight-hud'),index=document.getElementById('flight-index'),pause=document.getElementById('pause-flight');
  if(flight&&index){
    const sync=()=>{paused=pause?.getAttribute('aria-pressed')==='true';if(document.body.classList.contains('arrived'))scene(4);else if(!flight.hidden)scene(parseInt(index.textContent,10)||1);else scene(0);ambient()};
    const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});observer.observe(flight,{attributes:true,attributeFilter:['hidden']});observer.observe(index,{childList:true,subtree:true,characterData:true});if(pause)observer.observe(pause,{attributes:true,attributeFilter:['aria-pressed']});sync();
  } else {phase=4;shell.dataset.scene='4';}
  update();
})();
