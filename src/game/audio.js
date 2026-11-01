/* ---------- audio ---------- */
var actx=null;
function ensureAudio(){
  if(!actx){try{actx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){actx=null}if(actx)startMusic()}
  if(actx&&actx.state==='suspended'){try{actx.resume()}catch(e){}}
}
function tone(f,d,type,vol,slide,delay){
  if(save.muted||!actx)return;
  try{
    var t0=actx.currentTime+(delay||0),o=actx.createOscillator(),g=actx.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f*slide),t0+d);
    g.gain.setValueAtTime(vol||.06,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
    o.connect(g);g.connect(actx.destination);o.start(t0);o.stop(t0+d+.02);
  }catch(e){}
}
/* haptics: Android vibrates; iPhone/iPad Safari 18+ gets a light tick through a hidden switch (best effort) */
var hapEl=null,lastBuzz=0;
function buzz(pat){
  if(save.haptics===false)return;
  var n=performance.now();if(n-lastBuzz<35)return;lastBuzz=n;
  try{
    if(navigator.vibrate){navigator.vibrate(pat);return}
    if(!hapEl)hapEl=document.getElementById('hap');
    if(hapEl)hapEl.click();
  }catch(e){}
}
/* procedural music, one groove per season (and one for Halloween Hour) */
var MUSIC=[
  {bpm:118,root:60,aw:'triangle',prog:[[0,4,7],[5,9,12],[7,11,14],[0,4,7]],bass:[0,5,7,0],arp:[0,1,2,1,0,1,2,1],hat:1,av:.05,up:12},
  {bpm:124,root:62,aw:'triangle',prog:[[0,4,7],[7,11,14],[9,12,16],[5,9,12]],bass:[0,7,9,5],arp:[0,2,1,2,0,2,1,2],hat:1,av:.045,up:12},
  {bpm:100,root:57,aw:'triangle',prog:[[0,3,7],[8,12,15],[3,7,10],[10,14,17]],bass:[0,8,3,10],arp:[0,1,2,1,2,1,0,1],hat:0,av:.05,up:12},
  {bpm:84,root:64,aw:'sine',prog:[[0,3,7],[8,12,15],[3,7,10],[10,14,17]],bass:[0,8,3,10],arp:[2,-1,1,-1,2,-1,0,-1],hat:0,av:.06,up:24,bell:1},
  {bpm:110,root:57,aw:'square',prog:[[0,3,7],[2,5,8],[7,11,14],[0,3,7]],bass:[0,2,7,0],arp:[0,2,1,2,0,2,1,-1],hat:2,av:.022,up:12}
];
var mus={timer:0,step:0,next:0,s:-1,bus:null,noise:null};
function mf(m){return 440*Math.pow(2,(m-69)/12)}
function musicOn(){return !save.muted&&save.music!==false}
function startMusic(){
  if(!actx||mus.timer)return;
  try{
    mus.bus=actx.createGain();mus.bus.gain.value=.7;mus.bus.connect(actx.destination);
    var n=Math.floor(actx.sampleRate*.05),b=actx.createBuffer(1,n,actx.sampleRate),d=b.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=Math.random()*2-1;
    mus.noise=b;
  }catch(e){return}
  mus.timer=setInterval(musicTick,90);
}
function mtone(f,t0,d,type,vol,bell){
  var o=actx.createOscillator(),g=actx.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);
  g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
  o.connect(g);g.connect(mus.bus);o.start(t0);o.stop(t0+d+.03);
  if(bell){
    var o2=actx.createOscillator(),g2=actx.createGain();o2.type='sine';o2.frequency.setValueAtTime(f*2.76,t0);
    g2.gain.setValueAtTime(.0001,t0);g2.gain.exponentialRampToValueAtTime(vol*.35,t0+.01);g2.gain.exponentialRampToValueAtTime(.0001,t0+d*.6);
    o2.connect(g2);g2.connect(mus.bus);o2.start(t0);o2.stop(t0+d);
  }
}
function mhat(t0,vol){
  var src=actx.createBufferSource(),hp=actx.createBiquadFilter(),g=actx.createGain();
  src.buffer=mus.noise;hp.type='highpass';hp.frequency.value=7000;
  g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+.05);
  src.connect(hp);hp.connect(g);g.connect(mus.bus);src.start(t0);
}
function musicStep(m,st,t0,sd){
  var i=st%8,bar=((st/8)|0)%4,ch=m.prog[bar];
  if(i===0||i===4)mtone(mf(m.root+m.bass[bar]-12),t0,sd*3.4,'sine',i?.05:.075);
  var a=m.arp[i];
  if(a>=0)mtone(mf(m.root+ch[a]+m.up),t0,sd*(m.bell?4:1.5),m.aw,m.av,m.bell);
  if(m.hat===1&&i%2===1)mhat(t0,.018);
  else if(m.hat===2&&i%4===2)mhat(t0,.012);
}
function musicTick(){
  if(!actx||actx.state!=='running'||!musicOn()||paused||mode==='over'||document.hidden){mus.next=0;return}
  var m=MUSIC[SEASONS[seasonIdx].musicIdx]||MUSIC[0],now=actx.currentTime;
  if(mus.s!==seasonIdx){mus.s=seasonIdx;mus.step=0;mus.next=0}
  mus.bus.gain.setTargetAtTime(mode==='play'?.85:.55,now,.3);
  if(mus.next<now+.02)mus.next=now+.06;
  var sd=60/m.bpm/2;
  while(mus.next<now+.3){musicStep(m,mus.step,mus.next,sd);mus.next+=sd;mus.step++}
}
var sfx={
  coin:function(n){tone(620+Math.min(n,12)*35,.11,'square',.04,1.5)},
  gold:function(){tone(880,.1,'square',.05,1.4);tone(1320,.2,'square',.05,1.2,.08)},
  bad:function(){tone(180,.35,'sawtooth',.08,.45)},
  miss:function(){tone(260,.22,'triangle',.08,.6)},
  buy:function(){tone(523,.1,'square',.05);tone(659,.1,'square',.05,0,.09);tone(784,.22,'square',.05,0,.18)},
  equip:function(){tone(700,.08,'triangle',.07,1.3)},
  baby:function(){tone(988,.09,'square',.05);tone(1318,.1,'square',.05,0,.08);tone(1568,.18,'square',.05,0,.16)},
  babyBye:function(){tone(784,.18,'triangle',.07,.6)},
  season:function(n){tone(330+n*90,.14,'triangle',.07);tone(495+n*90,.22,'triangle',.07,0,.12)},
  over:function(){tone(392,.18,'triangle',.08);tone(311,.18,'triangle',.08,0,.17);tone(233,.4,'triangle',.08,0,.34)},
  power:function(){tone(520,.08,'sine',.07);tone(780,.1,'sine',.07,0,.07);tone(1040,.18,'sine',.07,0,.14)},
  shield:function(){tone(300,.25,'sawtooth',.06,2.2);tone(900,.12,'square',.04,.5,.05)},
  boss:function(){tone(110,.6,'sawtooth',.09,.5);tone(82,.7,'square',.06,.6,.15)},
  bossFire:function(){tone(220,.14,'square',.04,.7)},
  bossHit:function(){tone(300,.12,'square',.06,.6);tone(180,.2,'sawtooth',.06,.5,.05)},
  bossDown:function(){tone(392,.12,'square',.06);tone(523,.12,'square',.06,0,.1);tone(659,.12,'square',.06,0,.2);tone(784,.35,'square',.06,0,.3)}
};

