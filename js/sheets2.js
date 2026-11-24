/* The sheets of the machines and the method: the gear pair, the judge, the planetary gearbox, the palletizer, the
   plate, the loop. All gears are cut by the sheet's own rack cutter (gearlab.js). */
(function(){
'use strict';
var $=DK.$,H=DK.hooks,PI=Math.PI,D=DR;
var cache={};
function gear(z,o){var key=z+':'+JSON.stringify(o||{});if(!cache[key])cache[key]=GL.make(z,o).finish();return cache[key];}

/* ---------- 3 predict, then build: the pair turns, linked, with its centre distance drawn ---------- */
(function(){var s=$('#s-pair');if(!s)return;var L=D.layer(s,1),th=0,step=0;
  var k=7.2,X1=1090,Y=470,A=60,X2=X1+A*k;
  H['s-pair']={step:function(n){step=n;},
    frame:function(t,dt){var g1=gear(20,{S:12,bore:8}),g2=gear(40,{S:12,bore:8}),g=L.begin();th+=dt*.35;
      var ph=GL.meshPhase(20,40),t1=th,t2=ph-th*20/40;
      D.cross(g,X1,Y,22*k+30);D.cross(g,X2,Y,42*k+30);D.circle(g,X1,Y,20*k,'chain',1.1,D.model);D.circle(g,X2,Y,40*k,'chain',1.1,D.model);
      GL.draw(g,g1,X1,Y,t1,k,'#cfd8e4',D.ink);GL.draw(g,g2,X2,Y,t2,k,'#e3d6b8',D.ink);
      D.dim(g,X1,Y+44*k,X2,Y+44*k,0,'a = 60',step>=1?D.model:D.ink);D.seg(g,X1,Y,X1,Y+46*k,null,1,D.ink2);D.seg(g,X2,Y,X2,Y+46*k,null,1,D.ink2);
      D.leader(g,X1-20*k*Math.cos(.8),Y-20*k*Math.sin(.8),X1-150,Y-260,'gear 1, z = 20','pitch circle Ø40',D.model);
      D.leader(g,X2+40*k*Math.cos(.5),Y-40*k*Math.sin(.5),X2+150,Y-345,'gear 2, z = 40','pitch circle Ø80',D.model);
      if(step>=1){var r1=12*k;g.strokeStyle=D.judge;g.lineWidth=3;g.beginPath();g.arc(X1,Y,r1,-PI,-PI/2);g.stroke();D.arrow(g,X1-r1*Math.sin(.25),Y-r1*Math.cos(.25),X1,Y-r1,D.judge,3);
        D.text(g,'90°',X1-r1*.62,Y-r1*.62,'700 26px',D.judge,'center');
        var r2=26*k;g.beginPath();g.arc(X2,Y,r2,-PI/2,-PI/4);g.stroke();D.arrow(g,X2+r2*Math.cos(-PI/4-.2),Y+r2*Math.sin(-PI/4-.2),X2+r2*Math.cos(-PI/4),Y+r2*Math.sin(-PI/4),D.judge,3);D.text(g,'45°',X2+r2*.42,Y-r2*.86,'700 26px',D.judge,'center');}},
    state:function(){return {th:th};}};
})();

/* ---------- 5 the judge: one gear turned alone, the overlap counted, the curve drawn ---------- */
(function(){var s=$('#s-judge');if(!s)return;var L=D.layer(s,1),step=0,clock=0,curve=null,ang=0;
  var DX=1360,DY=470,DR_=390,k=26,a=60;                        // the detail view: a circle round the mesh, 26 px per mm
  function make(){var g1=gear(20,{S:12,bore:8}),g2=gear(40,{S:12,bore:8}),ph=GL.meshPhase(20,40);curve=[];
    for(var d=0;d<=18.001;d+=.5)curve.push([d,GL.overlap(g1,g2,a,d*PI/180,ph).area*10]);return curve;}
  function vol(d){if(!curve)make();var i=Math.min(curve.length-2,Math.floor(d/.5)),f=(d-curve[i][0])/.5;return curve[i][1]+(curve[i+1][1]-curve[i][1])*f;}
  function chart(g,x,y,w,h){var vmax=200;D.seg(g,x,y+h,x+w,y+h,null,1.5,D.ink);D.seg(g,x,y,x,y+h,null,1.5,D.ink);
    for(var d=0;d<=18;d+=3){var px=x+d/18*w;D.seg(g,px,y+h,px,y+h+8,null,1.2,D.ink);D.text(g,d+'°',px,y+h+24,'400 18px',D.ink2,'center');D.seg(g,px,y,px,y+h,'dot',1,D.faint);}
    for(var v=0;v<=200;v+=50){var py=y+h-v/vmax*h;D.text(g,String(v),x-10,py,'400 18px',D.ink2,'right');D.seg(g,x,py,x+w,py,'dot',1,D.faint);}
    D.text(g,'mm³',x-10,y-20,'600 17px',D.ink2,'right');D.text(g,'gear 1 turned alone',x+w,y+h+50,'600 18px',D.ink2,'right');
    g.strokeStyle=D.no;g.lineWidth=3;g.setLineDash([]);g.beginPath();curve.forEach(function(c,i){var px=x+c[0]/18*w,py=y+h-c[1]/vmax*h;i?g.lineTo(px,py):g.moveTo(px,py);});g.stroke();
    var px9=x+.5*w,py9=y+h-vol(9)/vmax*h;g.fillStyle=D.no;g.beginPath();g.arc(px9,py9,6,0,2*PI);g.fill();D.text(g,Math.round(vol(9))+' mm³ at 9°',px9+14,py9-16,'700 22px',D.no);
    if(step>=2){var pf=y+h-173.1/vmax*h;g.strokeStyle=D.judge;g.lineWidth=2.5;g.beginPath();g.moveTo(px9-10,pf);g.lineTo(px9+10,pf);g.moveTo(px9,pf-10);g.lineTo(px9,pf+10);g.stroke();
      D.text(g,'Fusion 173.1',px9,pf+70,'700 20px',D.judge,'center');}
    var pc=x+ang/18*w,pv=y+h-vol(ang)/vmax*h;g.strokeStyle=D.ink;g.lineWidth=1.5;g.beginPath();g.arc(pc,pv,8,0,2*PI);g.stroke();}
  H['s-judge']={enter:function(){if(!curve)make();clock=0;},step:function(n){step=n;},
    frame:function(t,dt){if(!curve)make();clock+=dt;ang=DK.STATIC?9:9-9*Math.cos(clock*.7);var g1=gear(20,{S:12,bore:8}),g2=gear(40,{S:12,bore:8}),ph=GL.meshPhase(20,40),g=L.begin();
      var cx=DX-20*k,t1=ang*PI/180;                                  // the pitch point of the mesh is the centre of the detail
      g.save();g.beginPath();g.arc(DX,DY,DR_,0,2*PI);g.clip();
      GL.draw(g,g1,cx,DY,t1,k,'#cfd8e4',D.ink);GL.draw(g,g2,cx+a*k,DY,ph,k,'#e3d6b8',D.ink);
      var o=GL.overlap(g1,g2,a,t1,ph),tc=s._tc||(s._tc=document.createElement('canvas'));tc.width=o.canvas.width;tc.height=o.canvas.height;var tg=tc.getContext('2d');tg.drawImage(o.canvas,0,0);
      tg.globalCompositeOperation='source-in';tg.fillStyle=D.no;tg.fillRect(0,0,tc.width,tc.height);g.globalAlpha=.85;g.drawImage(tc,cx+o.x0*k,DY+o.y0*k,tc.width*k/o.S,tc.height*k/o.S);g.globalAlpha=1;
      D.seg(g,cx,DY,cx+a*k,DY,'chain',1,D.ink2);g.restore();
      D.circle(g,DX,DY,DR_,null,2.5,D.ink);D.text(g,'DETAIL X · SCALE 13 : 1 · the teeth where the gears meet',DX,DY+DR_+34,'600 22px',D.ink2,'center');
      D.text(g,'gear 1 turned '+ang.toFixed(1)+'° alone · shared '+Math.round(vol(ang))+' mm³',136,440,'700 26px',D.no);
      if(step>=1)chart(g,170,500,560,190);},
    state:function(){return {ang:ang,vol9:curve&&vol(9),rest:curve&&curve[0][1],curve:curve};}};
})();

/* ---------- 7 planetary gearbox: ring held, sun driven, cut and phased as the book's prompt says ---------- */
(function(){var s=$('#s-planet');if(!s)return;var L=D.layer(s,1),step=0,ts=0,goal=null;
  var m=1.5,Zs=16,Zp=20,N=4,Zr=Zs+2*Zp,a=m*(Zs+Zp)/2,S=14,CX=1420,CY=455,k=6.7,P=null;
  function make(){if(P)return P;P={sun:GL.make(Zs,{m:m,S:S,backlash:.3,bore:8}).finish(),pl:GL.make(Zp,{m:m,S:S,backlash:.3,bore:6.2}).finish(),ring:GL.ring(Zr,{m:m,S:S,backlash:.3})};return P;}
  function pose(s_){var tc=s_*Zs/(Zs+Zr),L2=[],phr=(Zp%2)?0:PI/Zr;L2.push(['ring',P.ring,0,0,phr-GL.toothAt(P.ring.space),'#d9d2bf']);L2.push(['sun',P.sun,0,0,s_-GL.toothAt(P.sun),'#e8c77e']);
    for(var i=0;i<N;i++){var ti=2*PI*i/N,psi=(ti*(Zs+Zp)+PI*(Zp-1))/Zp,rel=(tc-s_)*Zs/Zp;L2.push(['p'+i,P.pl,a*Math.cos(ti+tc),a*Math.sin(ti+tc),psi-GL.toothAt(P.pl)+tc+rel,'#c9d6e3']);}
    return {tc:tc,list:L2};}
  H['s-planet']={enter:function(){make();},step:function(n){step=n;if(n===3){ts=0;goal=2*PI;}else goal=null;if(DK.STATIC&&n===3)ts=2*PI;},
    frame:function(t,dt){make();if(goal!=null){ts=Math.min(goal,ts+dt*.9);}else ts+=dt*.5;var Q=pose(ts),g=L.begin();
      D.cross(g,CX,CY,52*k);
      Q.list.forEach(function(x){GL.draw(g,x[1],CX+x[2]*k,CY-x[3]*k,x[4],k,x[5],D.ink);});
      g.strokeStyle=D.model;g.lineWidth=7;g.globalAlpha=.55;for(var i=0;i<N;i++){var ang=2*PI*i/N+Q.tc;g.beginPath();g.moveTo(CX,CY);g.lineTo(CX+a*k*Math.cos(ang),CY-a*k*Math.sin(ang));g.stroke();}g.globalAlpha=1;
      D.circle(g,CX,CY,a*k,'chain',1.2,D.model);
      var sd=ts*180/PI,cd=Q.tc*180/PI,pd=(Q.tc-ts)*Zs/Zp*180/PI;
      var LX=1050;D.leader(g,CX+3*k,CY-5*k,LX,280,'sun, 16 teeth','driven',D.judge);
      var p0=Q.list[3];D.leader(g,CX+p0[2]*k,CY-p0[3]*k,LX,140,'planet, 20 teeth','4 of them',D.model);
      D.leader(g,CX+47*k*Math.cos(3.6),CY-47*k*Math.sin(3.6),LX,790,'ring, 56 teeth','held',D.ink);
      D.leader(g,CX+a*k*Math.cos(Q.tc+PI*1.25),CY-a*k*Math.sin(Q.tc+PI*1.25),LX,650,'carrier','the output',D.model);
      var ro=$('#pl-read');if(ro)ro.innerHTML='<div><span>sun</span><b>'+sd.toFixed(0)+'°</b></div><div class="m"><span>carrier</span><b>'+cd.toFixed(0)+'°</b></div><div class="m"><span>planet on carrier</span><b>'+pd.toFixed(0)+'°</b></div>';},
    state:function(){return {ts:ts,tc:P?ts*Zs/(Zs+Zr):0,rel:(ts*Zs/(Zs+Zr)-ts)*Zs/Zp};},
    overlaps:function(s_){make();var Q=pose(s_),L2=Q.list,res=[];for(var i=2;i<L2.length;i++){res.push(GL.overlapAt(L2[1][1],L2[1][2],L2[1][3],L2[1][4],L2[i][1],L2[i][2],L2[i][3],L2[i][4]).area);
      res.push(GL.overlapAt(L2[i][1],L2[i][2],L2[i][3],L2[i][4],L2[0][1],L2[0][2],L2[0][3],L2[0][4]).area);}return res;}};
})();

/* ---------- 9 the palletizer: Fusion's triangles, and the parts list the book weighed ---------- */
(function(){var s=$('#s-pallet');if(!s||!window.MACHINES||!MACHINES.palletizer)return;var V=null,clock=0;
  /* from the book's companion, projects/palletizer/lib/palletizer_weighed.json (PalletizerRobot 1.1, 2026-11-12) */
  var BOM=[['turret',1281.76],['base',992.70],['lower arm',529.94],['crank and counterweight',292.92],['upper arm',270.44],['wrist housing',127.09],['parallel rod',36.16],
    ['balancer',20.17],['triangle',19.94],['tool flange',13.00],['levelling rod 2',12.31],['levelling rod 1',11.64]];
  DK.BOM=BOM;
  var tb=$('#bom'),tot=BOM.reduce(function(a,r){return a+r[1];},0);
  if(tb)tb.innerHTML=BOM.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+r[0]+'<span class="bar" style="width:'+Math.round(r[1]/1281.76*200)+'px"></span></td><td>'+r[1].toFixed(2)+'</td></tr>';}).join('')+
    '<tr class="tot"><td></td><td>Total</td><td>'+tot.toFixed(2)+'</td></tr>';
  H['s-pallet']={enter:function(){if(!V)V=MV.make(s,'palletizer',{x:1400,y:390,w:860,h:640,yaw:-.95,tilt:.32,edgeAngle:30,
      colours:{'Base':0xd6cfbd,'Turret':0xe6cf9c,'Lower arm':0xd9a98f,'Upper arm':0xd9a98f,'Crank':0xb9cbe0,'Parallel rod':0x8fb0d6,'Levelling rod 1':0xa9c7ae,'Levelling rod 2':0xa9c7ae,'Wrist':0xc9c9c9}}).build();clock=0;},
    frame:function(t,dt){if(!V)return;clock+=dt;V.yaw=-.95+(DK.STATIC?0:Math.sin(clock*.2)*.25);V.render();},
    state:function(){return {total:+tot.toFixed(2),rows:BOM.length};}};
})();

