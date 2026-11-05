/* ---------- models ---------- */
function disposeObj(o){
  o.traverse(function(n){
    if(n.geometry)n.geometry.dispose();
    if(n.material){
      if(Array.isArray(n.material))n.material.forEach(function(m){m.dispose()});else n.material.dispose();
    }
  });
}
function place(m,x,y,rad){
  var z=Math.sqrt(Math.max(.01,rad*rad-x*x-y*y));
  m.position.set(x,y,z);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(x,y,z).normalize());
}
function std(color,rough,metal,extra){
  var o={color:color,roughness:rough,metalness:metal||0};
  if(extra)for(var k in extra)o[k]=extra[k];
  return new T.MeshStandardMaterial(o);
}

/* the fighter: a glossy ball with a visor, brows, fists and boots */
function buildHero(sk){
  var g=new T.Group(),rig=new T.Group(),head=new T.Group(),i,sx;
  g.add(rig);head.position.y=1.05;rig.add(head);
  var bodyMat=new T.MeshPhysicalMaterial(sk.gem?{color:sk.body,roughness:.06,metalness:sk.metal,clearcoat:1,clearcoatRoughness:.02,emissive:'#1b7a9a',emissiveIntensity:.4}:sk.gild?{color:sk.body,roughness:.14,metalness:sk.metal,clearcoat:1,clearcoatRoughness:.03,emissive:'#7a4a00',emissiveIntensity:.35}:{color:sk.body,roughness:.3,metalness:sk.metal||.1,clearcoat:1,clearcoatRoughness:.06});
  head.add(new T.Mesh(new T.SphereGeometry(1,40,28),bodyMat));
  var gear=sk.gem?std('#c9f4ff',.1,.9,{emissive:'#2a9fd0',emissiveIntensity:.45}):sk.gild?std('#ffcf33',.2,.85,{emissive:'#6b4300',emissiveIntensity:.4}):std(sk.accent,.38,.25),dark=std('#140a24',.3,.4),trim=std(sk.c2,.3,.5);
  var shades=sk.acc.indexOf('shades')>=0;
  var visMat=shades?std(sk.c2,.1,.5,{emissive:sk.c2,emissiveIntensity:.55}):new T.MeshPhysicalMaterial({color:'#0e0820',roughness:.12,metalness:.5,clearcoat:1});
  head.add(new T.Mesh(new T.SphereGeometry(1.03,36,10,Math.PI/2-1,2,Math.PI*.375,Math.PI*.2),visMat));
  var eyeMat=new T.MeshBasicMaterial({color:sk.eye}),eyes=[];
  for(sx=-1;sx<=1;sx+=2){
    var e=new T.Mesh(new T.BoxGeometry(.4,.1,.06),eyeMat);place(e,sx*.36,.1,1.055);e.rotateZ(sx*.3);head.add(e);eyes.push(e);
    var br=new T.Mesh(new T.BoxGeometry(.52,.1,.1),sk.gild||sk.gem?dark:gear);place(br,sx*.4,.5,1.04);br.rotateZ(sx*.42);head.add(br);
  }
  var scar=new T.Mesh(new T.BoxGeometry(.04,.4,.03),std('#ffb0b0',.5,0));place(scar,.62,-.1,1.05);scar.rotateZ(.5);head.add(scar);
  var mouth=new T.Mesh(new T.BoxGeometry(.46,.07,.06),dark);place(mouth,0,-.5,1.02);head.add(mouth);
  var fangMat=std('#ffffff',.4,0);
  for(sx=-1;sx<=1;sx+=2){var f=new T.Mesh(new T.ConeGeometry(.045,.14,6),fangMat);f.position.set(sx*.15,-.07,.02);f.rotation.z=Math.PI;mouth.add(f)}
  var belt=new T.Mesh(new T.TorusGeometry(.8,.075,10,40),trim);belt.rotation.x=Math.PI/2+.05;belt.position.y=-.62;head.add(belt);

  function fistMk(){
    var f=new T.Group();f.add(new T.Mesh(new T.SphereGeometry(.38,20,14),gear));
    for(var k=-1;k<=1;k++){var c=new T.Mesh(new T.ConeGeometry(.07,.2,6),trim);c.rotation.x=Math.PI/2;c.position.set(k*.15,.1,.36);f.add(c)}
    rig.add(f);return f;
  }
  var fistL=fistMk(),fistR=fistMk();
  var bootGeo=new T.SphereGeometry(.4,16,12);
  var bootL=new T.Mesh(bootGeo,gear),bootR=new T.Mesh(bootGeo,gear);
  bootL.scale.set(.95,.55,1.25);bootR.scale.copy(bootL.scale);rig.add(bootL);rig.add(bootR);

  var cape=null;
  if(sk.cape){
    cape=new T.Group();cape.position.set(0,1.95,-.92);
    var cm=new T.Mesh(new T.PlaneGeometry(1.9,1.95,1,1),new T.MeshStandardMaterial({color:sk.cape,roughness:.6,side:T.DoubleSide}));
    cm.position.y=-.97;cape.add(cm);rig.add(cape);
  }
  var tails=[],spin=[],floaters=[],wingsG=[],swing=[],accs=sk.acc.split('+');
  function sx0(){return sk.id==='lise'?.45:.4}
  function has(x){return accs.indexOf(x)>=0}
  function bandTails(){
    var tg=new T.Group();tg.position.set(0,.55,-.84);head.add(tg);
    for(var k=-1;k<=1;k+=2){
      var pv=new T.Group();pv.rotation.y=k*.28;tg.add(pv);
      var m=new T.Mesh(new T.BoxGeometry(.16,.07,.8),trim);m.position.z=-.4;pv.add(m);tails.push(pv);
    }
  }
  function band(){
    var b=new T.Mesh(new T.TorusGeometry(.84,.09,10,36),trim);b.rotation.x=Math.PI/2+.1;b.position.y=.55;head.add(b);
  }
  if(has('headband')){band();bandTails()}
  
  if(has('ninja')){
    band();bandTails();
    head.add(new T.Mesh(new T.SphereGeometry(1.03,32,8,Math.PI/2-1.25,2.5,Math.PI*.6,Math.PI*.2),gear));
    mouth.visible=false;
  }
  if(has('mohawk')){
    for(i=0;i<5;i++){
      var zz=.6-i*.3,yy=Math.sqrt(1-zz*zz),ang=Math.atan2(zz,yy),hh=.5+(2-Math.abs(i-2))*.14;
      var c=new T.Mesh(new T.ConeGeometry(.15,hh,6),trim);
      c.position.set(0,Math.cos(ang)*(1+hh*.4-.05),Math.sin(ang)*(1+hh*.4-.05));
      c.rotation.x=ang;head.add(c);
    }
  }
  if(has('helmet')){
    head.add(new T.Mesh(new T.SphereGeometry(1.07,32,14,0,TAU,0,Math.PI*.32),std('#e4ebf7',.3,.5)));
    var pl=new T.Mesh(new T.BoxGeometry(.14,.6,1.2),trim);pl.position.set(0,1.18,-.08);pl.rotation.x=-.25;head.add(pl);
  }
  if(has('horns')){
    var hm=std(sk.c2,.4,.1);
    for(sx=-1;sx<=1;sx+=2){
      var hn=new T.Mesh(new T.ConeGeometry(.2,.95,10),hm);hn.position.set(sx*.8,.85,0);hn.rotation.z=-sx*.8;head.add(hn);
      var tip=new T.Mesh(new T.ConeGeometry(.12,.55,8),hm);tip.position.set(sx*1.32,1.4,0);tip.rotation.z=-sx*.3;head.add(tip);
    }
  }
  if(has('orbit')){
    var og=new T.Group();og.rotation.z=.35;head.add(og);
    var ring=new T.Mesh(new T.TorusGeometry(1.6,.03,8,56),new T.MeshBasicMaterial({color:sk.c2}));ring.rotation.x=Math.PI/2;og.add(ring);
    var spn=new T.Group();og.add(spn);
    for(i=0;i<3;i++){
      var st=new T.Mesh(new T.OctahedronGeometry(.16),new T.MeshBasicMaterial({color:i===1?'#ff4f8b':sk.c2}));
      st.position.set(Math.cos(i*TAU/3)*1.6,0,Math.sin(i*TAU/3)*1.6);spn.add(st);
    }
    spin.push(spn);
  }
  if(has('crown')){
    var cg=new T.Group();cg.position.y=.95;head.add(cg);
    var gold=std('#ffd23f',.25,.7,{emissive:'#7a5200',emissiveIntensity:.5});
    cg.add(new T.Mesh(new T.CylinderGeometry(.52,.58,.24,16,1,true),gold));
    for(i=0;i<5;i++){
      var ca=i*TAU/5,cc=new T.Mesh(new T.ConeGeometry(.13,.36,6),gold);cc.position.set(Math.cos(ca)*.54,.28,Math.sin(ca)*.54);cg.add(cc);
      var gm=new T.Mesh(new T.SphereGeometry(.06,8,6),new T.MeshBasicMaterial({color:i%2?'#35e0ff':sk.c2}));gm.position.set(Math.cos(ca)*.54,.5,Math.sin(ca)*.54);cg.add(gm);
    }
  }
  if(has('halo')){
    var hl=new T.Mesh(new T.TorusGeometry(.62,.07,10,36),new T.MeshBasicMaterial({color:sk.c2}));hl.rotation.x=Math.PI/2;hl.position.y=1.5;head.add(hl);floaters.push(hl);
  }
  if(has('wings')){
    var wmat=new T.MeshStandardMaterial({color:sk.c2,emissive:sk.c2,emissiveIntensity:.45,roughness:.4,metalness:.2,side:T.DoubleSide});
    for(sx=-1;sx<=1;sx+=2){
      var wg=new T.Group();wg.position.set(sx*.7,.1,-.9);wg.rotation.y=sx*.6;head.add(wg);
      for(i=0;i<4;i++){
        var an=.35+i*.33,ln=1.7-i*.22,fe=new T.Mesh(new T.ConeGeometry(.19,ln,5),wmat);
        fe.position.set(sx*Math.sin(an)*ln/2,Math.cos(an)*ln/2,0);fe.rotation.z=-sx*an;wg.add(fe);
      }
      wingsG.push({g:wg,sx:sx});
    }
  }
  if(has('hair')){
    head.add(new T.Mesh(new T.SphereGeometry(1.05,32,14,0,TAU,0,Math.PI*.3),gear));
  }
  if(has('quiff')){var qf=new T.Mesh(new T.SphereGeometry(.5,14,10),gear);qf.scale.set(1.15,.6,.9);qf.position.set(.12,.98,.32);qf.rotation.z=-.3;head.add(qf)}
  if(has('spikes')){
    var spk2=[[0,.05],[.5,.3],[-.5,.3],[.9,.1],[-.9,.1],[.35,-.45],[-.35,-.45],[0,-.65]];
    for(i=0;i<spk2.length;i++){
      var sxp=spk2[i][0],szp=spk2[i][1],syp=Math.sqrt(Math.max(.05,1-sxp*sxp-szp*szp)),sc2=new T.Mesh(new T.ConeGeometry(.17,.55,6),gear);
      sc2.position.set(sxp*1.08,syp*1.08,szp*1.08);sc2.lookAt(sxp*3,syp*3,szp*3);sc2.rotateX(Math.PI/2);head.add(sc2);
    }
  }
  if(has('cap')){
    head.add(new T.Mesh(new T.SphereGeometry(1.07,32,14,0,TAU,0,Math.PI*.36),trim));
    var brm=new T.Mesh(new T.CylinderGeometry(.85,.85,.06,20,1,false,Math.PI/2,Math.PI),trim);brm.position.set(0,.78,-.3);brm.rotation.x=-.2;head.add(brm);
    var cbtn=new T.Mesh(new T.SphereGeometry(.08,10,8),gear);cbtn.position.y=1.07;head.add(cbtn);
  }
  if(has('headphones')){
    var hp=new T.Mesh(new T.TorusGeometry(1.1,.06,8,30,Math.PI),dark);hp.rotation.y=0;head.add(hp);
    for(sx=-1;sx<=1;sx+=2){var cup=new T.Mesh(new T.CylinderGeometry(.3,.3,.22,16),gear);cup.rotation.z=Math.PI/2;cup.position.set(sx*1.1,0,0);head.add(cup)}
  }
  if(has('ponytail')){
    var pg=new T.Group();pg.position.set(0,.8,-.85);head.add(pg);
    var tie=new T.Mesh(new T.SphereGeometry(.14,10,8),trim);pg.add(tie);
    var hr=new T.Mesh(new T.CylinderGeometry(.2,.05,1.0,10),gear);hr.position.y=-.5;pg.add(hr);swing.push({g:pg,k:0});
  }
  if(has('pigtails')){
    for(sx=-1;sx<=1;sx+=2){
      var pg2=new T.Group();pg2.position.set(sx*.9,.45,-.25);head.add(pg2);
      var tie2=new T.Mesh(new T.SphereGeometry(.13,10,8),trim);pg2.add(tie2);
      var hr2=new T.Mesh(new T.CylinderGeometry(.17,.04,.85,10),gear);hr2.position.y=-.43;pg2.add(hr2);swing.push({g:pg2,k:sx});
    }
  }
  if(has('bow')){
    var bwg=new T.Group();bwg.position.set(sx0(),.92,.2);bwg.rotation.x=-.45;head.add(bwg);
    for(sx=-1;sx<=1;sx+=2){var wing=new T.Mesh(new T.ConeGeometry(.2,.4,8),trim);wing.rotation.z=-sx*Math.PI/2;wing.position.x=sx*.2;bwg.add(wing)}
    bwg.add(new T.Mesh(new T.SphereGeometry(.1,10,8),trim));
  }
  if(has('diamonds')){
    var dmat=std('#e6fbff',.04,.6,{emissive:'#6fd8ff',emissiveIntensity:.7}),dg=new T.Group();dg.rotation.z=.3;head.add(dg);
    var dspin=new T.Group();dg.add(dspin);
    for(i=0;i<7;i++){
      var da=i*TAU/7,dm=new T.Mesh(new T.OctahedronGeometry(.24),dmat);dm.scale.set(.75,1.25,.75);
      dm.position.set(Math.cos(da)*1.7,Math.sin(i*2.1)*.15,Math.sin(da)*1.7);dspin.add(dm);
    }
    spin.push(dspin);
    var fg=new T.Mesh(new T.OctahedronGeometry(.2),dmat);fg.scale.set(.8,1.3,.8);fg.position.set(0,.8,.72);fg.rotation.x=-.8;head.add(fg);
  }
  if(has('coins')){
    var cng=new T.Group();cng.rotation.z=-.25;head.add(cng);
    var cmat=std('#ffd23f',.2,.9,{emissive:'#8a5a00',emissiveIntensity:.5}),cspin=new T.Group();cng.add(cspin);
    for(i=0;i<6;i++){
      var ca2=i*TAU/6,pvt=new T.Group();pvt.position.set(Math.cos(ca2)*1.65,Math.sin(i*1.7)*.12,Math.sin(ca2)*1.65);pvt.rotation.y=Math.PI/2-ca2;cspin.add(pvt);
      var cn=new T.Mesh(new T.CylinderGeometry(.24,.24,.06,20),cmat);cn.rotation.x=Math.PI/2;pvt.add(cn);
    }
    spin.push(cspin);
  }
  if(sk.gild){
    var lc=document.createElement('canvas');lc.width=lc.height=128;
    var lx=lc.getContext('2d');
    if(lx){
      lx.fillStyle='#ffd23f';lx.beginPath();lx.arc(64,64,62,0,TAU);lx.fill();
      lx.strokeStyle='#8a5a00';lx.lineWidth=8;lx.beginPath();lx.arc(64,64,54,0,TAU);lx.stroke();
      lx.fillStyle='#5a3a00';lx.font='italic 900 56px Arial Black,Impact,sans-serif';lx.textAlign='center';lx.textBaseline='middle';lx.fillText('LO',64,68);
    }
    var med=new T.Mesh(new T.CircleGeometry(.22,28),new T.MeshBasicMaterial({map:new T.CanvasTexture(lc)}));
    med.position.set(0,.76,.7);med.rotation.x=-.83;head.add(med);
  }
  if(sk.sparkle){
    var spg=new T.Group();head.add(spg);
    for(i=0;i<3;i++){
      var sm=new T.Mesh(new T.OctahedronGeometry(.14),new T.MeshBasicMaterial({color:'#fff6c2'}));
      sm.position.set(Math.cos(i*TAU/3)*1.5,(i-1)*.45,Math.sin(i*TAU/3)*1.5);spg.add(sm);
    }
    spin.push(spg);
  }

  var lastSad=false,sadNow=false;
  function pose(tt,o){
    rig.rotation.z=-o.lean*.3;head.rotation.y=o.lean*.35;
    var sw=Math.sin(tt*11)*o.walk;
    rig.position.y=Math.abs(Math.sin(tt*11))*.17*o.walk+Math.sin(tt*3)*.025;
    mouth.scale.y=1+o.mouth*6;
    var pl=o.pside<0?o.punch:0,pr=o.pside>0?o.punch:0;
    fistL.position.set(-1.38,.98+Math.sin(tt*3+1)*.04+sw*.15,.55+pl*1.1);
    fistR.position.set(1.38,.98+Math.sin(tt*3)*.04-sw*.15,.55+pr*1.1);
    fistL.rotation.x=-pl*.5;fistR.rotation.x=-pr*.5;
    bootL.position.set(-.5,.22,.18+sw*.3);bootR.position.set(.5,.22,.18-sw*.3);
    if(cape)cape.rotation.x=.1+o.walk*.5+Math.sin(tt*5)*.05;
    for(var k=0;k<tails.length;k++){tails[k].rotation.x=Math.sin(tt*9+k)*.18+o.walk*.3;tails[k].rotation.y=(k?1:-1)*(.28+Math.sin(tt*7+k)*.12)}
    for(k=0;k<spin.length;k++)spin[k].rotation.y=tt*(1.4+k*.6);
    for(k=0;k<floaters.length;k++)floaters[k].position.y=1.5+Math.sin(tt*3)*.07;
    for(k=0;k<swing.length;k++){var swg=swing[k];swg.g.rotation.x=.35+o.walk*.3+Math.sin(tt*6+k)*.1;swg.g.rotation.z=swg.k*(.3+Math.sin(tt*5+k)*.08)}
    for(k=0;k<wingsG.length;k++)wingsG[k].g.rotation.z=wingsG[k].sx*Math.sin(tt*4+k)*.1;
    if(sk.gild||sk.gem)bodyMat.emissiveIntensity=.35+.2*Math.sin(tt*3);
    sadNow=!!o.sad;
    if(sadNow!==lastSad){lastSad=sadNow;eyeMat.color.set(sadNow?'#555566':sk.eye)}
  }
  return {group:g,pose:pose,skin:sk};
}

