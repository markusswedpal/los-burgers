/* ---------- three.js world ---------- */
var FOV=50,HR=1.15,FIELD=5.9,HB=5.1,IS=1.35;
var W=360,H=640,camDist=28,spawnY=24,fallScale=1;
var scene=new T.Scene();
var camera=new T.PerspectiveCamera(FOV,W/H,.5,900);
scene.fog=new T.Fog(0xffffff,60,260);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));

var hemi=new T.HemisphereLight(0xffffff,0x888888,.8);scene.add(hemi);
var dirL=new T.DirectionalLight(0xffffff,1);dirL.position.set(-8,14,12);scene.add(dirL);
var rimL=new T.DirectionalLight(0xffffff,.5);rimL.position.set(9,6,-10);scene.add(rimL);

function glowTexture(){
  var c=document.createElement('canvas');c.width=c.height=64;
  var g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,64,64);
  return new T.CanvasTexture(c);
}
var GLOW=glowTexture();

/* sky dome */
var skyMat=new T.ShaderMaterial({
  uniforms:{top:{value:new T.Color()},bot:{value:new T.Color()}},
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){float h=normalize(vP).y;gl_FragColor=vec4(mix(bot,top,smoothstep(-0.02,0.55,h)),1.0);}',
  side:T.BackSide,depthWrite:false,fog:false
});
var sky=new T.Mesh(new T.SphereGeometry(420,24,12),skyMat);sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);

/* terrain */
function hFn(x,z){
  var side=sstep(8,26,Math.abs(x)),far=sstep(-6,-70,z);
  var n=Math.sin(x*.11+1.7)*Math.cos(z*.09)+.6*Math.sin(x*.27+z*.19)+.3*Math.sin(z*.31+x*.13);
  var h=Math.max(0,n+.9)*(side*5+far*7)*.45;
  var lake=lakeMask(x,z);
  return h*(1-lake)-3.4*lake;
}
function lakeMask(x,z){return sstep(-42,-62,z)*(1-sstep(50,78,Math.abs(x)))}
var seed=7;function srnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
var nearBg=new T.Group(),farBg=new T.Group();scene.add(nearBg);scene.add(farBg);

var groundMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:1,metalness:0,flatShading:true});
var gGeo=new T.PlaneGeometry(520,420,72,60);gGeo.rotateX(-Math.PI/2);gGeo.translate(0,0,-130);
(function(){
  var p=gGeo.attributes.position,i;
  for(i=0;i<p.count;i++)p.setY(i,hFn(p.getX(i),p.getZ(i))-.02);
  gGeo.computeVertexNormals();
})();
var ground=new T.Mesh(gGeo,groundMat);nearBg.add(ground);

/* arena lane */
var laneMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.7,metalness:.12});
var lane=new T.Mesh(new T.BoxGeometry(13.8,.5,9.4),laneMat);lane.position.set(0,-.23,.4);scene.add(lane);
var edgeMat=new T.MeshBasicMaterial({color:'#35e0ff'});
var eF=new T.Mesh(new T.BoxGeometry(14.1,.12,.16),edgeMat);eF.position.set(0,.06,5.17);scene.add(eF);
var eL=new T.Mesh(new T.BoxGeometry(.16,.12,9.5),edgeMat);eL.position.set(-6.97,.06,.4);scene.add(eL);
var eR=eL.clone();eR.position.x=6.97;scene.add(eR);

