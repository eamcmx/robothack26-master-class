/* What each sheet draws and does. Every sheet gets the frame, the zone marks and the title block of a drawing. */
(function(){
'use strict';
var $=DK.$,$$=DK.$$,H=DK.hooks,PI=Math.PI,D=DR;

/* ---------- the frame of every sheet ---------- */
$$('.sheet').forEach(function(s,i,all){var f=document.createElement('div');f.className='frame';
  f.innerHTML='<div class="zones t">'+[1,2,3,4,5,6,7,8].map(function(n){return '<span>'+n+'</span>';}).join('')+'</div>'+
    '<div class="zones b">'+[1,2,3,4,5,6,7,8].map(function(n){return '<span>'+n+'</span>';}).join('')+'</div>'+
    '<div class="zonesv l">'+'ABCDEF'.split('').map(function(n){return '<span>'+n+'</span>';}).join('')+'</div>'+
    '<div class="zonesv r">'+'ABCDEF'.split('').map(function(n){return '<span>'+n+'</span>';}).join('')+'</div>';
  s.appendChild(f);if(s.dataset.tb==='none')return;
  var t=document.createElement('div');t.className='tblock';
  t.innerHTML='<div class="ttl"><small>Title</small><b>'+(s.dataset.title||'')+'</b></div>'+
    '<div class="drw"><small>Drawn</small><b>Claude</b></div><div class="chk"><small>Checked</small><b>Autodesk Fusion</b></div><div><small>Approved</small><b>E. Merchán-Cruz</b></div>'+
    '<div class="last"><small>RobotHack \'26 · TSI, Riga</small><b>24.11.2026</b></div><div class="last"><small>Units</small><b>mm, deg</b></div><div class="last"><small>Sheet</small><b>'+(i+1)+' of '+all.length+'</b></div>';
  s.appendChild(t);});

/* ---------- a rack cutter cutting a gear: the title, and the last sheet (where the room picks the teeth) ---------- */
function cutterScene(id,o){var s=$('#'+id);if(!s)return;var L=D.layer(s,1),cyc=o.cycle,ci=0,G=null,k=1,T=0,hold=0,state='cut',zPick=null;
  var CX=o.x,CY=o.y,RAD=o.rad;
  function start(){var z=zPick||cyc[ci%cyc.length];var ra=z+2;k=RAD/ra;G=GL.make(z,{S:Math.ceil(k*1.6),bore:z>20?8:5});T=G.phi;state='cut';hold=0;}
  /* the rack: its outline in the gear's units, drawn in sheet pixels so that the line weight stays even */
  function drawRack(g,phi){var m=2,r=G.r,a=20*PI/180,p=PI*m,sh=r*phi,ty=CY+r*k,x0=-(RAD+60)/k,x1=(RAD+60)/k,j0=Math.floor((x0-sh)/p)-1,j1=Math.ceil((x1-sh)/p)+1,depth=Math.max(5,40/k);
    function path(){g.beginPath();g.moveTo(CX+x0*k,ty+(m+depth)*k);
      for(var j=j0;j<=j1;j++){var t=GL.rackTooth(m,a,G.backlash,sh+j*p);t[0][1]=t[3][1]=-m;for(var q=0;q<4;q++)g.lineTo(CX+D.clamp(t[q][0],x0,x1)*k,ty-t[q][1]*k);}
      g.lineTo(CX+x1*k,ty+m*k);g.lineTo(CX+x1*k,ty+(m+depth)*k);g.closePath();}
    path();g.fillStyle='rgba(150,160,170,.3)';g.fill();path();D.hatch(g,CX+x0*k,ty-1.3*m*k,CX+x1*k,ty+(m+depth)*k,12,'rgba(60,70,80,.45)');
    path();g.lineWidth=2.2;g.strokeStyle=D.ink;g.setLineDash([]);g.stroke();D.seg(g,CX+x0*k,ty,CX+x1*k,ty,'chain',1,D.model);}
  H[id]={enter:function(){ci=0;start();if(DK.STATIC)G.finish();},
    key:function(c){if(!o.pick)return false;if(c==='+'||c==='='||c==='-'){var z=(zPick||G.z)+(c==='-'?-1:1);zPick=D.clamp(z,8,60);start();if(DK.STATIC)G.finish();return true;}},
    frame:function(t,dt){if(!G)start();var g=L.begin();
      if(state==='cut'){T+=dt*.42;G.cut(T);if(G.done){state='hold';hold=0;}}else{hold+=dt;if(hold>6.5&&!DK.STATIC&&!zPick){ci++;start();}}
      var phi=Math.min(G.phi,PI+.3),r=G.r;
      D.circle(g,CX,CY,r*k,'chain',1.1,D.model);D.circle(g,CX,CY,G.rb*k,'dash',1,D.faint);D.cross(g,CX,CY,G.ra*k+40);
      GL.draw(g,G,CX,CY,phi,k,'#ddd5c1',D.ink);
      if(state==='cut')drawRack(g,phi);
      var lx=o.labels==='right'?CX+RAD+90:CX-RAD-130;
      D.leader(g,CX+r*k*Math.cos(o.labels==='right'?-.75:-2.4),CY-r*k*Math.sin(o.labels==='right'?-.75:-2.4),lx,CY+170,'pitch circle Ø'+(2*r).toFixed(0),'m = 2 mm, z = '+G.z,D.model);
      D.leader(g,CX+G.rb*k*Math.cos(o.labels==='right'?.6:2.5),CY-G.rb*k*Math.sin(o.labels==='right'?.6:2.5),lx,CY-150,'base circle Ø'+(2*G.rb).toFixed(1),'the flanks start here');
      if(state==='cut')D.leader(g,o.labels==='right'?CX+RAD*.95:CX-RAD*.95,CY+r*k+20,lx,CY+r*k+60,'rack cutter, 20°','rolls on the pitch circle');
      if(G.undercut&&state==='hold'){var a0=PI/2+PI/G.z-phi;D.leader(g,CX+(G.rf+.9*G.m)*k*Math.cos(a0),CY-(G.rf+.9*G.m)*k*Math.sin(a0),lx,CY-300,'undercut','the cutter took the foot of the tooth',D.no);}
      if(!G.undercut&&state==='hold')D.text(g,'Nobody drew these flanks. The cutter made them.',CX,CY+RAD+64,'600 26px',D.ink2,'center');},
    state:function(){return {z:G&&G.z,done:G&&G.done,phi:G&&G.phi,state:state,undercut:G&&G.undercut};}};}
cutterScene('s-title',{cycle:[40,12],x:1430,y:470,rad:330});
cutterScene('s-end',{cycle:[30],x:1420,y:470,rad:320,pick:true});

/* ---------- 4 how a tooth is made: the string, the cutter, too few teeth ---------- */
(function(){var s=$('#s-tooth');if(!s)return;var L=D.layer(s,1),z=20,G=null,step=0,tS=0,roll=0;
  var CX=1420,CY=430,k=12;
  function make(){var ra=z+2;k=Math.min(18,340/ra);G=GL.make(z,{S:Math.ceil(k*1.6),bore:Math.min(8,z*.5)}).finish();var o=$('#tooth-z');if(o){o.value=z;$('#tooth-zv').textContent=z;}
    $('#tooth-verdict').innerHTML=G.undercut?'<span class="stamp no">undercut</span>':'<span class="stamp ok">no undercut</span>';}
  function setZ(n){z=D.clamp(Math.round(n),8,40);make();}
  /* the involute of the base circle, from where it leaves the circle at angle a0 (rad), unwound by t */
  function inv(rb,a0,t){return [rb*(Math.cos(a0+t)+t*Math.sin(a0+t)),rb*(Math.sin(a0+t)-t*Math.cos(a0+t))];}
  H['s-tooth']={enter:function(k0){tS=0;roll=0;if(!G)make();},step:function(n){var was=step;step=n;tS=0;if(n>=2&&(was<2||!G||G.z!==12))setZ(12);else if(n<2&&was>=2)setZ(20);},
    key:function(k){if(k==='+'||k==='='){setZ(z+1);return true;}if(k==='-'){setZ(z-1);return true;}},
    frame:function(t,dt){if(!G)make();tS+=dt;roll+=dt*.25;var g=L.begin(),rb=G.rb*k,r=G.r*k;
      D.cross(g,CX,CY,G.ra*k+60);D.circle(g,CX,CY,r,'chain',1.1,D.model);D.circle(g,CX,CY,rb,'dash',1.2,D.ink2);D.circle(g,CX,CY,G.rf*k,'dot',1,D.faint);
      var th=step===0?0:-roll;
      GL.draw(g,G,CX,CY,th,k,'#ddd5c1',D.ink);
      if(step===0||step===1){ /* the string: tangent to the base circle, its end on a flank */
        var tt=DK.STATIC?.55:(.55*((Math.sin(tS*.9-PI/2)+1)/2)),a0=PI/2-.42+th;
        var e=inv(G.rb,a0,tt),c=[G.rb*Math.cos(a0+tt),G.rb*Math.sin(a0+tt)];
        g.lineWidth=3;g.strokeStyle=D.model;g.beginPath();for(var q=0;q<=40;q++){var p=inv(G.rb,a0,tt*q/40);q?g.lineTo(CX+p[0]*k,CY-p[1]*k):g.moveTo(CX+p[0]*k,CY-p[1]*k);}g.stroke();
        D.seg(g,CX+c[0]*k,CY-c[1]*k,CX+e[0]*k,CY-e[1]*k,null,2,D.judge);g.fillStyle=D.judge;g.beginPath();g.arc(CX+e[0]*k,CY-e[1]*k,6,0,2*PI);g.fill();
        D.leader(g,CX+c[0]*k,CY-c[1]*k,CX-rb-120,CY-rb-60,'a string unwound','from the base circle',D.judge);
        D.leader(g,CX+inv(G.rb,a0,tt*.7)[0]*k,CY-inv(G.rb,a0,tt*.7)[1]*k,CX-G.ra*k-40,CY+100,'its end draws the involute','the shape of every flank here',D.model);}
      if(step>=1){ /* the rack cutter at the bottom, rolling as the gear turns */
        var m=2,a=20*PI/180,p=PI*m,sh=G.r*th,ty=CY+r,x0=-G.ra*1.25,x1=G.ra*1.25,dp=m+60/k;
        g.save();g.translate(CX,ty);g.scale(k,-k);g.beginPath();var j0=Math.floor((x0-sh)/p)-1,j1=Math.ceil((x1-sh)/p)+1;g.moveTo(x0,-dp);
        for(var j=j0;j<=j1;j++){var tq=GL.rackTooth(m,a,G.backlash,sh+j*p);tq[0][1]=tq[3][1]=-m;for(var q2=0;q2<4;q2++)g.lineTo(D.clamp(tq[q2][0],x0,x1),tq[q2][1]);}
        g.lineTo(x1,-m);g.lineTo(x1,-dp);g.closePath();g.restore();g.fillStyle='rgba(150,160,170,.25)';g.fill();g.lineWidth=2;g.strokeStyle=D.ink;g.stroke();
        D.seg(g,CX+x0*k,ty,CX+x1*k,ty,'chain',1,D.model);
        D.leader(g,CX+x1*k*.55,ty+2*k,CX+x1*k*.55+40,ty+2*k+105,'rack cutter','20° sides',D.ink);}
      if(G.undercut){var a1=PI/2+PI/G.z+th;g.strokeStyle=D.no;g.lineWidth=3;g.beginPath();g.arc(CX,CY,(G.rf+.9*G.m)*k,-(a1+.16),-(a1-.16),false);g.stroke();
        D.leader(g,CX+(G.rf+.9*G.m)*k*Math.cos(a1),CY-(G.rf+.9*G.m)*k*Math.sin(a1),CX-G.ra*k-30,CY-G.ra*k+20,'undercut','the foot is cut away: a weak tooth',D.no);}},
    state:function(){return {z:z,undercut:G&&G.undercut,zmin:G&&G.zmin,step:step};}};
  var inp=$('#tooth-z');if(inp)inp.addEventListener('input',function(){setZ(+inp.value);});
})();
})();

