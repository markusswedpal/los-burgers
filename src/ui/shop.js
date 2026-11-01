/* ---------- shop (3D previews drawn into 2D cards) ---------- */
var cards=[],builtDeal=null,pv=null;
function initPreview(){
  if(pv)return pv;
  try{
    var r=new T.WebGLRenderer({alpha:true,antialias:true});
    r.setPixelRatio(1);r.setSize(240,180,false);r.setClearColor(0x000000,0);
    var sc=new T.Scene(),cam=new T.PerspectiveCamera(34,240/180,.1,50);
    cam.position.set(0,2.2,8.6);cam.lookAt(0,1.9,0);
    sc.add(new T.HemisphereLight(0xdfe8ff,0x7a5aa8,.9));
    var d1=new T.DirectionalLight(0xffffff,1.1);d1.position.set(-5,8,8);sc.add(d1);
    var d2=new T.DirectionalLight(0x8ac8ff,.6);d2.position.set(6,3,-6);sc.add(d2);
    pv={r:r,sc:sc,cam:cam};
  }catch(e){pv=null}
  return pv;
}
function babyPreview(s){
  var b=buildBaby(s.id),w=new T.Group();
  b.group.scale.setScalar(1.7);b.group.position.y=.55;w.add(b.group);
  return {group:w,pose:function(tt){b.pose(tt,1,0)}};
}
function isEq(s){return s.kind==='baby'?save.babySkin===s.id:save.equipped===s.id}
function equipSkin(s){if(s.kind==='baby')save.babySkin=s.id;else save.equipped=s.id}
function buildShop(){
  var list=$('#shopList');list.textContent='';
  cards.forEach(function(c){if(c.hero){if(pv)pv.sc.remove(c.hero.group);disposeObj(c.hero.group)}});
  cards=[];
  var deal=dealId();builtDeal=deal;
  initPreview();
  var order=SKINS.filter(function(s){return s.id===deal}).concat(SKINS.filter(function(s){return s.id!==deal}));
  order.forEach(function(s){
    var r=RAR[s.rarity],el=document.createElement('article');
    el.className='card';el.style.setProperty('--rc',r.color);el.style.setProperty('--rgb',r.rgb);
    el.innerHTML='<div class="card-in"><div class="prev"><canvas width="240" height="180"></canvas><span class="deal-tag" hidden>-25%</span></div>'+
      '<div class="meta"><h3>'+s.name+'</h3><p class="rar">'+r.label+'</p></div><button class="buy" type="button"></button></div>';
    list.appendChild(el);
    var cvs=el.querySelector('canvas'),btn=el.querySelector('.buy');
    btn.addEventListener('click',function(){onSkinTap(s.id,btn)});
    btn.addEventListener('animationend',function(){btn.classList.remove('nope')});
    var h=null;
    if(pv){h=s.kind==='baby'?babyPreview(s):buildHero(s);h.group.visible=false;pv.sc.add(h.group)}
    cards.push({skin:s,el:el,ctx:cvs.getContext('2d'),btn:btn,tag:el.querySelector('.deal-tag'),hero:h});
  });
}
function refreshShop(){
  $('#sCoins').textContent=save.coins;$('#mCoins').textContent=save.coins;
  var deal=dealId(),ds=byId(deal);
  $('#dealLine').innerHTML=save.owned.indexOf(deal)>=0?'Daily deal: you already own '+ds.name+'.':'Daily deal: <b>'+ds.name+'</b> is 25% off. Ends in '+dealLeft()+'.';
  cards.forEach(function(cd){
    var s=cd.skin,owned=save.owned.indexOf(s.id)>=0,btn=cd.btn,isDeal=s.id===deal&&!owned;
    cd.tag.hidden=!isDeal;
    if(isEq(s)){btn.className='buy on';btn.textContent='Equipped';btn.setAttribute('aria-label',s.name+' equipped')}
    else if(owned){btn.className='buy equip';btn.textContent='Equip';btn.setAttribute('aria-label','Equip '+s.name)}
    else{
      var p=priceOf(s),can=save.coins>=p;
      btn.className='buy '+(can?'price':'cant');
      btn.innerHTML=(isDeal?'<s>'+s.price+'</s>':'')+'<i class="coin"></i>'+p;
      btn.setAttribute('aria-label','Buy '+s.name+' for '+p+' coins');
    }
  });
}
function onSkinTap(id,btn){
  var s=byId(id);ensureAudio();
  if(isEq(s)){if(s.kind==='baby'){save.babySkin='';persist();refreshShop();toast('Sven is back to normal')}return}
  if(save.owned.indexOf(id)>=0){equipSkin(s);persist();refreshShop();sfx.equip();toast(s.name+' equipped');return}
  var p=priceOf(s);
  if(save.coins>=p){
    save.coins-=p;save.owned.push(id);equipSkin(s);persist();refreshShop();sfx.buy();toast('Unlocked '+s.name);
  }else{
    toast('Need '+(p-save.coins)+' more coins');sfx.miss();btn.classList.remove('nope');void btn.offsetWidth;btn.classList.add('nope');
  }
}
function openShop(){
  setScreen('shop');
  if(!cards.length||builtDeal!==dealId())buildShop();
  refreshShop();
  $('#shopList').scrollTop=0;
}
var shopRR=0;
function renderShop(tt){
  if(!pv||!cards.length)return;
  var lr=$('#shopList').getBoundingClientRect(),done=0,n=cards.length,tries=0;
  while(done<3&&tries<n){
    var i=shopRR%n;shopRR++;tries++;
    var cd=cards[i],h=cd.hero;
    if(!h)continue;
    var br=cd.el.getBoundingClientRect();
    if(br.bottom<lr.top||br.top>lr.bottom)continue;
    var c=cd.ctx,r=RAR[cd.skin.rarity];
    h.group.visible=true;
    h.group.rotation.y=Math.sin(tt*.9+i)*.55;
    h.pose(tt+i,{lean:0,walk:0,mouth:.2+.2*Math.sin(tt*3+i),punch:Math.max(0,Math.sin(tt*2.2+i))*.8,pside:i%2?1:-1,sad:false});
    pv.r.render(pv.sc,pv.cam);
    h.group.visible=false;
    c.clearRect(0,0,240,180);
    var g=c.createRadialGradient(120,108,6,120,108,105);
    g.addColorStop(0,'rgba('+r.rgb+',.5)');g.addColorStop(1,'rgba('+r.rgb+',0)');
    c.fillStyle=g;c.fillRect(0,0,240,180);
    c.drawImage(pv.r.domElement,0,0,240,180);
    done++;
  }
}