/* halloween pumpkins: only shown during the 19:00 hour */
var candies=new T.Group(),candyItems=[];candies.visible=false;scene.add(candies);
(function(){
  var cols=['#ff9ad0','#8fd8ff','#b8f0c8','#ffe08a','#d3b8ff','#ffb48a'];
  var body=new T.SphereGeometry(.5,12,8),cone=new T.ConeGeometry(.32,.5,8),stick=new T.CylinderGeometry(.04,.04,1.1,6),disc=new T.CylinderGeometry(.55,.55,.14,16),stickM=std('#ffffff',.6,0);
  function place(g,top){
    var x=rnd(-18,18);g.userData.x=x;g.userData.z=Math.abs(x)<8?rnd(-20,-2):rnd(-20,4);g.userData.y=top?rnd(26,34):rnd(0,30);
  }
  for(var i=0;i<46;i++){
    var c=cols[i%cols.length],m=std(c,.3,.1,{emissive:c,emissiveIntensity:.25}),g=new T.Group(),type=i%3,sx;
    if(type===0){
      var b=new T.Mesh(body,m);b.scale.set(1.2,.8,.8);g.add(b);
      for(sx=-1;sx<=1;sx+=2){var w=new T.Mesh(cone,m);w.rotation.z=-sx*Math.PI/2;w.position.x=sx*.78;g.add(w)}
    }else if(type===1){
      var d=new T.Mesh(disc,m);d.rotation.x=Math.PI/2;g.add(d);var st=new T.Mesh(stick,stickM);st.position.y=-.75;g.add(st);
    }else g.add(new T.Mesh(body,m));
    g.scale.setScalar(.55+((i*37)%10)/22);
    g.userData={v:rnd(2.5,6),sp:rnd(-2,2),place:place};
    place(g,false);candies.add(g);candyItems.push(g);
  }
})();
var pumpkins=new T.Group();pumpkins.visible=false;scene.add(pumpkins);
var pumpFace=new T.MeshBasicMaterial({color:'#ffe066'});
(function(){
  var body=new T.SphereGeometry(1,14,10),stem=new T.CylinderGeometry(.09,.16,.45,6),
      eyeG=new T.ConeGeometry(.2,.3,3),mouthG=new T.BoxGeometry(.9,.12,.05),
      om=std('#ff7a12',.35,.1,{emissive:'#a03a00',emissiveIntensity:.5,flatShading:true}),sm=std('#3f7a1f',.8,0);
  var spots=[[-7.8,2.6,.8],[7.9,3.2,1],[-8.6,-.4,1.2],[8.9,-.8,.9],[-7.6,-3.2,.9],[7.8,-3.6,1.15],[-11,1.2,1.5],[11.4,.6,1.4],[-12.5,-4,1.9],[13,-5,1.7],[-5.5,-7,1.3],[5,-8,1.5],[-1.5,-10,1.1],[2.4,-6.5,.8]];
  for(var i=0;i<spots.length;i++){
    var sp=spots[i],g=new T.Group(),m=new T.Mesh(body,om);m.scale.set(1,.82,1);g.add(m);
    var st=new T.Mesh(stem,sm);st.position.y=.88;st.rotation.z=.2;g.add(st);
    for(var k=-1;k<=1;k+=2){var e=new T.Mesh(eyeG,pumpFace);e.position.set(k*.36,.2,.88);e.rotation.x=Math.PI/2;e.rotation.y=Math.PI;g.add(e)}
    var mo=new T.Mesh(mouthG,pumpFace);mo.position.set(0,-.28,.9);g.add(mo);
    g.position.set(sp[0],.55*sp[2],sp[1]);g.scale.setScalar(sp[2]);g.rotation.y=-sp[0]*.03;pumpkins.add(g);
  }
})();

/* trees */
var foliageMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.9,flatShading:true});
var trunkMat=new T.MeshStandardMaterial({color:'#5a3b24',roughness:1,flatShading:true});
var foliageMeshes=[];
(function(){
  var trunkG=new T.CylinderGeometry(.3,.46,2.6,6),f1=new T.IcosahedronGeometry(2.1,0),f2=new T.IcosahedronGeometry(1.4,0);
  function addTree(x,z,sc){
    if(lakeMask(x,z)>.12)return;
    var y=hFn(x,z),g=new T.Group(),t=new T.Mesh(trunkG,trunkMat);
    t.scale.setScalar(sc);t.position.y=1.3*sc;g.add(t);
    var a=new T.Mesh(f1,foliageMat);a.position.y=3.7*sc;a.scale.set(sc,sc*1.15,sc);a.userData.base=sc;a.userData.by=3.7*sc;g.add(a);foliageMeshes.push(a);
    var b=new T.Mesh(f2,foliageMat);b.position.y=5.5*sc;b.scale.setScalar(sc);b.userData.base=sc;g.add(b);foliageMeshes.push(b);
    g.position.set(x,y,z);g.rotation.y=srnd()*TAU;nearBg.add(g);
  }
  var i,sx,x,z;
  for(i=0;i<26;i++){
    sx=i%2?1:-1;z=-4-srnd()*74;x=sx*(7.6+srnd()*26);
    if(z>-16&&Math.abs(x)<9)x=sx*(9+srnd()*3);
    addTree(x,z,.8+srnd()*.9);
  }
  for(i=0;i<7;i++)addTree((srnd()-.5)*20,-24-srnd()*44,1+srnd()*.8);
})();

