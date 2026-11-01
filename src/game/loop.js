/* ---------- loop ---------- */
var last=performance.now(),lastBreath=0;
function update(dt){
  t+=dt;
  evCheck-=dt;if(evCheck<=0){evCheck=1;var e2=eventNow();if((e2&&e2.s)!==(evCur&&evCur.s)){evCur=e2;evOn=!!e2;if(mode==='menu')updateMenu()}}
  var i,it;
  if(mode==='play'){
    var si=evOn?evCur.s:(run.startSeason+Math.floor(run.time/SEASON_LEN))%4;
    if(si!==seasonIdx)setSeason(si,true);
  }else if(evOn){
    if(seasonIdx!==evCur.s)setSeason(evCur.s,false);
  }else if(seasonIdx>=4){
    setSeason(realSeason(),false);
  }else{
    menuSeasonT-=dt;if(menuSeasonT<=0){menuSeasonT=8;setSeason((seasonIdx+1)%4,false)}
  }
  nightF+=(nightTarget()-nightF)*Math.min(1,dt*1.2);
  blendEnv(dt);applyEnv();weatherStep(dt);waterStep(t);fireflyStep(t);
  for(i=0;i<clouds.length;i++){var cl=clouds[i],cu=cl.userData;cu.bx+=cu.v*dt;if(cu.bx>cu.wrap)cu.bx=-cu.wrap;cl.position.x=cu.bx-hero.x*cu.par}

  var w=5,zeta=1;
  if(mode==='play'){
    run.time+=dt;spawnT-=dt*(run.fx.slow>0?.55:1)*(boss.on?.5:1);
    for(var fk in run.fx)if(run.fx[fk]>0)run.fx[fk]=Math.max(0,run.fx[fk]-dt);
    run.puT-=dt;if(run.puT<=0){run.puT=rnd(15,24);spawnPU()}
    updateBoss(dt);
    if(spawnT<=0){spawnItem(false);spawnT=Math.max(.28,.85-level()*.055)*rnd(.8,1.15)}
    if(keys.ArrowLeft||keys.a||keys.A)hero.tx-=16*dt;
    if(keys.ArrowRight||keys.d||keys.D)hero.tx+=16*dt;
    hero.tx=clamp(hero.tx,-HB,HB);
    w=cur.w;zeta=cur.zeta;
  }else if(mode==='menu'){
    spawnT-=dt;if(spawnT<=0){spawnItem(true);spawnT=rnd(.7,1.3)}
    var tg=null;for(i=0;i<items.length;i++){if(!tg||items[i].y<tg.y)tg=items[i]}
    hero.tx=tg?clamp(tg.x,-HB,HB):0;
  }else{w=10}
  var acc=(hero.tx-hero.x)*w*w-hero.v*2*zeta*w;
  hero.v+=acc*dt;hero.x+=hero.v*dt;
  if(hero.x<-HB){hero.x=-HB;hero.v=0}else if(hero.x>HB){hero.x=HB;hero.v=0}
  hero.lean=clamp(hero.v/18,-1,1);hero.walk=clamp(Math.abs(hero.v)/8,0,1);
  hero.mouth=Math.max(0,hero.mouth-dt*4);hero.punch=Math.max(0,hero.punch-dt*5);

  var sk=byId(save.equipped);
  if(sk.trail&&Math.abs(hero.v)>6&&mode!=='over'&&Math.random()<dt*55){
    fxSpawn(hero.x-Math.sign(hero.v)*HR*.9,rnd(.2,2),-.3,rnd(-.4,.4),rnd(-.5,.5),0,.5,rnd(.14,.26),-.3,sk.trail[(Math.random()*sk.trail.length)|0],.9,0,0);
  }
  if(cur.cold>.5&&mode!=='over'&&t-lastBreath>.7){
    lastBreath=t;fxSpawn(hero.x+hero.lean*.2,HR*1.1,HR+.2,rnd(-.2,.2),1,.6,1.1,.3,2.2,'#ffffff',.5,0,0);
  }

  var br=HR*.52;
  if(mode==='play'){
    baby.timer-=dt;
    if(!baby.on&&baby.timer<=0){
      baby.on=true;baby.timer=rnd(5,10);
      baby.x=clamp(hero.x+baby.side*HR*2.3,-FIELD,FIELD);
      sfx.baby();pop(0,spawnY*.62,save.babySkin==='copsven'?'Officer Sven on duty! x2':'Sven is here! x2','#ff9ad0',30);
      burst(baby.x,HR*1.2,8,['#ff9ad0','#fff3a8']);
    }else if(baby.on&&baby.timer<=0){
      baby.on=false;baby.timer=rnd(6,14);sfx.babyBye();
      burst(baby.x,HR*.8,10,['#ffffff','#ff9ad0']);
    }
  }
  baby.s+=((baby.on?1:0)-baby.s)*Math.min(1,dt*9);
  if(Math.abs(hero.lean)>.15)baby.side=hero.lean>0?-1:1;
  var off=HR*2.3;
  if(hero.x+baby.side*off<-FIELD||hero.x+baby.side*off>FIELD)baby.side=-baby.side;
  baby.x+=(clamp(hero.x+baby.side*off,-FIELD,FIELD)-baby.x)*Math.min(1,dt*7);

  var fm=cur.fall*(mode==='play'&&run.fx.slow>0?.5:1),wind=cur.wind,cr=cur.catchM,cy=HR*1.45,mag=mode==='play'&&run.fx.magnet>0;
  for(i=items.length-1;i>=0;i--){
    it=items[i];if(!it)continue;
    it.y-=it.vy*fm*dt;
    it.x+=wind*Math.sin(t*1.2+it.phase)*dt*1.4;
    if(mag&&it.kind!=='burnt'&&!it.bolt&&it.y<spawnY-1)it.x+=(hero.x-it.x)*Math.min(1,dt*3.5);
    if(it.x>FIELD)it.x=FIELD;else if(it.x<-FIELD)it.x=-FIELD;
    var dx=it.x-hero.x,dy=it.y-cy,rad=(HR*.9+it.s*.26)*cr;
    if(mode!=='over'&&dx*dx+dy*dy<rad*rad){caught(it);removeItem(it);items.splice(i,1);continue}
    if(it.y-it.s*.35<0){missed(it);removeItem(it);items.splice(i,1);continue}
    var burnt=it.kind==='burnt';
    it.ry+=it.spin*dt;
    it.g.position.set(it.x,it.y,0);
    it.g.rotation.set(Math.sin(t*2+it.phase)*it.tilt,burnt?Math.sin(t*1.5+it.phase)*.4:it.ry,Math.cos(t*1.7+it.phase)*it.tilt);
    if(it.kind==='gold'||it.kind==='blue'||it.kind==='pink'){var ps=it.s*(1+.06*Math.sin(t*8));it.g.scale.setScalar(ps)}
    var k=clamp(1.15-it.y/22,.35,1.1);
    it.sh.position.set(it.x,.04,0);it.sh.scale.set(it.s*k*1.2,it.s*k*1.2,1);
  }
  fxStep(dt);
  shake=Math.max(0,shake-dt*1.4);flash=Math.max(0,flash-dt*1.6);
  if(mode==='play')updateHud();
  var fl=Math.round(flash*100)/100;
  if(fl!==lastFlash){lastFlash=fl;flashEl.style.opacity=fl}
}
function render(tt){
  if(heroSkinId!==save.equipped)rebuildHero();
  if(babySkinId!==save.babySkin)rebuildBaby();
  heroObj.group.position.set(hero.x,0,0);
  heroObj.pose(tt,{lean:hero.lean,walk:hero.walk,mouth:hero.mouth,punch:hero.punch,pside:hero.pside,sad:mode==='over'});
  heroShadow.position.set(hero.x,.05,0);
  babyObj.group.visible=baby.s>.02;babyObj.shadow.visible=baby.s>.02;
  if(baby.s>.02){
    var blink=baby.on&&baby.timer<1.6&&Math.floor(tt*8)%2===0;
    babyObj.group.visible=!blink;
    babyObj.group.position.set(baby.x,0,.5);
    babyObj.group.scale.setScalar(Math.max(.05,baby.s));
    babyObj.pose(tt,baby.s,hero.v);
    babyObj.shadow.position.set(baby.x,.05,.5);babyObj.shadow.scale.set(1.6*baby.s,1.6*baby.s,1);
  }
  var pr=mode==='play'&&run;
  shieldMesh.visible=!!(pr&&run.fx.shield>0);
  if(shieldMesh.visible){var shs=HR*1.9*(1+.04*Math.sin(tt*6));shieldMesh.position.set(hero.x,HR*1.15,0);shieldMesh.scale.set(shs,shs,shs)}
  magnetRing.visible=!!(pr&&run.fx.magnet>0);
  if(magnetRing.visible){var mr=HR*(2.5-((tt*1.2)%1)*1.3);magnetRing.position.set(hero.x,HR*1.1,0);magnetRing.scale.set(mr,mr,mr)}
  var sl=pr&&run.fx.slow>0?1:0;if(sl!==lastSlow){lastSlow=sl;slowEl.style.opacity=sl}
  nearBg.position.x=-hero.x*.16;farBg.position.x=-hero.x*.05;
  sky.position.copy(camera.position);stars.position.copy(camera.position);
  var sx=0,sy=0;
  if(shake>0){sx=rnd(-1,1)*shake*.5;sy=rnd(-1,1)*shake*.5}
  camera.position.x=sx;camera.position.y=11+sy;
  camera.updateMatrixWorld(true);
  renderer.render(scene,camera);
}
function frame(now){
  requestAnimationFrame(frame);
  var dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(!paused)update(dt);
  if(window.__spiderStep)window.__spiderStep(paused?0:dt);
  render(now/1000);
  if(shopOpen){try{renderShop(now/1000)}catch(e){}}
}

