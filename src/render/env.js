/* ---------- scene + env application ---------- */
var frostEl=$('#frost'),flashEl=$('#flash'),popsEl=$('#pops');
var lastFrost=-1,lastFlash=-1;
function applyEnv(){
  skyMat.uniforms.top.value.copy(cur.skyTop);skyMat.uniforms.bot.value.copy(cur.skyBot);
  scene.fog.color.copy(cur.fog);scene.fog.near=cur.fogNear;scene.fog.far=cur.fogFar;
  hemi.color.copy(cur.hemiSky);hemi.groundColor.copy(cur.hemiGnd);hemi.intensity=cur.hemiI;
  dirL.color.copy(cur.dir);dirL.intensity=cur.dirI;rimL.color.copy(cur.rim);rimL.intensity=cur.rimI;
  groundMat.color.copy(cur.ground);laneMat.color.copy(cur.lane);laneMat.roughness=cur.laneRough;laneMat.metalness=.12+(1-cur.laneRough)*.25;
  mountMat.color.copy(cur.mount);foliageMat.color.copy(cur.foliage);trunkMat.color.copy(cur.trunk);cloudMat.color.copy(cur.cloud);
  var nf=nightF,sunY=cur.sunY+(-30-cur.sunY)*nf;
  if(nf>.002){
    skyMat.uniforms.top.value.lerp(NT.top,nf*.94);skyMat.uniforms.bot.value.lerp(NT.bot,nf*.9);
    scene.fog.color.lerp(NT.fog,nf*.9);hemi.color.lerp(NT.hs,nf*.8);hemi.groundColor.lerp(NT.hg,nf*.8);
    hemi.intensity=cur.hemiI*(1+.12*nf);dirL.color.lerp(NT.dir,nf*.85);dirL.intensity=cur.dirI*(1-.3*nf);rimL.color.lerp(NT.rim,nf*.8);
    groundMat.color.multiplyScalar(1-.2*nf);laneMat.color.multiplyScalar(1-.05*nf);mountMat.color.multiplyScalar(1-.2*nf);
    foliageMat.color.multiplyScalar(1-.15*nf);trunkMat.color.multiplyScalar(1-.15*nf);cloudMat.color.multiplyScalar(1-.25*nf);
    scene.fog.near=cur.fogNear*(1-.2*nf);scene.fog.far=cur.fogFar*(1-.2*nf);
  }
  /* night glow: cool self-lit tints, moonlit water, a soft light that follows the hero */
  groundMat.emissive.setRGB(.05*nf,.09*nf,.22*nf);mountMat.emissive.setRGB(.06*nf,.08*nf,.25*nf);waterMat.emissive.setRGB(.08*nf,.2*nf,.5*nf);
  heroGlow.intensity=nf*1.5;heroGlow.position.set(hero.x,3.5,4);
  cloudShade.color.copy(cloudMat.color).multiplyScalar(.82);
  sunMat.color.copy(cur.sun);sunGlowMat.color.copy(cur.sun);
  sunMesh.position.set(34,sunY,-150);sunMesh.scale.setScalar(8*cur.sunS);
  sunGlow.position.set(34,sunY,-152);sunGlow.scale.setScalar(70*cur.sunS);
  glitterMat.color.copy(cur.sun);glitterMat.opacity=.3*(1-nf)*(1-cur.cold*.6);glitter.visible=glitterMat.opacity>.01&&sunY>0;
  moon.visible=moonGlow.visible=nf>.02;moonMat.opacity=nf;moonGlowMat.opacity=nf*.9;moonGlow.scale.setScalar(95);
  stars.visible=nf>.02;starsMat.opacity=nf*(.8+.15*Math.sin(t*3));
  wx.mat.uniforms.uTint.value.copy(cur.pColor);
  for(var i=0;i<foliageMeshes.length;i++){
    var m=foliageMeshes[i],b=m.userData.base,k=b*cur.foliageScale;
    m.scale.set(k,k*(m.userData.by?1.15:1),k);
  }
  var fxl=SEASONS[seasonIdx].fx;pumpkins.visible=fxl.indexOf('pumpkins')>=0;candies.visible=fxl.indexOf('candies')>=0;
  if(candies.visible){
    var cdt=Math.min(.05,Math.max(0,t-(applyEnv.lt||t)));applyEnv.lt=t;
    for(var ci=0;ci<candyItems.length;ci++){
      var cg=candyItems[ci],ud=cg.userData;
      ud.y-=ud.v*cdt;if(ud.y<-1)ud.place(cg,true);
      cg.position.set(ud.x,ud.y,ud.z);cg.rotation.z+=ud.sp*cdt;cg.rotation.y+=ud.sp*.5*cdt;
    }
  }
  if(pumpkins.visible)pumpFace.color.setHSL(.12,1,.55+.1*Math.sin(t*5));
  var fo=Math.round(cur.cold*100)/100;
  if(fo!==lastFrost){lastFrost=fo;frostEl.style.opacity=(fo*.6).toFixed(3)}
}
var bannerT=0;
function showBanner(i){
  var s=SEASONS[i];
  $('#bnName').textContent=s.name;$('#bnName').style.color=s.color;$('#bnNote').textContent=s.note+' '+fmtTemp(s.temp);
  $('#banner').classList.add('show');clearTimeout(bannerT);
  bannerT=setTimeout(function(){$('#banner').classList.remove('show')},2800);
}
function setSeason(i,announce){
  if(i===seasonIdx)return;
  seasonIdx=i;
  if(announce){showBanner(i);sfx.season(i)}
}

/* ---------- weather step ---------- */
function weatherStep(dt){
  var p=wx.pos,i,fs=cur.pFall,top=28;
  for(i=0;i<WN;i++){
    var b=i*3,sp=fs*wspd[i];
    p[b+1]-=sp*dt;
    p[b]+=(Math.sin(t*.9+wph[i])*cur.pSway+cur.wind*.9)*dt;
    if(sp>0&&p[b+1]<-.3){p[b+1]=top;p[b]=rnd(-20,20);p[b+2]=rnd(-30,12)}
    else if(sp<0&&p[b+1]>top){p[b+1]=-.3;p[b]=rnd(-20,20);p[b+2]=rnd(-30,12)}
    if(p[b]>22)p[b]=-22;else if(p[b]<-22)p[b]=22;
    wx.size[i]=cur.pSize*wsz[i];wx.alpha[i]=cur.pAlpha;
  }
  wx.geo.attributes.position.needsUpdate=true;wx.geo.attributes.aSize.needsUpdate=true;wx.geo.attributes.aAlpha.needsUpdate=true;
}

