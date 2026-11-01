/* ---------- game flow ---------- */
function level(){return run?Math.min(14,Math.floor(run.time/10)):0}
function removeItem(it){scene.remove(it.g);scene.remove(it.sh)}
function spawnItem(menuMode){
  var lvl=menuMode?0:level(),r=Math.random();
  var pb=menuMode?0:Math.min(.32,.12+lvl*.02);
  var kind=r<pb?'burnt':(r<pb+.06?'gold':'norm');
  if(evOn&&!menuMode&&kind==='norm'){var r2=Math.random();kind=r2<.08?'blue':r2<.16?'pink':'norm'}
  var spc=kind==='gold'||kind==='blue'||kind==='pink';
  var s=IS*(spc?1.1:1);
  var base=menuMode?4.6:(6.3+lvl*.8)*fallScale;
  var it={kind:kind,x:rnd(-FIELD+s*.6,FIELD-s*.6),y:spawnY,s:s,vy:base*rnd(.9,1.15)*(spc?1.12:1),
    phase:rnd(0,TAU),spin:rnd(-1.4,1.4),ry:rnd(0,TAU),tilt:rnd(.12,.35),frost:cur.cold>.5&&kind!=='burnt'&&!(evOn&&!menuMode)};
  it.shiny=evOn&&kind==='norm';
  it.g=makeBurger(kind,it.frost,it.shiny);it.g.scale.setScalar(s);scene.add(it.g);
  it.sh=makeShadow();scene.add(it.sh);
  items.push(it);
}
function spawnCustom(kind,x,y,vy,o){
  var s=IS*(kind==='pu'?.95:kind==='gold'?1.1:1);
  var it={kind:kind,x:x,y:y,s:s,vy:vy,phase:rnd(0,TAU),spin:rnd(-1.4,1.4),ry:rnd(0,TAU),tilt:rnd(.12,.35),frost:false,shiny:false};
  if(o)for(var k in o)it[k]=o[k];
  it.g=kind==='pu'?makePowerup(it.pu):makeBurger(kind,false,false);
  it.g.scale.setScalar(s);scene.add(it.g);it.sh=makeShadow();scene.add(it.sh);
  items.push(it);return it;
}
function spawnPU(forceType){
  var types=['magnet','shield','slow'];
  if(run.fx.shield>0)types.splice(1,1);
  var ty=forceType||types[(Math.random()*types.length)|0];
  spawnCustom('pu',rnd(-FIELD+1,FIELD-1),spawnY,(5.2+level()*.35)*fallScale,{pu:ty,spin:0,tilt:.04});
}
function activatePU(ty){
  run.fx[ty]=PU[ty].dur;
  pop(0,spawnY*.55,PU[ty].name+'!',PU[ty].color,32);
  burst(hero.x,HR*1.3,12,[PU[ty].color,'#ffffff']);sfx.power();buzz([15,25,15]);
}
/* boss burger: dodge its burnt volleys and catch the golden bolt in each volley to hurt it */
var boss={on:false,hp:0,max:5,g:null,x:0,y:0,t:0,fire:0,life:0,enter:0};
function resetBoss(){if(boss.on&&boss.g)scene.remove(boss.g);boss.on=false;boss.g=null;var b=$('#hBoss');if(b)b.hidden=true}
function startBoss(){
  boss.on=true;boss.max=4+Math.min(3,run.bosses);boss.hp=boss.max;boss.life=26;boss.t=0;boss.fire=1.4;boss.enter=0;
  boss.g=makeBoss();boss.g.position.set(0,spawnY+6,0);scene.add(boss.g);
  pop(0,spawnY*.45,'Boss Burger!','#ff6b6b',36);sfx.boss();buzz([40,30,80]);shake=.3;
  $('#hBoss').hidden=false;$('#hBossFill').style.width='100%';
}
function bossVolley(){
  var vy=(5.4+Math.min(14,level())*.3)*fallScale,lim=FIELD-1.2,bx=rnd(-lim,lim),xs=[bx],tries=0,ys=boss.y-1.7,j;
  while(xs.length<3&&tries++<40){
    var x=rnd(-lim,lim),ok=true;
    for(j=0;j<xs.length;j++)if(Math.abs(x-xs[j])<2.5)ok=false;
    if(ok)xs.push(x);
  }
  spawnCustom('gold',bx,ys,vy,{bolt:true});
  for(j=1;j<xs.length;j++)spawnCustom('burnt',xs[j],ys,vy);
  sfx.bossFire();
}
function hitBoss(){
  if(!boss.on)return;
  boss.hp--;burst(boss.x,boss.y,14,['#ff6b6b','#ffd23f','#ffffff']);sfx.bossHit();buzz(28);shake=Math.max(shake,.25);
  $('#hBossFill').style.width=Math.max(0,boss.hp/boss.max*100)+'%';
  if(boss.hp<=0)endBoss(true);else pop(boss.x,boss.y,'Hit!','#ffd23f',30);
}
function endBoss(win){
  var bx=boss.x,by=boss.y;
  resetBoss();run.nextBoss=run.time+(win?42:34);
  if(win){
    run.bosses++;
    var rw=Math.round(25*(run.bosses+1)*SEASONS[seasonIdx].coin);run.coins+=rw;
    for(var i=items.length-1;i>=0;i--)if(items[i].kind==='burnt'){removeItem(items[i]);items.splice(i,1)}
    burst(bx,by,36,['#ff6b6b','#ffd23f','#ffffff','#ff9a4a']);
    pop(0,spawnY*.5,'Boss down! +'+rw,'#ffd23f',36);sfx.bossDown();buzz([30,40,30,40,90]);shake=.5;
    spawnPU();
  }else{pop(0,spawnY*.5,'Boss escaped','#ff8a8a',28)}
}
function updateBoss(dt){
  if(!boss.on){if(run.time>=run.nextBoss)startBoss();return}
  boss.t+=dt;boss.life-=dt;boss.enter=Math.min(1,boss.enter+dt/1.2);
  boss.x=Math.sin(boss.t*.8)*(FIELD-2.4);
  boss.y=spawnY-2.9+(1-boss.enter)*6;
  boss.g.position.set(boss.x,boss.y,0);
  boss.g.rotation.set(0,Math.sin(boss.t*1.6)*.5,Math.sin(boss.t*3)*.08);
  boss.g.scale.setScalar(3.4*(1+.03*Math.sin(boss.t*6)));
  boss.fire-=dt;
  if(boss.enter>=1&&boss.fire<=0){boss.fire=1.8-.5*(1-boss.hp/boss.max);bossVolley()}
  if(boss.life<=0)endBoss(false);
}
function caught(it){
  hero.mouth=1;hero.punch=1;hero.pside=-hero.pside;
  if(mode==='menu'){if(it.kind!=='burnt')burst(it.x,it.y,6,['#ffd23f','#fff3a8']);return}
  if(mode!=='play')return;
  if(it.kind==='pu'){activatePU(it.pu);return}
  if(it.kind==='burnt'){
    if(run.fx.shield>0){run.fx.shield=0;pop(it.x,it.y+.6,'Blocked!','#35e0ff',30);burst(it.x,it.y,14,['#35e0ff','#ffffff']);sfx.shield();buzz(20);return}
    buzz([60,30,60]);
    run.combo=0;run.lives--;shake=.45;flash=.5;
    pop(it.x,it.y+.6,'Ouch','#ff6b6b');smoke(it.x,it.y);sfx.bad();checkEnd();return;
  }
  run.combo++;run.streak=Math.max(run.streak,run.combo);run.caught++;
  var mult=Math.min(4,1+Math.floor(run.combo/8));
  var v=Math.ceil(({gold:5,blue:4,pink:6}[it.kind]||1)*mult*(baby.on?2:1)*SEASONS[seasonIdx].coin);
  run.coins+=v;
  var spk=it.kind==='gold'||it.kind==='blue'||it.kind==='pink';
  var cd=!!(evCur&&SEASONS[evCur.s].burgers==='candy');
  pop(it.x,it.y+.6,'+'+v,baby.on?'#ff9ad0':(it.kind==='blue'?(cd?'#8fd8ff':'#c48bff'):it.kind==='pink'?(cd?'#ffa0d6':'#8dff6a'):it.kind==='gold'?'#ffd23f':it.shiny?(cd?'#ffb3dd':'#ff9a2a'):'#fff6e3'),spk?32:26);
  burst(it.x,it.y,spk?16:8,it.kind==='blue'?(cd?['#7fd0ff','#e4f5ff','#ffffff']:['#a04aff','#e6ccff','#ffffff']):it.kind==='pink'?(cd?['#ff8fd0','#ffe0f1','#ffffff']:['#6aff3a','#d9ffc4','#ffffff']):it.shiny?(cd?['#ff9ad0','#fff1a8','#8fd8ff']:['#ff8a1a','#ffd04a','#ffffff']):['#ffd23f','#fff3a8','#ffb347']);
  if(spk)sfx.gold();else sfx.coin(run.combo);
  buzz(spk?18:8);if(it.bolt)hitBoss();
}
function missed(it){
  if(mode!=='play')return;
  if(it.kind==='pu'||it.bolt)return;
  if(it.kind==='burnt'){smoke(it.x,.3);return}
  if(run.fx.shield>0){run.fx.shield=0;pop(it.x,1.4,'Saved!','#35e0ff',30);burst(it.x,.6,14,['#35e0ff','#ffffff']);sfx.shield();buzz(20);return}
  buzz(35);
  run.combo=0;run.lives--;flash=.22;
  pop(it.x,1.2,'Miss','#ff8a8a');sfx.miss();checkEnd();
}
function checkEnd(){if(run.lives<=0)endGame()}
function clearItems(){for(var i=0;i<items.length;i++)removeItem(items[i]);items=[]}
function resetBaby(){baby.on=false;baby.s=0;baby.timer=rnd(6,10);baby.x=hero.x}