/* ---------- 10 the plate: an orthographic drawing that draws itself ---------- */
(function(){var s=$('#s-plate');if(!s)return;var L=D.layer(s,1),clock=0;
  var k=7,X0=980,Y0=150,Wp=100,Hp=60,T=8,e=10,d=6;
  H['s-plate']={enter:function(){clock=0;},
    frame:function(t,dt){clock+=dt;var p=DK.STATIC?1:D.clamp(clock/4.5,0,1),g=L.begin();
      function pen(i,n){return D.clamp(p*n-i,0,1);}                 // stroke i of n, how far drawn
      var x1=X0+Wp*k,y1=Y0+Hp*k,f=pen(0,6);
      g.lineWidth=3;g.strokeStyle=D.ink;g.setLineDash([2*(Wp+Hp)*k*f,1e5]);g.strokeRect(X0,Y0,Wp*k,Hp*k);g.setLineDash([]);
      var holes=[[e,e],[Wp-e,e],[e,Hp-e],[Wp-e,Hp-e]];
      holes.forEach(function(h,i){var q=pen(1+i*.25,6);if(q<=0)return;var cx=X0+h[0]*k,cy=Y0+h[1]*k;g.lineWidth=2.5;g.beginPath();g.arc(cx,cy,d/2*k,-PI/2,-PI/2+2*PI*q);g.stroke();
        if(q>=1)D.cross(g,cx,cy,d*k*.9);});
      if(pen(2,6)>0){D.seg(g,X0-20,Y0+Hp*k/2,x1+20,Y0+Hp*k/2,'chain',1.1,D.ink2);D.seg(g,X0+Wp*k/2,Y0-20,X0+Wp*k/2,y1+20,'chain',1.1,D.ink2);}
      if(pen(3,6)>0){g.globalAlpha=pen(3,6);D.dim(g,X0,y1,x1,y1,60,'100');D.dim(g,x1,Y0,x1,y1,-60,'60');D.dim(g,X0,Y0,X0+e*k,Y0,-46,'10');D.dim(g,X0,Y0,X0,Y0+e*k,46,'10');
        D.leader(g,X0+(Wp-e)*k+d/2*k*.7,Y0+e*k-d/2*k*.7,x1+70,Y0-40,'4 × Ø6','through');g.globalAlpha=1;}
      /* section A-A: the plate cut through two holes, hatched */
      var sy=y1+150,q=pen(4,6);if(q>0){g.globalAlpha=q;g.lineWidth=3;g.strokeStyle=D.ink;
        var cuts=[[X0,X0+(e-d/2)*k],[X0+(e+d/2)*k,X0+(Wp-e-d/2)*k],[X0+(Wp-e+d/2)*k,x1]];
        cuts.forEach(function(c){g.beginPath();g.rect(c[0],sy,c[1]-c[0],T*k);g.stroke();g.beginPath();g.rect(c[0],sy,c[1]-c[0],T*k);D.hatch(g,c[0],sy,c[1],sy+T*k,10,D.ink2);});
        D.dim(g,x1,sy,x1,sy+T*k,-50,'8');D.text(g,'SECTION A–A',X0+Wp*k/2,sy+T*k+44,'700 24px',D.ink,'center');
        D.seg(g,X0-50,Y0+e*k,X0-10,Y0+e*k,null,3,D.ink);D.seg(g,x1+10,Y0+e*k,x1+50,Y0+e*k,null,3,D.ink);D.text(g,'A',X0-62,Y0+e*k+22,'700 24px',D.ink,'center');D.text(g,'A',x1+62,Y0+e*k+22,'700 24px',D.ink,'center');g.globalAlpha=1;}
      if(pen(5,6)>0){g.globalAlpha=pen(5,6);D.text(g,'Steel · 1 part · all sizes in mm',X0,sy+T*k+90,'600 22px',D.ink2);g.globalAlpha=1;}},
    state:function(){return {clock:clock};}};
})();

