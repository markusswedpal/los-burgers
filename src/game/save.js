function byId(id){for(var i=0;i<SKINS.length;i++)if(SKINS[i].id===id)return SKINS[i];return SKINS[0]}

var KEY='burgerrain.v1';
var save={coins:25,owned:['bun'],equipped:'bun',babySkin:'',best:0,runs:0,muted:false};
try{
  var raw=localStorage.getItem(KEY);
  if(raw){
    var o=JSON.parse(raw);
    if(o&&typeof o==='object'){
      save=Object.assign(save,o);
      if(!Array.isArray(save.owned)||save.owned.indexOf('bun')<0)save.owned=['bun'];
      if(save.owned.indexOf(save.equipped)<0||byId(save.equipped).kind==='baby')save.equipped='bun';
      if(typeof save.babySkin!=='string'||save.owned.indexOf(save.babySkin)<0)save.babySkin='';
      if(typeof save.coins!=='number'||save.coins<0)save.coins=0;
      if(typeof save.runs!=='number'||save.runs<0)save.runs=0;
    }
  }
}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}}

/* daily deal: one unowned skin is 25% off until midnight */
function dayNum(){var d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000)}
var BUYABLE=SKINS.filter(function(s){return s.price>0});
function dealId(){return BUYABLE[dayNum()%BUYABLE.length].id}
function priceOf(s){return s.id===dealId()?Math.round(s.price*0.75):s.price}
function dealLeft(){
  var n=new Date(),end=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1),ms=end-n;
  return Math.floor(ms/36e5)+'h '+Math.floor(ms%36e5/6e4)+'m';
}