/* ---------- 9 the wrist: Fusion's own parts, posed the way Fusion poses them ---------- */
(function(){var s=DK.$('#s-wrist');if(!s||!window.MACHINES||!MACHINES.wrist)return;var D=DR,PI=Math.PI,H=DK.hooks;
  var V=null,L=D.layer(s,3),step=0,p=0,r=0,ex=0,tP=0,tR=0,tE=0,clock=0;
  function ensure(){if(!V){V=MV.make(s,'wrist',{x:1270,y:460,w:900,h:780,scale:3.1,explode:.16,yaw:-.62,tilt:.38,colours:{'Frame':0xd6cfbd,'Carrier':0xb9cbe0,'Roll output':0xe8c77e,'Input drive':0xd9a98f,'Motor output':0xa9c7ae}}).build();}}
  function motors(pp,rr){return [2*pp-2*rr,2*pp+2*rr];}
  H['s-wrist']={enter:function(){ensure();clock=0;},step:function(n){step=n;tE=n===1?1:0;tP=n>=2?30:0;tR=n>=3?45:0;if(DK.STATIC){ex=tE;p=tP;r=tR;}},
    frame:function(t,dt){ensure();clock+=dt;var sp=dt*1.6;ex+=D.clamp(tE-ex,-sp,sp);p+=D.clamp(tP-p,-dt*16,dt*16);r+=D.clamp(tR-r,-dt*20,dt*20);
      V.yaw=-.62+(DK.STATIC?0:Math.sin(clock*.25)*.12);V.pose(p,r,D.ease(ex));V.render();
      var g=L.begin(),lab=[['Frame',0,'frame','holds both motors'],['Carrier',0,'carrier','tilts: the pitch'],['Roll output',0,'roll output','spins: the roll'],
        ['Input drive',0,'side gear L',''],['Motor output',0,'motor L','belt 2 : 1'],['Motor output',1,'motor R','']];
      var spots=[[1590,400],[1590,150],[1590,270],[880,520],[880,760],[1590,560]];
      lab.forEach(function(l,i){var w=V.where(l[0],l[1]);if(!w)return;if(step===1||i<3)D.leader(g,w[0],w[1],spots[i][0],spots[i][1],l[2],l[3],i===2?D.judge:i===1?D.model:D.ink);});
      var m=motors(p,r),ro=DK.$('#wr-read');if(ro)ro.innerHTML='<div><span>tilt</span><b>'+p.toFixed(0)+'°</b></div><div><span>roll</span><b>'+r.toFixed(0)+'°</b></div><div class="m"><span>motor L</span><b>'+m[0].toFixed(0)+'°</b></div><div class="m"><span>motor R</span><b>'+m[1].toFixed(0)+'°</b></div>';},
    state:function(){return {pitch:p,roll:r,ex:ex,motors:motors(p,r)};}};
})();