function buildBaby(style){
  var g=new T.Group(),rig=new T.Group();g.add(rig);
  var skin=new T.MeshPhysicalMaterial({color:'#ffd2b0',roughness:.35,metalness:.02,clearcoat:1,clearcoatRoughness:.1});
  var body=new T.Mesh(new T.SphereGeometry(.6,28,20),skin);body.position.y=.64;rig.add(body);
  var dia=new T.Mesh(new T.SphereGeometry(.625,24,12,0,TAU,Math.PI*.58,Math.PI*.42),std('#f4f6ff',.7,0,{side:T.DoubleSide}));dia.position.y=.64;rig.add(dia);
  var wm=std('#ffffff',.2,0),bm=new T.MeshBasicMaterial({color:'#1a0b33'}),sx;
  for(sx=-1;sx<=1;sx+=2){
    var e=new T.Mesh(new T.SphereGeometry(.15,14,10),wm);e.position.set(sx*.22,.74,.52);rig.add(e);
    var pu=new T.Mesh(new T.SphereGeometry(.085,10,8),bm);pu.position.set(sx*.22,.74,.64);rig.add(pu);
    var bl=new T.Mesh(new T.SphereGeometry(.09,10,8),new T.MeshBasicMaterial({color:'#ff7aa8'}));bl.scale.set(1.3,.7,.4);bl.position.set(sx*.38,.56,.46);rig.add(bl);
    var ft=new T.Mesh(new T.SphereGeometry(.2,12,10),skin);ft.scale.set(1,.6,1.4);ft.position.set(sx*.24,.1,.1);rig.add(ft);
  }
  var mo=new T.Mesh(new T.SphereGeometry(.065,10,8),bm);mo.scale.set(1.3,.8,.5);mo.position.set(0,.48,.59);rig.add(mo);
  var cl=new T.Mesh(new T.TorusGeometry(.1,.025,8,16,Math.PI*1.6),std('#8a4f2a',.6,0));cl.position.set(.02,1.28,.05);cl.rotation.y=.4;rig.add(cl);
  var hb=new T.Mesh(new T.TorusGeometry(.535,.045,8,26),std('#e5252f',.5,0));hb.rotation.x=Math.PI/2;hb.position.y=.92;rig.add(hb);
  var siren=null,sirenA=new T.Color('#ff2a3a'),sirenB=new T.Color('#2a6bff');
  if(style==='copsven'){
    hb.visible=false;cl.visible=false;
    var navy=std('#1d2f6b',.55,.05),pgold=std('#ffd23f',.25,.8,{emissive:'#7a5200',emissiveIntensity:.4});
    var pants=new T.Mesh(new T.SphereGeometry(.64,28,12,0,TAU,Math.PI*.64,Math.PI*.18),navy);pants.position.y=.64;rig.add(pants);
    var bt=new T.Mesh(new T.TorusGeometry(.565,.04,8,28),pgold);bt.rotation.x=Math.PI/2;bt.position.y=.42;rig.add(bt);
    var bdg=new T.Mesh(new T.CylinderGeometry(.11,.11,.03,5),pgold);bdg.rotation.x=Math.PI/2;bdg.position.set(.3,.3,.44);bdg.rotation.z=.2;rig.add(bdg);
    var crown2=new T.Mesh(new T.CylinderGeometry(.47,.5,.2,20),navy);crown2.position.y=1.2;rig.add(crown2);
    var top2=new T.Mesh(new T.CylinderGeometry(.52,.47,.05,20),navy);top2.position.y=1.33;rig.add(top2);
    var band2=new T.Mesh(new T.TorusGeometry(.49,.03,8,24),pgold);band2.rotation.x=Math.PI/2;band2.position.y=1.12;rig.add(band2);
    var peak=new T.Mesh(new T.CylinderGeometry(.4,.4,.035,16,1,false,-Math.PI/2,Math.PI),std('#0f1a3d',.35,.2));peak.position.set(0,1.1,.3);peak.rotation.x=.12;rig.add(peak);
    var cb=new T.Mesh(new T.CylinderGeometry(.095,.095,.03,5),pgold);cb.rotation.x=Math.PI/2;cb.position.set(0,1.22,.5);rig.add(cb);
    siren=new T.Mesh(new T.CylinderGeometry(.07,.09,.12,12),new T.MeshBasicMaterial({color:'#ff2a3a'}));siren.position.y=1.42;rig.add(siren);
  }
  var sh=makeShadow();
  return {group:g,rig:rig,shadow:sh,
    pose:function(tt,s,vx){
      if(siren)siren.material.color.copy(Math.floor(tt*6)%2?sirenA:sirenB);
      var mv=clamp(Math.abs(vx)/8,0,1);
      rig.position.y=Math.abs(Math.sin(tt*10))*.3*mv+Math.abs(Math.sin(tt*3))*.04+(1-s)*3;
      rig.rotation.z=-clamp(vx/22,-1,1)*.25;
    }};
}

