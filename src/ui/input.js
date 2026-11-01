/* ---------- input ---------- */
var v2=new T.Vector3();
function pointerWorldX(e){
  var rect=cv.getBoundingClientRect(),ndc=((e.clientX-rect.left)/rect.width)*2-1;
  v1.set(1,1.2,0).project(camera);v2.set(0,1.2,0).project(camera);
  var k=v1.x-v2.x;
  return k>0?clamp(ndc/k,-HB,HB):0;
}
cv.addEventListener('pointerdown',function(e){
  ensureAudio();
  if(mode==='play')hero.tx=pointerWorldX(e);
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
});
cv.addEventListener('pointermove',function(e){if(mode==='play')hero.tx=pointerWorldX(e)});
/* tablets/desktop: the play column is centred, so the empty sides steer too */
document.addEventListener('pointerdown',function(e){
  if(e.target!==document.body&&e.target!==document.documentElement)return;
  if(mode==='play'&&!paused){hero.tx=pointerWorldX(e);try{cv.setPointerCapture(e.pointerId)}catch(_){}}
});
document.addEventListener('pointermove',function(e){
  if(mode==='play'&&!paused&&(e.target===document.body||e.target===document.documentElement)&&e.buttons)hero.tx=pointerWorldX(e);
});
document.addEventListener('pointerdown',ensureAudio,{passive:true});
window.addEventListener('keydown',function(e){
  if(e.target&&e.target.tagName==='INPUT')return;
  keys[e.key]=true;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight')e.preventDefault();
});
window.addEventListener('keyup',function(e){keys[e.key]=false});
window.addEventListener('blur',function(){keys={}});

$('#app').addEventListener('click',function(e){
  var b=e.target.closest?e.target.closest('[data-act]'):null;
  if(!b)return;
  var a=b.getAttribute('data-act');
  ensureAudio();
  if(a==='play')startGame();
  else if(a==='shop')openShop();
  else if(a==='menu')toMenu();
  else if(a==='resume')setPaused(false);
  else if(a==='board'){if(mode!=='over')freshId=null;openBoard()}
  else if(a==='back')goBack();
});
$('#lbSave').addEventListener('click',submitScore);
$('#boardTabs').addEventListener('click',function(e){var b=e.target.closest?e.target.closest('.tab'):null;if(!b)return;lbTab=b.getAttribute('data-tab')==='day'?'day':'all';$('#boardRows').scrollTop=0;renderBoard()});
$('#lbName').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();submitScore()}});
$('#pauseBtn').addEventListener('click',function(){setPaused(true)});
/* app switching: pause and bank coins when the app is hidden, sleep audio, never auto-resume */
function onLeave(){
  if(mode==='play'){bankRun();setPaused(true)}
  if(actx&&actx.state==='running'){try{actx.suspend()}catch(e){}}
}
document.addEventListener('visibilitychange',function(){if(document.hidden)onLeave();else ensureAudio()});
window.addEventListener('pagehide',onLeave);
window.addEventListener('keydown',function(e){if(e.target&&e.target.tagName==='INPUT')return;if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(mode==='play')setPaused(!paused)}});
$('#musicBtn').addEventListener('click',function(){save.music=save.music===false;persist();updateMenu();ensureAudio()});
$('#hapBtn').addEventListener('click',function(){save.haptics=save.haptics===false;persist();updateMenu();buzz(25)});
$('#muteBtn').addEventListener('click',function(){
  save.muted=!save.muted;persist();updateMenu();ensureAudio();
  if(!save.muted)sfx.equip();
});

