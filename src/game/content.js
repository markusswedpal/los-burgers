/* ---------- data ---------- */
var RAR={
  common:{label:'Common',color:'#9fb4d9',rgb:'159,180,217'},
  rare:{label:'Rare',color:'#3fb0ff',rgb:'63,176,255'},
  epic:{label:'Epic',color:'#c45cff',rgb:'196,92,255'},
  legendary:{label:'Legendary',color:'#ffb52e',rgb:'255,181,46'},
  mythic:{label:'Mythic',color:'#ff4f8b',rgb:'255,79,139'},
  exclusive:{label:'Premium',color:'#ffd23f',rgb:'255,214,64'}
};
/* Skins come from content/skins.json. The game treats that file as untrusted data:
   anything outside the allowed colours, parts and price range is cleaned or dropped here. */
var HEX=/^#[0-9a-fA-F]{6}$/;
var ACC_OK=['headband','mohawk','helmet','ninja','shades','horns','orbit','crown','halo','wings','hair','quiff','spikes','cap','headphones','ponytail','pigtails','bow','diamonds','coins'];
function hexOr(v,d){return typeof v==='string'&&HEX.test(v)?v:d}
function plain(v,n){return String(v).replace(/[<>&"]/g,'').slice(0,n)}
function numIn(v,a,b,d){return typeof v==='number'&&isFinite(v)?Math.min(b,Math.max(a,v)):d}
function cleanSkins(list){
  var out=[],seen={};
  (Array.isArray(list)?list:[]).forEach(function(s){
    if(!s||typeof s.id!=='string'||!/^[a-z0-9-]{1,24}$/.test(s.id)||seen[s.id])return;
    seen[s.id]=1;
    var rar=RAR[s.rarity]?s.rarity:'common',nm=plain(s.name||s.id,20);
    if(s.id==='copsven'){out.push({id:'copsven',name:nm,kind:'baby',rarity:rar,price:Math.round(numIn(s.price,40,20000,1800))});return}
    var o={id:s.id,name:nm,rarity:rar,price:s.id==='bun'?0:Math.round(numIn(s.price,40,20000,500)),
      body:hexOr(s.body,'#f2b45a'),accent:hexOr(s.accent,'#4a2a18'),eye:hexOr(s.eye,'#ffffff'),c2:hexOr(s.c2,'#ffffff'),
      acc:String(s.acc||'').split('+').filter(function(a){return ACC_OK.indexOf(a)>=0}).join('+')};
    if(s.cape)o.cape=hexOr(s.cape,'#ff4f8b');
    if(Array.isArray(s.trail))o.trail=s.trail.filter(function(h){return HEX.test(h)}).slice(0,3);
    if(o.trail&&!o.trail.length)delete o.trail;
    if(typeof s.metal==='number')o.metal=numIn(s.metal,0,1,0);
    if(s.sparkle===true)o.sparkle=true;
    if(s.gild===true)o.gild=true;
    if(s.gem===true)o.gem=true;
    out.push(o);
  });
  var b=out.filter(function(s){return s.id==='bun'})[0];
  if(!b)b={id:'bun',name:'Rookie Bruiser',rarity:'common',price:0,body:'#f2b45a',accent:'#4a2a18',eye:'#fff1b0',acc:'headband',c2:'#e5252f'};
  return [b].concat(out.filter(function(s){return s!==b}).slice(0,80));
}
var SKINS=cleanSkins(/*@@skins@@*/[]);

