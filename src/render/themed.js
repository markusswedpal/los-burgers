/* ---------- themed falling items ----------
   During an event the burgers can turn into something else (a strawberry, a treasure chest, a football).
   Same game rules: only the model and colours change. Chosen by the event look's "burgers" setting. */
var TH_MATS={},TH_GEO={};
function thMat(key,color,rough,metal,glow){
  if(!TH_MATS[key]){
    var ex=glow?{emissive:color,emissiveIntensity:glow}:null;
    TH_MATS[key]=std(color,rough,metal||0,ex);
  }
  return TH_MATS[key];
}
function thGlow(color,op){
  var k='glow'+color;
  if(!TH_MATS[k])TH_MATS[k]=new T.SpriteMaterial({map:GLOW,color:color,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:op,fog:false});
  return TH_MATS[k];
}
function thGeo(){
  if(TH_GEO.ready)return TH_GEO;
  var i;
  /* strawberry: a sphere that narrows towards the bottom */
  var b=new T.SphereGeometry(.46,22,16),p=b.attributes.position;
  for(i=0;i<p.count;i++){
    var x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=y<0?1+y*1.05:1;
    p.setXYZ(i,x*k,y*1.08,z*k);
  }
  b.computeVertexNormals();TH_GEO.berry=b;
  TH_GEO.seed=new T.SphereGeometry(.03,6,5);
  TH_GEO.leaf=new T.ConeGeometry(.075,.3,4);TH_GEO.leaf.translate(0,.15,0);
  TH_GEO.stem=new T.CylinderGeometry(.028,.028,.16,6);
  TH_GEO.seeds=[];
  for(i=0;i<22;i++){
    var yy=1-(i+.5)/22*1.75,r=Math.sqrt(Math.max(0,1-yy*yy)),a=i*2.39996;
    var dx=Math.cos(a)*r,dz=Math.sin(a)*r,kk=yy<0?1+yy*.46*1.05:1;
    TH_GEO.seeds.push([dx*.46*kk*1.02,yy*.46*1.08,dz*.46*kk*1.02]);
  }
  /* football */
  TH_GEO.ball=new T.SphereGeometry(.47,24,18);
  TH_GEO.patch=new T.CylinderGeometry(.15,.15,.04,5);
  var f=(1+Math.sqrt(5))/2,v=[[0,1,f],[0,1,-f],[0,-1,f],[0,-1,-f],[1,f,0],[1,-f,0],[-1,f,0],[-1,-f,0],[f,0,1],[f,0,-1],[-f,0,1],[-f,0,-1]];
  TH_GEO.patches=v.map(function(q){var l=Math.sqrt(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]);return [q[0]/l,q[1]/l,q[2]/l]});
  /* treasure chest */
  TH_GEO.chest=new T.BoxGeometry(.88,.42,.72);
  TH_GEO.lid=new T.CylinderGeometry(.36,.36,.88,14,1,false,0,Math.PI);
  TH_GEO.band=new T.BoxGeometry(.09,.43,.74);
  TH_GEO.lidBand=new T.CylinderGeometry(.37,.37,.09,14,1,false,0,Math.PI);
  TH_GEO.lock=new T.BoxGeometry(.15,.17,.06);
  TH_GEO.cannon=new T.SphereGeometry(.44,20,14);
  TH_GEO.fuse=new T.CylinderGeometry(.025,.025,.2,6);
  TH_GEO.ready=true;return TH_GEO;
}
var TH_LOOK={
  strawberry:{norm:'#e8203c',gold:'#ffcf3a',blue:'#ffa8c8',pink:'#9a1446',burnt:'#3a2219',glow:'#ff3b5c'},
  football:{norm:'#ffffff',gold:'#ffd54a',blue:'#59b8ff',pink:'#ff7ac8',burnt:'#3b3b40',glow:'#7dff9a'},
  pirate:{norm:'#8a5224',gold:'#e8b020',blue:'#2a6fb0',pink:'#c2307a',burnt:'#26262c',glow:'#ffd23f'}
};
function makeThemedBurger(style,kind,frost,shiny){
  var G=thGeo(),L=TH_LOOK[style],col=L[kind]||L.norm,g=new T.Group(),a,i,key=style+kind;
  if(style==='strawberry'){
    a=new T.Mesh(G.berry,thMat(key,col,.3,.05,.2));g.add(a);
    if(kind!=='burnt'){
      var sd=thMat('sd'+style+kind,kind==='gold'?'#fff6c0':kind==='pink'?'#ffb0c8':'#ffe27a',.5,0);
      for(i=0;i<G.seeds.length;i++){var s=new T.Mesh(G.seed,sd);s.position.set(G.seeds[i][0],G.seeds[i][1],G.seeds[i][2]);s.scale.set(1,1.5,1);g.add(s)}
    }
    var lm=thMat('leaf'+kind,kind==='burnt'?'#4a3a22':'#2fa34a',.6,0);
    for(i=0;i<6;i++){
      var w=new T.Group();w.rotation.y=i/6*TAU;w.position.y=.47;
      var lf=new T.Mesh(G.leaf,lm);lf.rotation.z=-1.15;lf.scale.set(1,.9,.5);w.add(lf);g.add(w);
    }
    a=new T.Mesh(G.stem,thMat('stemg','#3d7a2a',.6,0));a.position.y=.56;a.rotation.z=.2;g.add(a);
  }else if(style==='football'){
    a=new T.Mesh(G.ball,thMat(key,col,.35,.02,.12));g.add(a);
    var pc=kind==='gold'?'#8a5a00':kind==='blue'||kind==='pink'?'#ffffff':'#1b1b1f',pm=thMat('pt'+kind,pc,.5,0);
    var up=new T.Vector3(0,1,0);
    for(i=0;i<G.patches.length;i++){
      var n=G.patches[i],nv=new T.Vector3(n[0],n[1],n[2]),m=new T.Mesh(G.patch,pm);
      m.position.set(n[0]*.465,n[1]*.465,n[2]*.465);m.quaternion.setFromUnitVectors(up,nv);g.add(m);
    }
  }else{ /* pirate */
    if(kind==='burnt'){
      a=new T.Mesh(G.cannon,thMat(key,col,.35,.7));g.add(a);
      a=new T.Mesh(G.fuse,thMat('fuse','#c9a25a',.8,0));a.position.set(0,.5,0);a.rotation.z=.35;g.add(a);
    }else{
      var band=thMat('band'+kind,kind==='gold'?'#fff2a8':kind==='blue'?'#dfe8ff':'#ffd23f',.3,.8);
      a=new T.Mesh(G.chest,thMat(key,col,.7,0,kind==='gold'?.25:0));a.position.y=-.1;g.add(a);
      a=new T.Mesh(G.lid,thMat(key,col,.7,0,kind==='gold'?.25:0));a.rotation.z=Math.PI/2;a.position.y=.11;g.add(a);
      for(i=-1;i<=1;i+=2){
        a=new T.Mesh(G.band,band);a.position.set(i*.27,-.1,0);g.add(a);
        a=new T.Mesh(G.lidBand,band);a.rotation.z=Math.PI/2;a.position.set(i*.27,.11,0);g.add(a);
      }
      a=new T.Mesh(G.lock,band);a.position.set(0,.08,.37);g.add(a);
    }
  }
  if(kind==='burnt'){
    var fz=style==='pirate'?.43:style==='football'?.44:.4;
    for(i=-1;i<=1;i+=2){
      var e=new T.Mesh(BG.eye,BM.white);e.position.set(i*.15,.12,fz);g.add(e);
      var p=new T.Mesh(BG.pupil,BM.black);p.position.set(i*.15,.12,fz+.06);g.add(p);
      var b=new T.Mesh(BG.brow,BM.black);b.position.set(i*.15,.22,fz-.02);b.rotation.z=-i*.45;g.add(b);
    }
  }
  if(kind==='gold'||kind==='burnt'||kind==='blue'||kind==='pink'||shiny){
    var gc=kind==='burnt'?'#ff3030':kind==='gold'?'#ffd23f':kind==='blue'?L.blue:kind==='pink'?L.pink:L.glow;
    var big=shiny&&kind==='norm',sp=new T.Sprite(thGlow(gc,kind==='burnt'?.55:.5));
    sp.scale.set(big?1.9:2.3,big?1.9:2.3,1);sp.position.y=.1;g.add(sp);
  }
  return g;
}