/* ---------- 12 the loop: five stations and a point that goes round ---------- */
(function(){var s=$('#s-yours');if(!s)return;var L=D.layer(s,1),clock=0;
  var CX=1420,CY=480,R=300,names=[['functions','with names'],['predict','by hand'],['judge','measures'],['compare','and quote'],['break it','on purpose']];
  H['s-yours']={frame:function(t,dt){clock+=dt;var g=L.begin(),n=names.length;
    D.circle(g,CX,CY,R,'chain',1.2,D.model);
    for(var i=0;i<n;i++){var a0=-PI/2+i*2*PI/n,x=CX+R*Math.cos(a0),y=CY+R*Math.sin(a0);
      var a1=a0+2*PI/n*.78,xa=CX+R*Math.cos(a1),ya=CY+R*Math.sin(a1);D.arrow(g,CX+R*Math.cos(a1-.08),CY+R*Math.sin(a1-.08),xa,ya,D.model,2);
      g.fillStyle=D.paper;g.beginPath();g.arc(x,y,62,0,2*PI);g.fill();D.circle(g,x,y,62,null,2.5,i===2?D.judge:D.ink);
      D.text(g,String(i+1),x,y-16,'700 30px',i===2?D.judge:D.ink,'center');D.text(g,names[i][0],x,y+14,'600 19px',D.ink,'center');D.text(g,names[i][1],x,y+36,'400 15px',D.ink2,'center');}
    var b=-PI/2+((DK.STATIC?0:clock)*.5)%(2*PI);g.fillStyle=D.judge;g.beginPath();g.arc(CX+R*Math.cos(b),CY+R*Math.sin(b),9,0,2*PI);g.fill();
    D.text(g,'until the numbers agree',CX,CY,'600 26px',D.ink2,'center');}};
})();
})();