/* burgers */
var BG={
  bunB:new T.SphereGeometry(.47,22,8,0,TAU,Math.PI/2,Math.PI/2),
  patty:new T.CylinderGeometry(.5,.5,.14,24),
  cheese:new T.BoxGeometry(.92,.03,.92),
  tomato:new T.CylinderGeometry(.44,.44,.05,22),
  lettuce:(function(){
    var g=new T.CylinderGeometry(.5,.5,.05,30,1),p=g.attributes.position,i;
    for(i=0;i<p.count;i++){
      var x=p.getX(i),z=p.getZ(i),an=Math.atan2(z,x),k=1+.08*Math.sin(an*8);
      p.setXYZ(i,x*k,p.getY(i)+Math.sin(an*8)*.03,z*k);
    }
    g.computeVertexNormals();return g;
  })(),
  bunT:new T.SphereGeometry(.5,24,12,0,TAU,0,Math.PI/2),
  seed:new T.SphereGeometry(.035,6,5),
  snow:new T.SphereGeometry(.5,18,8,0,TAU,0,Math.PI*.38),
  eye:new T.SphereGeometry(.075,10,8),
  pupil:new T.SphereGeometry(.035,8,6),
  brow:new T.BoxGeometry(.16,.035,.04),
  stem:new T.CylinderGeometry(.04,.07,.2,6),
  cherry:new T.SphereGeometry(.1,10,8)
};
var BM={};
(function(){
  function set(k,bun,patty,cheese,tomato,lettuce,seedc,extra){
    var gold=k==='gold',burnt=k==='burnt';
    function mk(c,r){
      if(k==='shine'||k==='blue'||k==='pink')return std(c,.16,.9,{emissive:k==='blue'?'#4a1a8a':k==='pink'?'#1f7a10':'#a34200',emissiveIntensity:.55});
      if(k==='tt')return std(c,.25,.3,{emissive:'#b34a00',emissiveIntensity:.35});
      if(k==='candy'||k==='cblue'||k==='cpink')return std(c,.3,.15,{emissive:c,emissiveIntensity:.22});
      if(gold)return std(c,.28,.7,{emissive:'#8a5a00',emissiveIntensity:.45});
      var o=std(c,r,0);
      if(burnt){o.emissive=new T.Color('#ff2a1a');o.emissiveIntensity=.14}
      return o;
    }
    BM[k]={bun:mk(bun,.55),patty:mk(patty,.7),cheese:mk(cheese,.5),tomato:mk(tomato,.35),lettuce:mk(lettuce,.6),seed:std(seedc,.6,0)};
  }
  set('norm','#eaa046','#5b2e1b','#ffcf3a','#ff5a4a','#6fd05a','#fff1c9');
  set('gold','#ffd54a','#b87900','#fff6c2','#ff9d1f','#fff0a0','#fffbe0');
  set('shine','#ff8f1f','#6b2d12','#ffd04a','#c8321a','#7bd23a','#fff1c9');
  set('blue','#b06bff','#4a1a8a','#e6ccff','#8a3dff','#d0a8ff','#f4eaff');
  set('pink','#7dff4a','#1f6a14','#d9ffc4','#3fc41a','#a8ff80','#f0ffe8');
  set('tt','#ffa24a','#6b3a2a','#ffe08a','#ff6fb8','#b8f5d6','#fff1c9');
  set('candy','#ffb3dd','#8a5a44','#fff1a8','#ff8fb8','#b8f5d6','#ffffff');
  set('cblue','#9fdcff','#4a7fb8','#e4f5ff','#6fb8ff','#c4ecff','#ffffff');
  set('cpink','#ffa0d6','#b8387f','#ffe0f1','#ff6fb8','#ffc4e6','#ffffff');
  set('burnt','#4a3228','#120c0a','#7a5a1c','#4a1a14','#34452a','#6a5648');
  BM.snow=std('#ffffff',.9,0);
  BM.stem=std('#3f7a1f',.8,0);
  BM.cherry=std('#ff2a4a',.25,0,{emissive:'#a01030',emissiveIntensity:.4});
  BM.white=new T.MeshBasicMaterial({color:'#ffffff'});
  BM.black=new T.MeshBasicMaterial({color:'#120c0a'});
  BM.glowGold=new T.SpriteMaterial({map:GLOW,color:'#ffd23f',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7,fog:false});
  BM.glowShine=new T.SpriteMaterial({map:GLOW,color:'#ff8a1a',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.45,fog:false});
  BM.glowCandy=new T.SpriteMaterial({map:GLOW,color:'#ff9ad0',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.55,fog:false});
  BM.glowCBlue=new T.SpriteMaterial({map:GLOW,color:'#7fd0ff',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6,fog:false});
  BM.glowCPink=new T.SpriteMaterial({map:GLOW,color:'#ff8fd0',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6,fog:false});
  BM.glowTT=new T.SpriteMaterial({map:GLOW,color:'#ff9a6a',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6,fog:false});
  BM.glowBlue=new T.SpriteMaterial({map:GLOW,color:'#a04aff',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7,fog:false});
  BM.glowPink=new T.SpriteMaterial({map:GLOW,color:'#6aff3a',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7,fog:false});
  BM.glowBurnt=new T.SpriteMaterial({map:GLOW,color:'#ff3030',blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.55,fog:false});
})();
var seedPos=(function(){
  var xz=[[-.22,.2],[0,.28],[.22,.2],[-.1,.08],[.12,.06],[-.32,.02],[.32,0],[0,-.12]],out=[];
  for(var i=0;i<xz.length;i++){
    var x=xz[i][0],z=xz[i][1];
    out.push([x,.12+.78*Math.sqrt(Math.max(0,.25-x*x-z*z))+.01,z]);
  }
  return out;
})();
function makeBurger(kind,frost,shiny){
  var bst=evCur?SEASONS[evCur.s].burgers:'',candyEv=bst==='candy',k2=kind;
  if(TH_LOOK[bst])return makeThemedBurger(bst,kind,frost,shiny);
  if(candyEv){if(kind==='blue')k2='cblue';else if(kind==='pink')k2='cpink';else if(kind==='norm'&&shiny)k2='candy'}
  else if(kind==='norm'&&shiny)k2=bst==='treat'?'tt':'shine';
  var m=BM[k2],g=new T.Group(),a;
  a=new T.Mesh(BG.bunB,m.bun);a.scale.y=.45;a.position.y=-.16;g.add(a);
  a=new T.Mesh(BG.patty,m.patty);a.position.y=-.09;g.add(a);
  a=new T.Mesh(BG.cheese,m.cheese);a.position.y=.0;a.rotation.y=Math.PI/4;g.add(a);
  a=new T.Mesh(BG.tomato,m.tomato);a.position.y=.04;g.add(a);
  a=new T.Mesh(BG.lettuce,m.lettuce);a.position.y=.09;g.add(a);
  a=new T.Mesh(BG.bunT,m.bun);a.scale.y=.78;a.position.y=.12;g.add(a);
  var i;
  if(kind!=='burnt'){
    for(i=0;i<seedPos.length;i++){
      var s=new T.Mesh(BG.seed,m.seed);s.position.set(seedPos[i][0],seedPos[i][1],seedPos[i][2]);
      s.scale.set(1,.6,1.8);g.add(s);
    }
  }else{
    for(i=-1;i<=1;i+=2){
      var e=new T.Mesh(BG.eye,BM.white);e.position.set(i*.15,.3,.42);g.add(e);
      var p=new T.Mesh(BG.pupil,BM.black);p.position.set(i*.15,.3,.48);g.add(p);
      var b=new T.Mesh(BG.brow,BM.black);b.position.set(i*.15,.4,.4);b.rotation.z=-i*.45;g.add(b);
    }
  }
  if(shiny&&kind==='norm'||kind==='blue'||kind==='pink'){
    if(candyEv){a=new T.Mesh(BG.cherry,BM.cherry);a.position.set(0,.58,0);g.add(a)}
    else{a=new T.Mesh(BG.stem,BM.stem);a.position.set(0,.6,0);a.rotation.z=.25;g.add(a)}
  }
  if(frost){a=new T.Mesh(BG.snow,BM.snow);a.scale.set(1.03,.82,1.03);a.position.y=.13;g.add(a)}
  if(kind==='gold'||kind==='burnt'||kind==='blue'||kind==='pink'||shiny){
    var sp=new T.Sprite(kind==='burnt'?BM.glowBurnt:kind==='gold'?BM.glowGold:({blue:BM.glowBlue,pink:BM.glowPink,cblue:BM.glowCBlue,cpink:BM.glowCPink,candy:BM.glowCandy,tt:BM.glowTT}[k2]||BM.glowShine));sp.scale.set(shiny&&kind==='norm'?1.9:2.3,shiny&&kind==='norm'?1.9:2.3,1);sp.position.y=.1;g.add(sp);
  }
  return g;
}

