/* Drawing helpers for the sheets: a canvas the size of the sheet, sharp at any screen size, and the line types of an
   engineering drawing (continuous thick, thin, chain for centre lines and pitch circles, dashed for hidden lines). */
(function(){
'use strict';
var D=window.DR={},PI=Math.PI;
D.ink='#1b1f24';D.ink2='#4a4f57';D.faint='#8a8576';D.model='#1c5fb8';D.judge='#c2410c';D.ok='#2b7a3d';D.no='#c92a2a';D.paper='#f2eee3';D.paper2='#e4ddcb';
/* a canvas over the whole sheet; draw in sheet pixels (1920 x 1080) */
D.layer=function(sheet,z){var c=document.createElement('canvas');c.className='layer';if(z!=null)c.style.zIndex=z;sheet.insertBefore(c,sheet.firstChild);
  var L={c:c,g:c.getContext('2d'),k:1};
  L.size=function(){var s=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s'))||1,dpr=Math.min(2,window.devicePixelRatio||1),k=Math.max(.5,s*dpr);
    if(Math.abs(k-L.k)>.01||c.width!==Math.round(1920*k)){L.k=k;c.width=Math.round(1920*k);c.height=Math.round(1080*k);}return L;};
  L.begin=function(){L.size();var g=L.g;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.setTransform(L.k,0,0,L.k,0,0);return g;};
  return L;};
D.line=function(g,type,w,col){g.strokeStyle=col||D.ink;g.lineWidth=w||1.4;
  g.setLineDash(type==='chain'?[22,5,3,5]:type==='dash'?[9,6]:type==='dot'?[2,5]:[]);};
D.circle=function(g,x,y,r,type,w,col){D.line(g,type,w,col);g.beginPath();g.arc(x,y,r,0,2*PI);g.stroke();g.setLineDash([]);};
D.seg=function(g,x0,y0,x1,y1,type,w,col){D.line(g,type,w,col);g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.setLineDash([]);};
D.cross=function(g,x,y,L){D.seg(g,x-L,y,x+L,y,'chain',1.1,D.ink2);D.seg(g,x,y-L,x,y+L,'chain',1.1,D.ink2);};
D.arrow=function(g,x0,y0,x1,y1,col,w){D.seg(g,x0,y0,x1,y1,null,w||1.4,col);var a=Math.atan2(y1-y0,x1-x0),h=14;g.fillStyle=col||D.ink;g.beginPath();g.moveTo(x1,y1);
  g.lineTo(x1-h*Math.cos(a-.22),y1-h*Math.sin(a-.22));g.lineTo(x1-h*Math.cos(a+.22),y1-h*Math.sin(a+.22));g.closePath();g.fill();};
/* a dimension line between two points with its text, offset to one side */
D.dim=function(g,x0,y0,x1,y1,off,text,col){col=col||D.ink;var a=Math.atan2(y1-y0,x1-x0),nx=-Math.sin(a),ny=Math.cos(a),ax=x0+nx*off,ay=y0+ny*off,bx=x1+nx*off,by=y1+ny*off;
  D.seg(g,x0,y0,ax+nx*8,ay+ny*8,null,1,col);D.seg(g,x1,y1,bx+nx*8,by+ny*8,null,1,col);D.arrow(g,(ax+bx)/2,(ay+by)/2,ax,ay,col,1.2);D.arrow(g,(ax+bx)/2,(ay+by)/2,bx,by,col,1.2);
  g.save();g.translate((ax+bx)/2+nx*16,(ay+by)/2+ny*16);var r=a;while(r>PI/2-1e-6)r-=PI;while(r<=-PI/2-1e-6)r+=PI;g.rotate(r);D.text(g,text,0,0,'600 24px',col,'center');g.restore();};
D.text=function(g,t,x,y,font,col,align,base){g.font=(font||'600 22px')+' Bahnschrift, "DIN Alternate", "Arial Narrow", sans-serif';g.fillStyle=col||D.ink;g.textAlign=align||'left';g.textBaseline=base||'middle';g.fillText(t,x,y);};
/* a leader: a line from a point on the drawing to a note, with a dot at the point */
D.leader=function(g,px,py,tx,ty,text,sub,col){col=col||D.ink;g.fillStyle=col;g.beginPath();g.arc(px,py,4,0,2*PI);g.fill();var right=tx>=px;
  D.seg(g,px,py,tx,ty,null,1.2,col);D.seg(g,tx,ty,tx+(right?26:-26),ty,null,1.2,col);D.text(g,text,tx+(right?34:-34),ty-(sub?12:0),'600 23px',col,right?'left':'right');
  if(sub)D.text(g,sub,tx+(right?34:-34),ty+15,'400 19px',D.ink2,right?'left':'right');};
/* hatch a path region with 45 degree section lines (call after building the path) */
D.hatch=function(g,x0,y0,x1,y1,step,col){g.save();g.clip();D.line(g,null,1,col||D.ink2);g.beginPath();for(var t=x0-(y1-y0);t<x1;t+=step){g.moveTo(t,y1);g.lineTo(t+(y1-y0),y0);}g.stroke();g.restore();};
D.ease=function(k){k=Math.max(0,Math.min(1,k));return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;};
D.clamp=function(x,a,b){return Math.max(a,Math.min(b,x));};
})();
