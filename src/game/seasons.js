/* ---------- seasons ---------- */
var SEASON_LEN=18;
/* Looks come from content/themes.json. 'seasons' are the four core seasons (full settings);
   'themes' are event looks. A theme picks one of the FEELS below, so a theme can change how the
   world looks but never how the game plays. */
var FEELS={
  normal:{w:16,zeta:.9,fall:1,wind:.5,catchM:1},
  calm:{w:18,zeta:1,fall:.94,wind:0,catchM:1.06},
  gusty:{w:15,zeta:.95,fall:1.06,wind:1.1,catchM:.97},
  icy:{w:8.5,zeta:.45,fall:1.2,wind:1.8,catchM:.88},
  party:{w:17,zeta:1,fall:.95,wind:.3,catchM:1.05}
};
var FX_OK=['pumpkins','candies','spider'],BURGERS_OK=['shiny','candy','treat','strawberry','pirate','football'];
var MUSIC_IDS=['spring','summer','autumn','winter','halloween','candy','trick'];
var VIS={hemiI:[0,2,.8],dirI:[0,2,1],rimI:[0,2,.5],sunY:[0,60,26],sunS:[.3,3,1],pFall:[-2,5,1.5],pSway:[0,3,1],pSize:[.05,.6,.2],pAlpha:[0,1,.8],
  fogNear:[20,120,60],fogFar:[100,400,240],laneRough:[0,1,.7],foliageScale:[.5,1.5,1],cold:[0,1,0]};