/* power-ups */
var PU={
  magnet:{name:'Magnet',color:'#ff4f6b',dur:9},
  shield:{name:'Shield',color:'#35e0ff',dur:18},
  slow:{name:'Slow-mo',color:'#b388ff',dur:6}
};
var puTex={};
function puIcon(type){
  if(puTex[type])return puTex[type];
  var c=document.createElement('canvas');c.width=c.height=96;var x=c.getContext('2d');
  if(x){
    x.fillStyle=PU[type].color;x.beginPath();x.arc(48,48,44,0,TAU);x.fill();
    x.strokeStyle='#fff';x.fillStyle='#fff';x.lineWidth=7;x.lineCap='round';x.lineJoin='round';
    if(type==='magnet'){x.beginPath();x.moveTo(30,62);x.lineTo(30,42);x.arc(48,42,18,Math.PI,0);x.lineTo(66,62);x.stroke();x.fillRect(24,60,12,10);x.fillRect(60,60,12,10)}
    else if(type==='shield'){x.beginPath();x.moveTo(48,22);x.lineTo(70,30);x.lineTo(68,52);x.quadraticCurveTo(64,68,48,76);x.quadraticCurveTo(32,68,28,52);x.lineTo(26,30);x.closePath();x.stroke()}
    else{x.beginPath();x.arc(48,50,22,0,TAU);x.stroke();x.beginPath();x.moveTo(48,50);x.lineTo(48,36);x.moveTo(48,50);x.lineTo(60,56);x.stroke()}
  }
  puTex[type]=new T.CanvasTexture(c);return puTex[type];
}
function makePowerup(type){
  var g=new T.Group(),col=PU[type].color;
  g.add(new T.Mesh(new T.SphereGeometry(.5,20,14),new T.MeshStandardMaterial({color:col,roughness:.25,metalness:.2,emissive:col,emissiveIntensity:.45})));
  var glow=new T.Sprite(new T.SpriteMaterial({map:GLOW,color:col,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.75,fog:false}));glow.scale.set(2.6,2.6,1);g.add(glow);
  var ic=new T.Sprite(new T.SpriteMaterial({map:puIcon(type),transparent:true,depthTest:false,fog:false}));ic.scale.set(.95,.95,1);ic.position.z=.55;g.add(ic);
  return g;
}
function makeBoss(){
  var g=makeBurger('norm',false,false),i;
  for(i=-1;i<=1;i+=2){
    var e=new T.Mesh(BG.eye,BM.white);e.position.set(i*.15,.3,.42);g.add(e);
    var p=new T.Mesh(BG.pupil,BM.black);p.position.set(i*.15,.3,.48);g.add(p);
    var b=new T.Mesh(BG.brow,BM.black);b.position.set(i*.15,.4,.4);b.rotation.z=-i*.45;g.add(b);
  }
  var sp=new T.Sprite(BM.glowBurnt);sp.scale.set(3.2,3.2,1);sp.position.y=.1;g.add(sp);
  g.scale.setScalar(3.4);return g;
}

