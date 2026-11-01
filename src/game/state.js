/* ---------- state ---------- */
var mode='menu',t=0,items=[],shake=0,flash=0,spawnT=.5,menuSeasonT=8;
var hero={x:0,tx:0,v:0,lean:0,walk:0,mouth:0,punch:0,pside:1};
var baby={on:false,s:0,x:0,side:-1,timer:5};
var run=null,keys={},paused=false;
var MAXL=3;
var heroObj=null,heroSkinId='',heroShadow=makeShadow(),babyObj=null,babySkinId=null;
heroShadow.scale.set(HR*2.6,HR*2.6,1);scene.add(heroShadow);
var shieldMesh=new T.Mesh(new T.SphereGeometry(1,24,16),new T.MeshBasicMaterial({color:'#35e0ff',transparent:true,opacity:.2,depthWrite:false,blending:T.AdditiveBlending}));shieldMesh.visible=false;scene.add(shieldMesh);
var magnetRing=new T.Mesh(new T.TorusGeometry(1,.05,8,40),new T.MeshBasicMaterial({color:'#ff4f6b',transparent:true,opacity:.7}));magnetRing.rotation.x=Math.PI/2;magnetRing.visible=false;scene.add(magnetRing);
var slowEl=$('#slowfx'),lastSlow=-1;
function rebuildBaby(){
  if(babyObj){scene.remove(babyObj.group);scene.remove(babyObj.shadow);disposeObj(babyObj.group)}
  babyObj=buildBaby(save.babySkin);babySkinId=save.babySkin;
  babyObj.group.visible=false;scene.add(babyObj.group);scene.add(babyObj.shadow);
}
rebuildBaby();

function rebuildHero(){
  if(heroObj){scene.remove(heroObj.group);disposeObj(heroObj.group)}
  heroObj=buildHero(byId(save.equipped));heroSkinId=save.equipped;
  heroObj.group.scale.setScalar(HR);scene.add(heroObj.group);
}
rebuildHero();

var v1=new T.Vector3();
function toScreen(x,y,z){v1.set(x,y,z).project(camera);return {x:(v1.x*.5+.5)*W,y:(-v1.y*.5+.5)*H}}

function fitCamera(){
  var aspect=W/H;
  camera.aspect=aspect;
  camDist=Math.max(24,(7.1)/(Math.tan(FOV*Math.PI/360)*aspect));
  var camH=11,lo=-10,hi=60,mid,i;
  camera.position.set(0,camH,camDist);
  for(i=0;i<24;i++){
    mid=(lo+hi)/2;camera.lookAt(0,mid,0);camera.updateMatrixWorld(true);
    v1.set(0,0,0).project(camera);
    if(v1.y>-.74)lo=mid;else hi=mid;
  }
  camera.lookAt(0,(lo+hi)/2,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  v1.set(0,1.12,.5).unproject(camera);
  var dz=v1.z-camera.position.z,tt=-camera.position.z/dz;
  spawnY=camera.position.y+(v1.y-camera.position.y)*tt+.8;
  fallScale=clamp(spawnY/24,.8,1.35);
}
function resize(){
  var app=$('#app');
  W=Math.max(200,app.clientWidth);H=Math.max(300,app.clientHeight);
  renderer.setSize(W,H,false);
  fitCamera();
  ptScale.value=H*renderer.getPixelRatio()/(2*Math.tan(FOV*Math.PI/360));
}