var MECH={w:[4,30],zeta:[.2,1.5],fall:[.5,1.5],wind:[0,2.5],catchM:[.7,1.3],coin:[.5,2]};
var COLS=['skyTop','skyBot','fog','ground','lane','hemiSky','hemiGnd','dir','rim','mount','foliage','trunk','cloud','sun','pColor'];
var NUMS=['hemiI','dirI','rimI','sunY','sunS','pFall','pSway','pSize','pAlpha','fogNear','fogFar','laneRough','foliageScale','cold','w','zeta','fall','wind','catchM','coin'];
function cleanTheme(d,base,core){
  var o={},k,i;
  if(base)for(k in base)o[k]=base[k];
  if(typeof d.name==='string')o.name=plain(d.name,24);
  if(typeof d.note==='string')o.note=plain(d.note,120);
  if(typeof d.short==='string')o.short=plain(d.short,12);
  if(typeof d.temp==='number')o.temp=Math.round(numIn(d.temp,-30,40,10));
  if(typeof d.color==='string')o.color=hexOr(d.color,o.color||'#ffffff');
  for(i=0;i<COLS.length;i++){k=COLS[i];if(typeof d[k]==='string')o[k]=hexOr(d[k],o[k]||'#888888')}
  for(k in VIS)if(typeof d[k]==='number')o[k]=numIn(d[k],VIS[k][0],VIS[k][1],VIS[k][2]);
  if(core){for(k in MECH)if(typeof d[k]==='number')o[k]=numIn(d[k],MECH[k][0],MECH[k][1],1)}
  else{
    /* event themes: play style comes only from a named feel plus an optional coin bonus */
    var fl=FEELS[d.feel]?d.feel:(FEELS[o.feel]?o.feel:'normal'),f=FEELS[fl];
    o.feel=fl;for(k in f)o[k]=f[k];
    o.coin=[1,1.5,2].indexOf(d.coinBonus)>=0?d.coinBonus:1;
    if(Array.isArray(d.effects))o.fx=d.effects.filter(function(x){return FX_OK.indexOf(x)>=0});
    if(BURGERS_OK.indexOf(d.burgers)>=0)o.burgers=d.burgers;
    if(MUSIC_IDS.indexOf(d.music)>=0)o.musicIdx=MUSIC_IDS.indexOf(d.music);
  }
  if(!o.fx)o.fx=[];
  if(!o.burgers)o.burgers='shiny';
  if(!o.name)o.name='Theme';
  if(!o.note)o.note='';
  if(typeof o.temp!=='number')o.temp=10;
  if(!o.color)o.color='#ffffff';
  return o;
}
var CONTENT_THEMES=/*@@themes@@*/{seasons:[],themes:[]};
var SEASONS=(function(){
  var out=[],byid={},ids=['spring','summer','autumn','winter'],i,s;
  for(i=0;i<4;i++){
    s=cleanTheme((CONTENT_THEMES.seasons||[])[i]||{},i?out[0]:null,true);
    s.id=ids[i];s.musicIdx=i;out.push(s);byid[s.id]=s;
  }
  (CONTENT_THEMES.themes||[]).slice(0,40).forEach(function(d){
    if(!d||typeof d.id!=='string'||!/^[a-z0-9-]{1,24}$/.test(d.id)||byid[d.id])return;
    var b=typeof d.extends==='string'&&byid[d.extends]?byid[d.extends]:out[1];
    s=cleanTheme(d,b,false);s.id=d.id;
    if(!(MUSIC_IDS.indexOf(d.music)>=0))s.musicIdx=b.musicIdx;
    out.push(s);byid[s.id]=s;
  });
  return out;
})();
function mkEnv(d){
  var e={},i;
  for(i=0;i<COLS.length;i++)e[COLS[i]]=new T.Color(d[COLS[i]]);
  for(i=0;i<NUMS.length;i++)e[NUMS[i]]=d[NUMS[i]];
  return e;
}
var ENV=SEASONS.map(mkEnv);
/* timed events come from content/events.json: a theme, a start hour and a length, nothing else */
var CARDS_OK=['spooky','trick','candy','ocean','sunny','frost','berry','pirate','pitch'],ICONS_OK=['pumpkin','candy','trick','star','snow','sun','heart','strawberry','chest','ball'];
function cleanEvents(list){
  var out=[],seen={},DT=/^\d{4}-\d\d-\d\d$/;
  (Array.isArray(list)?list:[]).slice(0,30).forEach(function(e){
    if(!e||typeof e.key!=='string'||!/^[a-z0-9-]{1,24}$/.test(e.key)||seen[e.key])return;
    var si=-1,j;for(j=4;j<SEASONS.length;j++)if(SEASONS[j].id===e.theme)si=j;
    if(si<0)return;
    seen[e.key]=1;
    var h=Math.round(numIn(e.h,0,23,19)),len=Math.round(numIn(e.len,1,3,1));if(h+len>24)len=24-h;
    var o={key:e.key,s:si,h:h,len:len,name:plain(e.name||'Event',24),
      liveSub:plain(e.liveSub||e.sub||'',80),sub:plain(e.sub||e.liveSub||'',80),
      pre:Math.round(numIn(e.pre,0,h,0)),card:CARDS_OK.indexOf(e.card)>=0?e.card:'spooky',icon:ICONS_OK.indexOf(e.icon)>=0?e.icon:'star'};
    if(typeof e.tag==='string'&&e.tag)o.tag=plain(e.tag,20);
    if(typeof e.date==='string'&&DT.test(e.date))o.date=e.date;
    if(typeof e.from==='string'&&DT.test(e.from))o.from=e.from;
    if(typeof e.to==='string'&&DT.test(e.to))o.to=e.to;
    if(Array.isArray(e.weekdays))o.weekdays=e.weekdays.filter(function(d){return d>=0&&d<=6&&d===Math.floor(d)});
    if(Array.isArray(e.skip))o.skip=e.skip.filter(function(d){return typeof d==='string'&&DT.test(d)}).slice(0,60);
    out.push(o);
  });
  return out;
}
var EVENTS=cleanEvents(/*@@events@@*/[]);
function todayKey(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
/* does this event run on this calendar day? */
function eventDay(e,k,n){
  if(e.skip&&e.skip.indexOf(k)>=0)return false;
  if(e.date&&e.date!==k)return false;
  if(e.from&&k<e.from)return false;
  if(e.to&&k>e.to)return false;
  if(e.weekdays&&e.weekdays.length&&e.weekdays.indexOf(n.getDay())<0)return false;
  return true;
}
function eventNow(){
  var n=new Date(),h=n.getHours(),k=todayKey();
  for(var i=0;i<EVENTS.length;i++){var e=EVENTS[i];if(eventDay(e,k,n)&&h>=e.h&&h<e.h+e.len)return e}
  return null;
}
function eventOn(){return !!eventNow()}
function eventLeft(e){var n=new Date(),m=Math.max(0,Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate(),e.h+e.len,0,0)-n)/6e4));return m+' min'}
function eventIn(e){
  var n=new Date(),t0=new Date(n.getFullYear(),n.getMonth(),n.getDate(),e.h,0,0);
  if(n>=t0)t0=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1,e.h,0,0);
  var m=Math.round((t0-n)/6e4);return Math.floor(m/60)+'h '+(m%60)+'m';
}
/* which event's card to show on the menu: the live one, else the next one that is inside its announcement window */
function eventCard(){
  var live=eventNow();if(live)return live;
  var n=new Date(),h=n.getHours(),k=todayKey(),best=null;
  for(var i=0;i<EVENTS.length;i++){
    var e=EVENTS[i];
    if(!eventDay(e,k,n)||!(h>=e.pre&&h<e.h))continue;
    if(!best||e.h<best.h)best=e;
  }
  return best;
}
var evCur=eventNow(),evOn=!!evCur,evCheck=0;
function realSeason(){var m=new Date().getMonth();return m>=2&&m<=4?0:m>=5&&m<=7?1:m>=8&&m<=10?2:3}
var seasonIdx=realSeason();
var cur=mkEnv(SEASONS[seasonIdx]);
function blendEnv(dt){
  var a=1-Math.exp(-dt*1.3),tg=ENV[seasonIdx],i,k;
  for(i=0;i<COLS.length;i++){k=COLS[i];cur[k].lerp(tg[k],a)}
  for(i=0;i<NUMS.length;i++){k=NUMS[i];cur[k]+=(tg[k]-cur[k])*a}
}
function fmtTemp(t){return (t<0?'−':'')+Math.abs(t)+'°C'}