/* mountains, clouds, sun */
var mountMat=new T.MeshStandardMaterial({color:'#9aa8d6',roughness:1,flatShading:true});
(function(){
  var i,g=new T.ConeGeometry(1,1,6);
  for(i=0;i<8;i++){
    var m=new T.Mesh(g,mountMat),r=26+srnd()*20,h=34+srnd()*34;
    m.scale.set(r,h,r);m.position.set(-170+i*48+srnd()*20,h*.5-4,-150-srnd()*30);m.rotation.y=srnd()*3;farBg.add(m);
  }
})();
var cloudMat=new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.9,fog:false});
var cloudShade=new T.MeshBasicMaterial({color:'#cfd8ea',transparent:true,opacity:.9,fog:false});
var clouds=[];
(function(){
  var i,j,sg=new T.SphereGeometry(1,10,8);
  /* three depth layers: far = big, slow and high; near = small, quick and low */
  var layers=[{n:6,z:[-210,-175],y:[70,105],s:[9,15],v:[.5,1],par:.02},{n:7,z:[-150,-110],y:[45,75],s:[6,10],v:[1.2,2.2],par:.06},{n:6,z:[-95,-65],y:[30,48],s:[4,7],v:[2.4,4],par:.14}];
  layers.forEach(function(L){
    for(i=0;i<L.n;i++){
      var g=new T.Group(),sz=L.s[0]+srnd()*(L.s[1]-L.s[0]);
      for(j=0;j<4;j++){
        var u=j-1.5,m=new T.Mesh(sg,cloudMat);m.scale.set(sz*(1-Math.abs(u)*.2),sz*.55*(1-Math.abs(u)*.1),sz*.6);m.position.set(u*sz*.75,Math.abs(u)<1?sz*.12:0,0);g.add(m);
      }
      var base=new T.Mesh(sg,cloudShade);base.scale.set(sz*2.1,sz*.22,sz*.55);base.position.y=-sz*.2;g.add(base);
      var bx=-170+srnd()*340;
      g.position.set(bx,L.y[0]+srnd()*(L.y[1]-L.y[0]),L.z[0]+srnd()*(L.z[1]-L.z[0]));
      g.userData={v:L.v[0]+srnd()*(L.v[1]-L.v[0]),bx:bx,par:L.par,wrap:200};
      farBg.add(g);clouds.push(g);
    }
  });
})();

/* lake / sea behind the arena */
var waterMat=new T.MeshStandardMaterial({color:'#2f7fc0',roughness:.18,metalness:.35,flatShading:true});
var wGeo=new T.PlaneGeometry(320,130,52,22);wGeo.rotateX(-Math.PI/2);
var water=new T.Mesh(wGeo,waterMat);water.position.set(0,-1.45,-108);farBg.add(water);
var wBaseX=null,wBaseZ=null;
(function(){
  var a=wGeo.attributes.position.array,n=wGeo.attributes.position.count||0,i;
  wBaseX=new Float32Array(n);wBaseZ=new Float32Array(n);
  for(i=0;i<n;i++){wBaseX[i]=a[i*3];wBaseZ[i]=a[i*3+2]}
})();
var waterTmp=new T.Color(),ICE=new T.Color('#d8eefc');
function waterStep(tt){
  var a=wGeo.attributes.position.array,n=wBaseX.length,amp=.28*(1-cur.cold),i;
  for(i=0;i<n;i++){var x=wBaseX[i],z=wBaseZ[i];a[i*3+1]=amp*(Math.sin(x*.09+tt*1.1)+Math.sin(z*.16-tt*.9)*.8+Math.sin((x+z)*.21+tt*1.7)*.4)}
  wGeo.attributes.position.needsUpdate=true;
  waterTmp.copy(cur.skyTop).lerp(cur.skyBot,.35).multiplyScalar(.9);
  waterMat.color.copy(waterTmp).lerp(ICE,cur.cold);
  waterMat.roughness=.18+.5*cur.cold;
}
/* sun glitter path on the water */
var glitterMat=new T.SpriteMaterial({map:GLOW,color:'#ffffff',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.3,fog:false});
var glitter=new T.Sprite(glitterMat);glitter.position.set(34,-.6,-146);glitter.scale.set(16,60,1);farBg.add(glitter);

