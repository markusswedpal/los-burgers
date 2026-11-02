/* ---------- screens + HUD ---------- */
var hudCache={};
var screens={menu:$('#menu'),over:$('#over'),shop:$('#shop'),play:$('#hud'),board:$('#board')};
var shopOpen=false,curScreen='menu';
function setScreen(name){
  for(var k in screens)screens[k].hidden=(k!==name);
  shopOpen=name==='shop';curScreen=name;
}
/* Back from shop or board returns to the run summary when one is waiting, otherwise to the menu */
function goBack(){if(mode==='over'&&run)setScreen('over');else toMenu()}

/* game-over name entry */
function showEntry(){
  var msg=$('#lbMsg'),form=$('#lbForm');
  $('#lbName').value=save.name||'';
  if(!run||run.coins<=0){msg.textContent='Catch some burgers to get on the board.';msg.className='lb-msg';form.hidden=true;return}
  if(run.submitted){
    var bits=[];if(run.dayRank)bits.push('#'+run.dayRank+' today');if(run.rank)bits.push('#'+run.rank+' all-time');
    msg.textContent=bits.length?(run.shared?'Saved. You are '+bits.join(' and ')+' on the shared leaderboard.':'Saved on this device. You are '+bits.join(' and ')+'.'):'Saved.';
    msg.className='lb-msg good';form.hidden=true;return;
  }
  if(run.checking){msg.textContent='Checking the leaderboard...';msg.className='lb-msg';form.hidden=true;return}
  var la=lbListFor('all'),ld=lbListFor('day'),ra=lbRankIn(la,run.coins),rd=lbRankIn(ld,run.coins),where=lbLive?'':' (This device only.)';
  var inA=ra<=100,inD=rd<=10;
  if(inA||inD){
    var parts=[];if(inD)parts.push('#'+rd+' today');if(inA)parts.push('#'+ra+' all-time');
    msg.textContent=(ra===1?'New number one! ':'You made the board! ')+'You would be '+parts.join(' and ')+'. Add your name.'+where;msg.className='lb-msg good';form.hidden=false;
  }else{msg.textContent='Not on the boards yet. Today\'s #10 has '+ld[9].score+' coins.';msg.className='lb-msg';form.hidden=true}
}
function submitScore(){
  if(!run||run.submitted||run.coins<=0||run.saving||run.checking)return;
  var nm=cleanName($('#lbName').value);
  if(!nm){toast('Type a name first');$('#lbName').focus();return}
  save.name=nm;persist();
  var rn=run,btn=$('#lbSave');
  rn.saving=true;btn.disabled=true;
  lbSubmit(nm,rn.coins,SEASONS[seasonIdx].short||SEASONS[seasonIdx].name).then(function(res){
    rn.saving=false;btn.disabled=false;
    rn.submitted=true;rn.rank=res.rank<=100?res.rank:0;rn.dayRank=res.dayRank&&res.dayRank<=10?res.dayRank:0;rn.shared=res.shared;freshId=res.id;
    sfx.buy();
    if(run===rn&&mode==='over'){showEntry();openBoard(rn.dayRank?'day':'all')}
  }).catch(function(err){
    rn.saving=false;btn.disabled=false;
    toast(/slow down/i.test(String(err&&err.message))?'Slow down. Try again in a minute.':'Could not save. Check your connection and try again.');
  });
}
function renderBoard(){
  var ol=$('#boardRows'),list=lbListFor(lbTab);ol.textContent='';
  var tb=document.querySelectorAll('#boardTabs .tab');
  for(var ti=0;ti<tb.length;ti++){var on=tb[ti].getAttribute('data-tab')===lbTab;tb[ti].classList.toggle('on',on);tb[ti].setAttribute('aria-selected',on?'true':'false')}
  $('#boardNote').textContent=lbLive?(lbTab==='day'?'Today\'s top 10. Starts fresh every night at midnight (Stockholm time).':'Top 100 players of all time. Everyone who plays sees this list.'):(lbLoading?'Loading the shared leaderboard...':'Offline: showing scores from this device only.');
  if(!list.length){
    var li0=document.createElement('li');li0.className='empty';
    li0.textContent=lbLoading?'Loading the leaderboard...':(lbTab==='day'?'No scores yet today. Be the first!':'No scores yet. Finish a run and add your name.');
    ol.appendChild(li0);return;
  }
  var me=cleanName(save.name).toLowerCase(),freshEl=null;
  list.forEach(function(e,i){
    var li=document.createElement('li');
    li.className='row'+(i<3?' r'+(i+1):'')+(me&&e.name.toLowerCase()===me?' me':'')+(e.id===freshId?' fresh':'');
    var rk=document.createElement('div');rk.className='rk';rk.textContent=i+1;
    var nm=document.createElement('div');nm.className='nm';
    var b=document.createElement('b');b.textContent=e.name;
    if(e.id===freshId){var tg=document.createElement('em');tg.className='tag';tg.textContent='New';b.appendChild(tg);freshEl=li}
    var sm=document.createElement('small');
    var dd=new Date(e.d);
    sm.textContent=(e.season?e.season+' · ':'')+dd.toLocaleDateString(undefined,{month:'short',day:'numeric'});
    nm.appendChild(b);nm.appendChild(sm);
    var sc=document.createElement('div');sc.className='sc';
    var ic=document.createElement('i');ic.className='coin';sc.appendChild(ic);sc.appendChild(document.createTextNode(String(e.score)));
    li.appendChild(rk);li.appendChild(nm);li.appendChild(sc);ol.appendChild(li);
  });
  if(freshEl)setTimeout(function(){try{freshEl.scrollIntoView({block:'center'})}catch(e){}},50);
}
function openBoard(tab){
  if(tab)lbTab=tab;
  setScreen('board');$('#boardRows').scrollTop=0;
  var p=lbRefresh();renderBoard();
  p.then(function(){if(curScreen==='board')renderBoard()});
}
(function(){
  var h='';
  for(var i=0;i<MAXL;i++)h+='<svg class="heart" viewBox="0 0 24 22"><path d="M12 20.5S3 15 3 8.6A5 5 0 0 1 12 6a5 5 0 0 1 9 2.6C21 15 12 20.5 12 20.5z"/></svg>';
  $('#hHearts').innerHTML=h;
})();
var heartEls=document.querySelectorAll('#hHearts .heart');
function updateHud(){
  if(!run)return;
  var lvl=level()+1,mult=Math.min(4,1+Math.floor(run.combo/8));
  var ck=run.combo>=3?run.combo+'/'+mult:'';
  if(hudCache.c!==run.coins){$('#hCoins').textContent=run.coins;hudCache.c=run.coins}
  if(hudCache.l!==run.lives){for(var i=0;i<heartEls.length;i++)heartEls[i].classList.toggle('lost',i>=run.lives);hudCache.l=run.lives;$('#hHearts').setAttribute('aria-label',run.lives+' lives left')}
  var lk=lvl+'|'+seasonIdx;
  if(hudCache.v!==lk){
    var s=SEASONS[seasonIdx];
    $('#hLevel').innerHTML='Level '+lvl+' · '+s.name+' <span class="temp'+(s.temp<=0?' cold':'')+'">'+fmtTemp(s.temp)+'</span>';
    hudCache.v=lk;
  }
  var fk2=Math.ceil(run.fx.magnet)+'|'+Math.ceil(run.fx.shield)+'|'+Math.ceil(run.fx.slow);
  if(hudCache.f!==fk2){
    var ph='',pk;
    for(pk in run.fx)if(run.fx[pk]>0)ph+='<span class="pu" style="--c:'+PU[pk].color+'">'+PU[pk].name+' '+Math.ceil(run.fx[pk])+'s</span>';
    $('#hPU').innerHTML=ph;hudCache.f=fk2;
  }
  var bs=baby.on?(baby.timer<1.6?2:1):0;
  if(hudCache.b!==bs){var be=$('#hBaby');be.hidden=!bs;be.classList.toggle('warn',bs===2);hudCache.b=bs}
  if(hudCache.k!==ck){
    var el=$('#hCombo');
    if(ck){el.hidden=false;el.textContent=run.combo+' streak  x'+mult}else el.hidden=true;
    hudCache.k=ck;
  }
}
var EV_PUMPKIN='<svg class="evpk" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 9c1-4 4-6 7-6" fill="none" stroke="#5fbf3a" stroke-width="4" stroke-linecap="round"/><ellipse cx="24" cy="28" rx="20" ry="16" fill="#ff7a12"/><ellipse cx="14" cy="28" rx="8" ry="15" fill="#ff9a2a" opacity=".55"/><ellipse cx="34" cy="28" rx="8" ry="15" fill="#d95f00" opacity=".45"/><path d="M13 24l6 3-6 3zM35 24l-6 3 6 3zM15 35q9 7 18 0l-3-2-3 2-3-2-3 2-3-2z" fill="#2a0f3a"/></svg>';
var EV_CANDY='<svg class="evpk" viewBox="0 0 48 48" aria-hidden="true"><path d="M2 14l12 10L2 34z" fill="#ffb3dd"/><path d="M46 14L34 24l12 10z" fill="#ffb3dd"/><circle cx="24" cy="24" r="14" fill="#ff7fc2"/><path d="M14 16c4 2 6 6 6 10s-2 7-4 9M24 11c4 3 6 8 6 13s-2 9-5 13M33 15c-3 3-4 6-4 10s1 7 3 10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></svg>';
var EV_TRICK='<svg class="evpk" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3L31 19H17z" fill="#fff3d6"/><path d="M17 19H31L37 34H11z" fill="#ff9a2a"/><path d="M11 34H37L43 45H5z" fill="#ffd23f"/></svg>';
var EV_ICONS={pumpkin:EV_PUMPKIN,candy:EV_CANDY,trick:EV_TRICK,
  star:'<svg class="evpk" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3l6.5 14 15 1.8-11.2 10.3 3 15L24 36.6 10.7 44l3-15L2.5 18.8l15-1.8z" fill="#ffd23f" stroke="#ff9a2a" stroke-width="2" stroke-linejoin="round"/></svg>',
  snow:'<svg class="evpk" viewBox="0 0 48 48" aria-hidden="true"><g stroke="#e8f6ff" stroke-width="4" stroke-linecap="round"><path d="M24 4v40M7 14l34 20M41 14L7 34"/></g><circle cx="24" cy="24" r="5" fill="#9fe3ff"/></svg>',
  sun:'<svg class="evpk" viewBox="0 0 48 48" aria-hidden="true"><g stroke="#ffb52e" stroke-width="4" stroke-linecap="round"><path d="M24 3v7M24 38v7M3 24h7M38 24h7M9 9l5 5M34 34l5 5M39 9l-5 5M14 34l-5 5"/></g><circle cx="24" cy="24" r="11" fill="#ffd23f"/></svg>',
  heart:'<svg class="evpk" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42C8 30 4 21 4 15a10 10 0 0 1 20-3 10 10 0 0 1 20 3c0 6-4 15-20 27z" fill="#ff4f8b" stroke="#c4175a" stroke-width="2"/></svg>'};
