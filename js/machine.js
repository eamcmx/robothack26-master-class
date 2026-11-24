/* A machine of the book as a technical illustration: Fusion's own triangles, lightly shaded, with ink edges, on the
   paper of the sheet. Groups can be exploded and, where Fusion gave their axes, posed: each group turns by
   (pitch x its pitch ratio) about its pitch axis and (roll x its roll ratio) about its roll axis, as in Fusion.
   Fusion's z is up; the scene's y is up. */
(function(){
'use strict';
var MV=window.MV={},PI=Math.PI;
var COL=[0xd9d2c0,0xc9d6e3,0xe6cf9c,0xd7b8a6,0xbfd3c1,0xd0c4dc,0xe2d9b8,0xc8c8c8];
function fz(v){return new THREE.Vector3(v[0],v[2],-v[1]);}                       // Fusion (x, y, z) -> scene (x, z, -y)
MV.make=function(sheet,name,o){o=o||{};var D=window.MACHINES[name];var c=document.createElement('canvas');c.className='layer';c.style.zIndex=o.z==null?2:o.z;sheet.insertBefore(c,sheet.firstChild);
  var R=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true,preserveDrawingBuffer:true});R.setClearColor(0x000000,0);
  var S=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,-1e5,1e5);
  S.add(new THREE.HemisphereLight(0xffffff,0x8a8070,.95));var sun=new THREE.DirectionalLight(0xffffff,.55);sun.position.set(.6,1,.8);S.add(sun);
  var V={c:c,R:R,S:S,cam:cam,groups:[],pitch:0,roll:0,ex:0,name:name,ready:false,yaw:o.yaw==null?-.7:o.yaw,tilt:o.tilt==null?.5:o.tilt,zoom:1};
  var box=D.box,ctr=fz([(box[0]+box[3])/2,(box[1]+box[4])/2,(box[2]+box[5])/2]),size=Math.max(box[3]-box[0],box[4]-box[1],box[5]-box[2]);
  V.build=function(){if(V.ready)return V;
    D.groups.forEach(function(G,gi){var bin=atob(G.p),u8=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
      var q=new Int16Array(u8.buffer),pos=new Float32Array(q.length);for(i=0;i<q.length;i+=3){pos[i]=q[i]*D.q;pos[i+1]=q[i+2]*D.q;pos[i+2]=-q[i+1]*D.q;}
      var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.computeVertexNormals();
      var mat=new THREE.MeshLambertMaterial({color:(o.colours&&o.colours[G.name])||COL[gi%COL.length],polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
      var mesh=new THREE.Mesh(geo,mat),edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo,o.edgeAngle||32),new THREE.LineBasicMaterial({color:0x1b1f24}));
      var g=new THREE.Group();g.add(mesh);g.add(edges);g.matrixAutoUpdate=false;S.add(g);
      geo.computeBoundingBox();var cg=new THREE.Vector3();geo.boundingBox.getCenter(cg);
      V.groups.push({name:G.name,g:g,mat:mat,centre:cg,pitch:G.pitch,roll:G.roll,dir:cg.clone().sub(ctr)});});
    V.ready=true;V.pose(V.pitch,V.roll);return V;};
  function about(ax,th){var a=fz(ax.axis).normalize(),p=fz(ax.point),m=new THREE.Matrix4().makeTranslation(p.x,p.y,p.z);
    m.multiply(new THREE.Matrix4().makeRotationAxis(a,th*ax.per_deg*PI/180));m.multiply(new THREE.Matrix4().makeTranslation(-p.x,-p.y,-p.z));return m;}
  /* pose in degrees; ex from 0 (assembled) to 1 (exploded) */
  V.pose=function(p,r,ex){V.pitch=p;V.roll=r;if(ex!=null)V.ex=ex;if(!V.ready)return V;
    V.groups.forEach(function(G){var m=new THREE.Matrix4();if(G.pitch)m.multiply(about(G.pitch,p));if(G.roll)m.multiply(about(G.roll,r));
      if(V.ex>0){var d=G.dir.clone();if(d.length()<1)d.set(0,1,0);d.normalize().multiplyScalar(V.ex*size*(o.explode||.45));m.premultiply(new THREE.Matrix4().makeTranslation(d.x,d.y,d.z));}
      G.g.matrix.copy(m);G.g.matrixWorldNeedsUpdate=true;});return V;};
  /* the view: where on the sheet (sheet pixels) the machine stands, and how large */
  V.place=function(x,y,w,h,scale){V.px=[x,y,w,h];V.k=scale||Math.min(w,h)/size*.9;return V;};
  V.place(o.x||960,o.y||540,o.w||900,o.h||900,o.scale);
  V.render=function(){if(!V.ready)return;var s=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s'))||1,dpr=Math.min(2,window.devicePixelRatio||1);
    var W=Math.round(1920*s*dpr),Hh=Math.round(1080*s*dpr);if(c.width!==W||c.height!==Hh){R.setPixelRatio(1);R.setSize(W,Hh,false);}
    var k=V.k*V.zoom,cx=V.px[0],cy=V.px[1];                                       // sheet px per mm, and where the centre goes
    cam.left=-cx/k;cam.right=(1920-cx)/k;cam.top=cy/k;cam.bottom=-(1080-cy)/k;cam.updateProjectionMatrix();
    var dir=new THREE.Vector3(Math.sin(V.yaw)*Math.cos(V.tilt),Math.sin(V.tilt),Math.cos(V.yaw)*Math.cos(V.tilt));
    cam.position.copy(ctr).addScaledVector(dir,size*4);cam.up.set(0,1,0);cam.lookAt(ctr);R.render(S,cam);};
  /* where a group's centre is on the sheet now (sheet pixels), for leaders */
  V.where=function(name,i){var G=V.groups.filter(function(x){return x.name===name;})[i||0];if(!G)return null;var p=G.centre.clone().applyMatrix4(G.g.matrix).project(cam);
    return [(p.x+1)/2*1920,(1-p.y)/2*1080];};
  V.tint=function(name,hex){V.groups.forEach(function(G){if(G.name===name)G.mat.color.setHex(hex);});};
  return V;};
})();