/* night: moon, stars, fireflies */
var moonMat=new T.MeshBasicMaterial({color:'#eef3ff',transparent:true,opacity:0,fog:false});
var moon=new T.Mesh(new T.SphereGeometry(1,20,14),moonMat);moon.position.set(-46,64,-168);moon.scale.setScalar(7);moon.visible=false;farBg.add(moon);
var moonGlowMat=new T.SpriteMaterial({map:GLOW,color:'#a9c0ff',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:0,fog:false});
var moonGlow=new T.Sprite(moonGlowMat);moonGlow.position.set(-46,64,-170);moonGlow.scale.setScalar(60);moonGlow.visible=false;farBg.add(moonGlow);
var starsMat=new T.PointsMaterial({color:'#ffffff',size:3.4,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,fog:false});
var starsGeo=new T.BufferGeometry();
(function(){
  var n=420,pos=new Float32Array(n*3),i;
  for(i=0;i<n;i++){
    var a=rnd(0,TAU),e=Math.asin(rnd(.08,1)),r=380;
    pos[i*3]=Math.cos(a)*Math.cos(e)*r;pos[i*3+1]=Math.sin(e)*r;pos[i*3+2]=Math.sin(a)*Math.cos(e)*r;
  }
  starsGeo.setAttribute('position',new T.BufferAttribute(pos,3));
})();
var stars=new T.Points(starsGeo,starsMat);stars.frustumCulled=false;stars.visible=false;stars.renderOrder=-9;scene.add(stars);
var heroGlow=new T.PointLight(0xa8c4ff,0,30);scene.add(heroGlow);
var nightF=0,NT={top:new T.Color('#16217a'),bot:new T.Color('#5a6fe0'),fog:new T.Color('#3a4fb0'),hs:new T.Color('#b4c6ff'),hg:new T.Color('#4a58a8'),dir:new T.Color('#c8d8ff'),rim:new T.Color('#9ab4ff')};
function nightTarget(){
  if(evOn||seasonIdx>=4)return 0;
  var h=new Date().getHours();
  if(h>=21||h<5)return 1;
  if(mode==='play'&&run){var c=run.time%90;if(c>=60&&c<78)return 1}
  return 0;
}
var sunMat=new T.MeshBasicMaterial({color:'#ffffff',fog:false});
var sunMesh=new T.Mesh(new T.SphereGeometry(1,20,14),sunMat);farBg.add(sunMesh);
var sunGlowMat=new T.SpriteMaterial({map:GLOW,color:'#ffffff',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.75,fog:false});
var sunGlow=new T.Sprite(sunGlowMat);farBg.add(sunGlow);