/* coins from a run are banked as soon as the app leaves the screen, so quitting never loses them */
function bankRun(){
  if(!run)return;
  var add=run.coins-run.banked;
  if(add>0){save.coins+=add;run.banked=run.coins;persist()}
}
function setPaused(p){
  if(p===paused)return;
  if(p&&mode!=='play')return;
  paused=p;$('#pause').hidden=!p;
  keys={};
  if(!p)last=performance.now();
}
function startGame(){
  ensureAudio();paused=false;$('#pause').hidden=true;
  run={coins:0,lives:MAXL,time:0,combo:0,streak:0,caught:0,banked:0,submitted:false,rank:0,fx:{magnet:0,shield:0,slow:0},puT:rnd(10,14),nextBoss:40,bosses:0,startSeason:(realSeason()+save.runs)%4};
  clearItems();resetBoss();shake=0;flash=0;spawnT=.9;
  hero.x=hero.tx=0;hero.v=0;resetBaby();
  evCur=eventNow();evOn=!!evCur;var s0=evOn?evCur.s:run.startSeason;
  setSeason(s0,false);showBanner(s0);
  mode='play';hudCache={};setScreen('play');updateHud();
}
function endGame(){
  mode='over';baby.on=false;resetBoss();
  var lvl=level()+1,isBest=run.coins>save.best;
  bankRun();if(isBest)save.best=run.coins;save.runs++;persist();
  clearItems();sfx.over();
  $('#oCoins').textContent=run.coins;
  $('#oCaught').textContent=run.caught;
  $('#oStreak').textContent=run.streak;
  $('#oLevel').textContent='Lv '+lvl+' · '+SEASONS[seasonIdx].name;
  $('#oBank').textContent=save.coins;
  $('#oNew').hidden=!(isBest&&run.coins>0);
  run.submitted=false;run.checking=true;showEntry();
  var rn0=run;
  lbRefresh().then(function(){rn0.checking=false;if(run===rn0&&mode==='over'&&curScreen==='over')showEntry()});
  setTimeout(function(){if(mode==='over'){setScreen('over');showEntry()}},750);
}
function toMenu(){
  if(run&&mode==='play'){bankRun();save.runs++;persist()}
  paused=false;$('#pause').hidden=true;
  mode='menu';clearItems();resetBoss();spawnT=.4;hero.tx=0;run=null;resetBaby();menuSeasonT=8;
  updateMenu();setScreen('menu');
}

