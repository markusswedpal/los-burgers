/* ---------- leaderboard: shared through Supabase, with a device-only fallback ---------- */
var SB_URL='https://pvvgkrbxsaqngekxqlki.supabase.co';
var SB_KEY='sb_publishable_5EQnuvdJRdYoZ2kFAj_Z8A__8AoeaZH';
var BKEY='burgerrain.board.v1',DKEY='burgerrain.device.v1';
var lbTab='all',lbDay=[],lbLocal=[],lbShared=[],lbLive=false,lbLoading=false,freshId=null,deviceId='';
try{
  var lraw=JSON.parse(localStorage.getItem(BKEY)||'[]');
  if(Array.isArray(lraw))lbLocal=lraw.filter(function(e){return e&&typeof e.name==='string'&&typeof e.score==='number'}).slice(0,100);
}catch(e){}
try{deviceId=localStorage.getItem(DKEY)||''}catch(e){}
if(!/^[0-9a-f-]{36}$/.test(deviceId)){
  deviceId=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)});
  try{localStorage.setItem(DKEY,deviceId)}catch(e){}
}
function dayKeyOf(ms){try{return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm'}).format(new Date(ms))}catch(e){var d=new Date(ms);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}}
function lbListFor(tab){
  if(tab==='day'){
    if(lbLive)return lbDay;
    var k=dayKeyOf(Date.now());return lbLocal.filter(function(e){return dayKeyOf(e.d)===k}).slice(0,10);
  }
  return lbLive?lbShared:lbLocal;
}
function lbList(){return lbListFor('all')}
function lbPersist(){try{localStorage.setItem(BKEY,JSON.stringify(lbLocal))}catch(e){}}
function cleanName(s){return String(s||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14)}
function lbRankIn(l,score){var n=0;for(var i=0;i<l.length;i++)if(l[i].score>=score)n++;return n+1}
function lbRank(score){return lbRankIn(lbList(),score)}
function sbFetch(path,opts){
  var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort()},8000);
  opts=opts||{};opts.headers=Object.assign({apikey:SB_KEY},opts.headers||{});
  if(ctl)opts.signal=ctl.signal;
  return fetch(SB_URL+path,opts).then(function(r){
    clearTimeout(tm);
    if(!r.ok)return r.text().then(function(t){throw new Error(t||String(r.status))});
    return r.json();
  },function(e){clearTimeout(tm);throw e});
}
/* top 100 of all time + today's top 10 from the shared tables; resolves true when the server answered */
function lbMap(rows){return (Array.isArray(rows)?rows:[]).map(function(r){return {id:'s'+r.id,name:String(r.name),score:Number(r.score),season:r.season||'',d:Date.parse(r.created_at)||Date.now()}})}
function lbRefresh(){
  lbLoading=true;
  var pa=sbFetch('/rest/v1/scores?select=id,name,score,season,created_at&order=score.desc,id.asc&limit=100');
  var pd=sbFetch('/rest/v1/rpc/top_today',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"p_limit":10}'}).then(lbMap,function(){return null});
  return Promise.all([pa,pd]).then(function(res){
    lbShared=lbMap(res[0]);
    if(res[1])lbDay=res[1];
    else{var k=dayKeyOf(Date.now());lbDay=lbShared.filter(function(e){return dayKeyOf(e.d)===k}).slice(0,10)}
    lbLive=true;lbLoading=false;return true;
  }).catch(function(){lbLive=false;lbLoading=false;return false});
}
function lbAddLocal(name,score,seasonName){
  var e={id:'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:name,score:score,season:seasonName,d:Date.now()};
  lbLocal.push(e);
  lbLocal.sort(function(a,b){return b.score-a.score||a.d-b.d});
  var rank=lbLocal.indexOf(e)+1;
  var dk=dayKeyOf(e.d),dayRank=lbLocal.filter(function(x){return dayKeyOf(x.d)===dk}).indexOf(e)+1;
  lbLocal=lbLocal.slice(0,100);lbPersist();
  return {id:e.id,rank:rank,dayRank:dayRank,shared:false};
}
/* saves one score; shared when the server is reachable, otherwise on this device */
function lbSubmit(name,score,seasonName){
  if(!lbLive)return Promise.resolve(lbAddLocal(name,score,seasonName));
  return sbFetch('/rest/v1/rpc/submit_score',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({p_name:name,p_score:score,p_season:seasonName,p_device:deviceId})
  }).then(function(rows){
    var r=Array.isArray(rows)?rows[0]:rows;
    return lbRefresh().then(function(){
      var dr=r.out_day_rank;
      if(dr==null){var ix=-1;for(var i=0;i<lbDay.length;i++)if(lbDay[i].id==='s'+r.out_id)ix=i;dr=ix>=0?ix+1:99}
      return {id:'s'+r.out_id,rank:r.out_rank,dayRank:dr,shared:true};
    });
  });
}