/* particles (shared point shader) */
var ptScale={value:600};
function makePoints(n){
  var geo=new T.BufferGeometry();
  var pos=new Float32Array(n*3),col=new Float32Array(n*3),size=new Float32Array(n),alpha=new Float32Array(n),i;
  for(i=0;i<n*3;i++)col[i]=1;
  geo.setAttribute('position',new T.BufferAttribute(pos,3));
  geo.setAttribute('aCol',new T.BufferAttribute(col,3));
  geo.setAttribute('aSize',new T.BufferAttribute(size,1));
  geo.setAttribute('aAlpha',new T.BufferAttribute(alpha,1));
  var mat=new T.ShaderMaterial({
    uniforms:{uScale:ptScale,uTint:{value:new T.Color(1,1,1)}},
    vertexShader:'attribute vec3 aCol;attribute float aSize;attribute float aAlpha;uniform float uScale;uniform vec3 uTint;varying vec3 vC;varying float vA;'+
      'void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=min(90.0,aSize*uScale/max(0.1,-mv.z));vC=aCol*uTint;vA=aAlpha;}',
    fragmentShader:'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-vec2(0.5));float a=smoothstep(0.5,0.25,d)*vA;if(a<0.01)discard;gl_FragColor=vec4(vC,a);}',
    transparent:true,depthWrite:false
  });
  var pts=new T.Points(geo,mat);pts.frustumCulled=false;
  return {pts:pts,geo:geo,pos:pos,col:col,size:size,alpha:alpha,mat:mat,n:n};
}
/* weather */
var WN=380,wx=makePoints(WN),wspd=[],wph=[],wsz=[];
(function(){
  for(var i=0;i<WN;i++){
    wx.pos[i*3]=rnd(-20,20);wx.pos[i*3+1]=rnd(0,28);wx.pos[i*3+2]=rnd(-30,12);
    wspd.push(rnd(.7,1.3));wph.push(rnd(0,TAU));wsz.push(rnd(.6,1.3));
  }
  scene.add(wx.pts);
})();
/* fireflies (night only) */
var FFN=44,ff=makePoints(FFN),ffd=[];
(function(){
  ff.mat.blending=T.AdditiveBlending;
  for(var i=0;i<FFN;i++){
    ff.pos[i*3]=rnd(-17,17);ff.pos[i*3+1]=rnd(.5,6);ff.pos[i*3+2]=rnd(-22,3);
    ff.col[i*3]=.85;ff.col[i*3+1]=1;ff.col[i*3+2]=.4;ff.size[i]=rnd(1,1.7);
    ffd.push({ph:rnd(0,TAU),sp:rnd(.4,1),cx:ff.pos[i*3],cy:ff.pos[i*3+1],cz:ff.pos[i*3+2]});
  }
  ff.pts.visible=false;scene.add(ff.pts);
})();
function fireflyStep(tt){
  var vis=nightF>.03;ff.pts.visible=vis;if(!vis)return;
  for(var i=0;i<FFN;i++){
    var d=ffd[i];
    ff.pos[i*3]=d.cx+Math.sin(tt*d.sp+d.ph)*1.6;ff.pos[i*3+1]=d.cy+Math.sin(tt*d.sp*1.3+d.ph*2)*.7;ff.pos[i*3+2]=d.cz+Math.cos(tt*d.sp*.8+d.ph)*1.4;
    ff.alpha[i]=nightF*(.35+.65*Math.max(0,Math.sin(tt*2.2*d.sp+d.ph*3)));
  }
  ff.geo.attributes.position.needsUpdate=true;ff.geo.attributes.aAlpha.needsUpdate=true;
}
/* effects pool */
var FN=520,fx=makePoints(FN),fxi=0,fxv=[],fxc=new T.Color();
(function(){
  for(var i=0;i<FN;i++)fxv.push({vx:0,vy:0,vz:0,life:0,max:0,g:0,grow:0,s0:0,a0:0,drag:0});
  scene.add(fx.pts);
})();
function fxSpawn(x,y,z,vx,vy,vz,life,size,grow,hex,alpha,g,drag){
  var i=fxi;fxi=(fxi+1)%FN;var p=fxv[i];
  fx.pos[i*3]=x;fx.pos[i*3+1]=y;fx.pos[i*3+2]=z;
  p.vx=vx;p.vy=vy;p.vz=vz;p.life=0;p.max=life;p.g=g||0;p.grow=grow||0;p.s0=size;p.a0=alpha;p.drag=drag||0;
  fxc.set(hex);fx.col[i*3]=fxc.r;fx.col[i*3+1]=fxc.g;fx.col[i*3+2]=fxc.b;
  fx.size[i]=size;fx.alpha[i]=alpha;
}
function fxStep(dt){
  var i,p,k;
  for(i=0;i<FN;i++){
    p=fxv[i];if(p.max<=0)continue;
    p.life+=dt;
    if(p.life>=p.max){p.max=0;fx.alpha[i]=0;fx.size[i]=0;continue}
    k=p.life/p.max;
    p.vy-=p.g*dt;if(p.drag){var d=Math.max(0,1-p.drag*dt);p.vx*=d;p.vy*=d;p.vz*=d}
    fx.pos[i*3]+=p.vx*dt;fx.pos[i*3+1]+=p.vy*dt;fx.pos[i*3+2]+=p.vz*dt;
    fx.alpha[i]=p.a0*(1-k);fx.size[i]=p.s0*(1+p.grow*k);
  }
  fx.geo.attributes.position.needsUpdate=true;fx.geo.attributes.aSize.needsUpdate=true;
  fx.geo.attributes.aAlpha.needsUpdate=true;fx.geo.attributes.aCol.needsUpdate=true;
}
function burst(x,y,n,cols){
  for(var i=0;i<n;i++){
    var a=rnd(0,TAU),sp=rnd(2,6.5);
    fxSpawn(x,y,rnd(-.3,.8),Math.cos(a)*sp,Math.abs(Math.sin(a))*sp+rnd(1,4),rnd(-1,2),rnd(.45,.85),rnd(.16,.3),-.4,cols[i%cols.length],1,14,0);
  }
}
function smoke(x,y){
  for(var i=0;i<7;i++)fxSpawn(x+rnd(-.4,.4),y+rnd(-.2,.3),rnd(0,.6),rnd(-1,1),rnd(1,2.6),0,rnd(.6,1),rnd(.35,.6),1.2,'#4a3f55',.65,0,0);
}

/* shadows */
var shMat=new T.MeshBasicMaterial({color:'#080218',transparent:true,opacity:.34,depthWrite:false});
var shGeo=new T.CircleGeometry(.5,20);
function makeShadow(){var m=new T.Mesh(shGeo,shMat);m.rotation.x=-Math.PI/2;m.position.y=.04;return m}