function updateMenu(){
  $('#mCoins').textContent=save.coins;
  $('#mBest').textContent=save.best>0?'Best run: '+save.best+' coins':'Your first run is waiting';
  var ec=$('#mEvent'),ev=eventCard();
  ec.hidden=!ev;
  if(ev){
    var live=evOn&&evCur===ev||(evOn&&evCur&&evCur.key===ev.key);
    ec.className='evcard'+(live?' live':'')+(ev.card&&ev.card!=='spooky'?' '+ev.card:'');
    var tag=ev.tag||'';
    $('#evTag').hidden=!tag;$('#evTag').textContent=tag;
    $('#evIcon').innerHTML=EV_ICONS[ev.icon]||EV_ICONS.star;
    $('#evTitle').textContent=live?ev.name+' is live!':ev.name;
    $('#evSub').textContent=live?ev.liveSub:ev.sub;
    $('#evTime').textContent=live?'Ends in '+eventLeft(ev):(ev.h>=18?'Tonight':'Today')+' at '+ev.h+':00 · starts in '+eventIn(ev);
  }
  var deal=byId(dealId()),owned=save.owned.indexOf(deal.id)>=0;
  $('#dealBadge').hidden=owned;
  var xb=$('#musicBtn'),hb2=$('#hapBtn');
  xb.classList.toggle('off',save.music===false);xb.setAttribute('aria-pressed',save.music===false?'false':'true');xb.setAttribute('aria-label',save.music===false?'Music off':'Music on');
  hb2.classList.toggle('off',save.haptics===false);hb2.setAttribute('aria-pressed',save.haptics===false?'false':'true');hb2.setAttribute('aria-label',save.haptics===false?'Vibration off':'Vibration on');
  var mb=$('#muteBtn');
  mb.classList.toggle('off',!!save.muted);
  mb.setAttribute('aria-pressed',save.muted?'true':'false');
  mb.setAttribute('aria-label',save.muted?'Sound off':'Sound on');
}
setInterval(function(){if(mode==='menu'&&curScreen==='menu')updateMenu()},20000);
/* spider that crawls across the screen (only for themes that use the spider effect) */
(function(){
  var el=$('#spider'),lg=$('#spLegs'),i,sd,html='';
  for(i=0;i<4;i++){
    var y0=-7+i*5.5,sp=(i-1.5)*9;
    for(sd=-1;sd<=1;sd+=2){
      html+='<g class="lg'+((i+(sd>0?1:0))%2?' b':'')+'"><path d="M'+(sd*4)+' '+y0+' Q'+(sd*20)+' '+(y0-14)+' '+(sd*31)+' '+(y0+sp)+'" fill="none" stroke="#14101c" stroke-width="2.6" stroke-linecap="round"/></g>';
    }
  }
  lg.innerHTML=html;
  var st={on:false,wait:1.5,u:0,L:1,x0:0,y0:0,x1:0,y1:0,nx:0,ny:0,amp:26,pauseU:.5,pause:0,speed:120};
  function pos(u){var w=Math.sin(u*st.L/75)*st.amp;return {x:st.x0+(st.x1-st.x0)*u+st.nx*w,y:st.y0+(st.y1-st.y0)*u+st.ny*w}}
  function start(){
    var m=60,e=(Math.random()*4)|0,e2=(e+1+((Math.random()*3)|0))%4;
    function pt(k){var r=Math.random();return k===0?[r*W,-m]:k===1?[W+m,r*H]:k===2?[r*W,H+m]:[-m,r*H]}
    var a=pt(e),b=pt(e2);
    st.x0=a[0];st.y0=a[1];st.x1=b[0];st.y1=b[1];
    var dx=st.x1-st.x0,dy=st.y1-st.y0;st.L=Math.sqrt(dx*dx+dy*dy)||1;st.nx=-dy/st.L;st.ny=dx/st.L;
    st.u=0;st.pauseU=.25+Math.random()*.5;st.pause=0;st.speed=95+Math.random()*60;st.amp=18+Math.random()*16;st.on=true;
  }
  window.__spiderStep=function(dt){
    var show=evOn&&SEASONS[evCur.s].fx.indexOf('spider')>=0&&!paused&&(curScreen==='menu'||curScreen==='play');
    if(!show){if(!el.hidden)el.hidden=true;st.on=false;return}
    if(!st.on){
      st.wait-=dt;
      if(st.wait<=0){start();st.wait=0}
      else{if(!el.hidden)el.hidden=true;return}
    }
    var still=false;
    if(st.pause>0){st.pause-=dt;still=true}
    else{
      var prev=st.u;st.u+=st.speed*dt/st.L;
      if(prev<st.pauseU&&st.u>=st.pauseU){st.pause=.5+Math.random()*.7}
    }
    if(st.u>=1){st.on=false;st.wait=3+Math.random()*6;el.hidden=true;return}
    var a=pos(st.u),b=pos(Math.min(1,st.u+.01)),ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+90;
    if(el.hidden)el.hidden=false;
    el.style.transform='translate('+a.x.toFixed(1)+'px,'+a.y.toFixed(1)+'px) rotate('+ang.toFixed(1)+'deg)';
    el.classList.toggle('still',still);
  };
})();
var toastT;
function toast(m){
  var el=$('#toast');el.textContent=m;el.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('show')},1900);
}

