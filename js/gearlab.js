/* Spur gears made the way a gear-cutting machine makes them: a straight-sided rack cutter rolls on the gear's pitch
   circle and cuts away everything it passes through. The involute flanks and, with too few teeth, the undercut at
   the tooth's foot come out of the cutting by themselves; nothing here draws an involute.
   Sizes as in the book's gear-pair prompt: module m, pressure angle alpha, tip radius r + m, root radius r - 1.25 m,
   tooth thickness on the pitch circle pi m / 2 - backlash / 2. Lengths in mm. */
(function(){
'use strict';
var GL=window.GL={},PI=Math.PI;

/* the cutter: tooth k's outline in the rack's own frame (x along the pitch line, y up into the gear, mm) */
function rackTooth(m,alpha,backlash,x0,hTop){var s=PI*m/2+backlash/2,ta=Math.tan(alpha),hBot=-m-.5;hTop=hTop==null?1.25*m:hTop;
  return [[x0-s/2+hBot*ta,hBot],[x0-s/2+hTop*ta,hTop],[x0+s/2-hTop*ta,hTop],[x0+s/2-hBot*ta,hBot]];}
GL.rackTooth=rackTooth;

/* a gear blank and its cutting, done in steps so that it can be watched */
GL.make=function(z,o){o=o||{};var m=o.m||2,alpha=(o.alpha==null?20:o.alpha)*PI/180,bl=o.backlash==null?.2:o.backlash,S=o.S||10;
  var r=m*z/2,hTop=o.hTop==null?1.25*m:o.hTop,ra=o.tip==null?r+m:o.tip,rf=r-hTop,rb=r*Math.cos(alpha),R=Math.ceil((ra+1)*S),N=2*R;
  var c=document.createElement('canvas');c.width=c.height=N;var g=c.getContext('2d');
  g.translate(R,R);g.scale(S,-S);                                            // gear frame: mm, y up, centre in the middle
  g.fillStyle='#000';g.beginPath();g.arc(0,0,ra,0,2*PI);g.fill();
  if(o.bore){g.globalCompositeOperation='destination-out';g.beginPath();g.arc(0,0,o.bore/2,0,2*PI);g.fill();}
  g.globalCompositeOperation='destination-out';
  var G={z:z,m:m,alpha:alpha,backlash:bl,r:r,ra:ra,rf:rf,rb:rb,S:S,R:R,mask:c,phi:-PI-.3,done:false,
    zmin:2/Math.pow(Math.sin(alpha),2),undercut:z<2/Math.pow(Math.sin(alpha),2)};
  var p=PI*m,dphi=.06*m/r;                                                    // the rack moves 0.06 m per step
  /* cut from the current angle up to phi1. The gear turns by phi, the rack slides by r phi under it. */
  G.cut=function(phi1){phi1=Math.min(phi1,PI+.3);while(G.phi<phi1){G.phi+=dphi;var ph=G.phi,sh=r*ph,k0=Math.floor((-sh-3*p)/p),k1=Math.ceil((-sh+3*p)/p);
      g.save();g.rotate(-ph);for(var k=k0;k<=k1;k++){var t=rackTooth(m,alpha,bl,sh+k*p,hTop);g.beginPath();g.moveTo(t[0][0],t[0][1]-r);
        for(var i=1;i<4;i++)g.lineTo(t[i][0],t[i][1]-r);g.closePath();g.fill();}g.restore();}
    if(G.phi>=PI+.3)G.done=true;G.ink=null;return G;};
  G.finish=function(){return G.cut(99);};
  return G;};

/* the gear's outline as a thin line, made from its cut mask once it is finished */
GL.ink=function(G,col,w){if(G.ink&&G.inkCol===col)return G.ink;var N=G.mask.width,c=document.createElement('canvas');c.width=c.height=N;var g=c.getContext('2d');
  w=w||Math.max(1.5,G.S*.16);g.drawImage(G.mask,0,0);
  var e=document.createElement('canvas');e.width=e.height=N;var h=e.getContext('2d');h.drawImage(G.mask,0,0);h.globalCompositeOperation='destination-in';
  for(var a=0;a<8;a++){h.drawImage(G.mask,Math.cos(a*PI/4)*w,Math.sin(a*PI/4)*w);}
  g.globalCompositeOperation='destination-out';g.drawImage(e,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col||'#1b1f24';g.fillRect(0,0,N,N);
  G.ink=c;G.inkCol=col;return c;};

/* draw a gear (mask tinted, then its outline) at (x, y) in the target's own units, turned by th (rad, anticlockwise) */
GL.draw=function(ctx,G,x,y,th,k,fill,line){var N=G.mask.width,s=k/G.S;ctx.save();ctx.translate(x,y);ctx.rotate(-th);ctx.scale(s,s);
  if(fill){var t=GL._tint||(GL._tint=document.createElement('canvas'));t.width=t.height=N;var tg=t.getContext('2d');tg.clearRect(0,0,N,N);tg.drawImage(G.mask,0,0);
    tg.globalCompositeOperation='source-in';tg.fillStyle=fill;tg.fillRect(0,0,N,N);tg.globalCompositeOperation='source-over';ctx.drawImage(t,-N/2,-N/2);}
  if(line)ctx.drawImage(GL.ink(G,line),-N/2,-N/2);ctx.restore();};

/* the area where two gears overlap, in mm2: gear 1 at the origin turned th1, gear 2 at (a, 0) turned th2.
   Both masks must have the same S. Returns the area and a canvas of the overlap (for drawing it red). */
GL.overlap=function(G1,G2,a,th1,th2){var S=G1.S,x0=-G1.ra-1,x1=a+G2.ra+1,y0=-Math.max(G1.ra,G2.ra)-1,W=Math.ceil((x1-x0)*S),H=Math.ceil(-2*y0*S);
  var c=GL._ov||(GL._ov=document.createElement('canvas'));c.width=W;c.height=H;var g=c.getContext('2d');g.clearRect(0,0,W,H);
  function put(G,cx,th){var N=G.mask.width;g.save();g.translate((cx-x0)*S,-y0*S);g.rotate(-th);g.drawImage(G.mask,-N/2,-N/2);g.restore();}
  put(G2,a,th2);g.globalCompositeOperation='source-in';put(G1,0,th1);g.globalCompositeOperation='source-over';
  var d=g.getImageData(0,0,W,H).data,n=0;for(var i=3;i<d.length;i+=4)if(d[i]>127)n++;
  return {area:n/(S*S),canvas:c,x0:x0,y0:y0,S:S};};

/* the angle gear 2 must be turned so that a tooth of gear 1 on the line of centres sits in a gap of gear 2
   (the book's prompt: "the driven gear is turned so that a tooth of the driver sits in a gap of the driven gear") */
GL.meshPhase=function(z1,z2){return PI-PI/z2;};
/* the angle a tooth of a cut gear points at when it is drawn unturned; to point tooth 0 at angle a, turn it by a - toothAt(G) */
GL.toothAt=function(G){return -PI/2+PI/G.z;};
/* an internal (ring) gear, as the book's planetary prompt makes it: an annulus from the teeth's tips (r - m) out to
   r + 1.25 m + wall, with tooth SPACES shaped like the teeth of an outside gear of z teeth whose tip is r + 1.25 m,
   root r - m and thickness pi m / 2 + backlash / 2 */
GL.ring=function(z,o){o=o||{};var m=o.m||2,S=o.S||10,bl=o.backlash==null?.2:o.backlash,wall=o.wall==null?6:o.wall,r=m*z/2,Ro=r+1.25*m+wall;
  var sp=GL.make(z,{m:m,S:S,backlash:-bl,tip:r+1.25*m,hTop:m,alpha:o.alpha}).finish();
  var R=Math.ceil((Ro+1)*S),N=2*R,c=document.createElement('canvas');c.width=c.height=N;var g=c.getContext('2d');
  g.fillStyle='#000';g.beginPath();g.arc(R,R,Ro*S,0,2*PI);g.fill();g.globalCompositeOperation='destination-out';
  var M=sp.mask.width;g.drawImage(sp.mask,R-M/2,R-M/2);
  return {z:z,m:m,S:S,R:R,mask:c,r:r,ra:Ro,rf:r-m,inner:true,space:sp};};
/* overlap of two gears placed anywhere: (x, y) of each centre in mm, th its turn (rad) */
GL.overlapAt=function(G1,x1,y1,th1,G2,x2,y2,th2){var S=G1.S,pad=1,
  bx0=Math.min(x1-G1.ra,x2-G2.ra)-pad,bx1=Math.max(x1+G1.ra,x2+G2.ra)+pad,by0=Math.min(y1-G1.ra,y2-G2.ra)-pad,by1=Math.max(y1+G1.ra,y2+G2.ra)+pad;
  var ix0=Math.max(x1-G1.ra,x2-G2.ra)-pad,ix1=Math.min(x1+G1.ra,x2+G2.ra)+pad,iy0=Math.max(y1-G1.ra,y2-G2.ra)-pad,iy1=Math.min(y1+G1.ra,y2+G2.ra)+pad;
  if(ix1<=ix0||iy1<=iy0)return {area:0};
  var W=Math.ceil((ix1-ix0)*S),Hh=Math.ceil((iy1-iy0)*S),c=GL._ov2||(GL._ov2=document.createElement('canvas'));c.width=W;c.height=Hh;var g=c.getContext('2d');g.clearRect(0,0,W,Hh);
  function put(G,cx,cy,th){var N=G.mask.width;g.save();g.translate((cx-ix0)*S,(iy1-cy)*S);g.rotate(-th);g.drawImage(G.mask,-N/2,-N/2);g.restore();}
  put(G2,x2,y2,th2);g.globalCompositeOperation='source-in';put(G1,x1,y1,th1);g.globalCompositeOperation='source-over';
  var d=g.getImageData(0,0,W,Hh).data,n=0;for(var i=3;i<d.length;i+=4)if(d[i]>127)n++;return {area:n/(S*S),canvas:c,x0:ix0,y1:iy1,S:S};};
})();
