/* The deck: sheets of a drawing, one at a time, on a 1920 x 1080 stage scaled to the screen.
   Keys for the talk: arrows, Page Up/Down and the clicker move; Space and Enter do nothing (Space is the talk key in
   the terminal); F full screen; n notes window with a clock; Shift+N notes under the sheet; O overview; a number and
   Enter jumps. The animation stops while another program has the keyboard. ?static freezes every animation (tests,
   screenshots), ?nopause keeps it running without the keyboard. */
(function(){
'use strict';
var DK=window.DK={},$=DK.$=function(s,r){return (r||document).querySelector(s);},$$=DK.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var root=document.documentElement,stage=$('#stage');
DK.STATIC=/[?&]static/.test(location.search);var NOPAUSE=DK.STATIC||/[?&]nopause/.test(location.search);
if(DK.STATIC)root.classList.add('static');
var sheets=$$('.sheet'),cur=-1,step=0,hooks=DK.hooks={},t0=null;
DK.count=sheets.length;

/* ---------- scale ---------- */
function fit(){var s=Math.min(innerWidth/1920,innerHeight/1080);root.style.setProperty('--s',s);for(var k in hooks)if(hooks[k].resize)hooks[k].resize(s);}
addEventListener('resize',fit);

/* ---------- steps ---------- */
function nsteps(s){if(s._n==null){var m=+(s.dataset.steps||0);$$('[data-st]',s).forEach(function(e){m=Math.max(m,+e.dataset.st);});s._n=m;}return s._n;}
function applyStep(k){step=k;var s=sheets[cur];$$('[data-st]',s).forEach(function(e){e.classList.toggle('on',+e.dataset.st<=k);});
  $$('[data-only]',s).forEach(function(e){e.classList.toggle('on',+e.dataset.only===k);});
  var h=hooks[s.id];if(h&&h.step)h.step(k);try{history.replaceState(null,'','#'+(cur+1)+(k?'.'+k:''));}catch(e){}pushNotes();}
function show(i,k){i=Math.max(0,Math.min(sheets.length-1,i));
  if(i!==cur){if(cur>=0){var o=sheets[cur];o.classList.remove('on');var ho=hooks[o.id];if(ho&&ho.leave)ho.leave();}
    cur=i;var s=sheets[i];s.classList.add('on');$('#sheetno').textContent=(i+1)+' / '+sheets.length;
    var h=hooks[s.id];if(h&&h.enter)h.enter(k||0);if(i>0&&t0===null)t0=Date.now();}
  applyStep(Math.max(0,Math.min(k||0,nsteps(sheets[cur]))));}
function next(){if(step<nsteps(sheets[cur]))applyStep(step+1);else if(cur<sheets.length-1)show(cur+1,0);}
function prev(){if(step>0)applyStep(step-1);else if(cur>0)show(cur-1,nsteps(sheets[cur-1]));}
DK.go=function(id,k){for(var i=0;i<sheets.length;i++)if(sheets[i].id===id||sheets[i].id==='s-'+id){show(i,k||0);return DK.state();}};
DK.state=function(){var s=sheets[cur];return {sheet:cur+1,step:step,steps:nsteps(s),id:s.id};};
DK.next=next;DK.prev=prev;DK.step=function(){return step;};DK.cur=function(){return sheets[cur].id;};

/* ---------- the loop: one requestAnimationFrame for every live drawing on the sheet in front ---------- */
var last=0,paused=false,raf=0;DK.t=0;
function frame(now){raf=0;if(paused)return;raf=requestAnimationFrame(frame);var t=now/1000,dt=Math.min(.05,Math.max(0,t-last));last=t;DK.t=t;
  var s=sheets[cur],h=s&&hooks[s.id];if(h&&h.frame)h.frame(t,DK.STATIC?0:dt);}
function setPaused(p){if(p===paused)return;paused=p;root.classList.toggle('paused',p);if(!p){last=performance.now()/1000;if(!raf)raf=requestAnimationFrame(frame);}}
function focusGone(){if(NOPAUSE)return;setTimeout(function(){var mine=false;try{mine=document.hasFocus()||(nw&&!nw.closed&&nw.document.hasFocus());}catch(e){}if(!mine)setPaused(true);},200);}
addEventListener('blur',focusGone);addEventListener('focus',function(){setPaused(false);});addEventListener('pointerdown',function(){setPaused(false);});
DK.paused=function(){return paused;};DK.setPaused=setPaused;
/* one drawing frame on demand, for ?static and for tests */
DK.draw=function(t){var s=sheets[cur],h=s&&hooks[s.id];if(h&&h.frame)h.frame(t==null?DK.t:t,0);};

/* ---------- notes ---------- */
var nw=null,inl=$('#inl');
function noteHTML(s){var n=s.querySelector('.notes');return n?n.innerHTML:'<p>No notes.</p>';}
function titleOf(s){var h=s.querySelector('h1,h2');if(!h)return '';var d=document.createElement('div');d.innerHTML=h.innerHTML.replace(/<br\s*\/?>/gi,' ');return d.textContent.replace(/\s+/g,' ').trim();}
function clock(){if(t0===null)return '0:00';var t=Math.floor((Date.now()-t0)/1000);return Math.floor(t/60)+':'+('0'+t%60).slice(-2);}
function markNow(root){if(!root)return;var first=null;[].forEach.call(root.querySelectorAll('p[data-k]'),function(p){var k=+p.dataset.k;p.classList.toggle('now',k===step);p.classList.toggle('past',k<step);if(k===step&&!first)first=p;});if(!first)return;if(root===inl){inl.scrollTop=Math.max(0,first.offsetTop-8);return;}try{first.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){}}
function pushNotes(){if(cur<0)return;var s=sheets[cur];
  if(inl.classList.contains('on'))inl.innerHTML='<b>'+(cur+1)+'. '+titleOf(s)+'</b> · minute '+(s.dataset.t||'?')+' · clock '+clock()+noteHTML(s);if(inl.classList.contains('on'))markNow(inl);
  if(!nw||nw.closed)return;var d=nw.document;d.getElementById('h').textContent=(cur+1)+' / '+sheets.length+'   '+titleOf(s);
  d.getElementById('st').textContent=nsteps(s)?'click '+step+' of '+nsteps(s):'';d.getElementById('pl').textContent='Planned: minute '+(s.dataset.t||'?');
  d.getElementById('n').innerHTML=noteHTML(s);markNow(d.getElementById('n'));d.getElementById('nx').textContent=cur<sheets.length-1?'Next: '+titleOf(sheets[cur+1]):'Last sheet';}
function openNotes(){nw=window.open('','dknotes','width=980,height=760');if(!nw)return;
  nw.document.write('<!doctype html><title>Notes</title><style>body{font:19px/1.5 Bahnschrift,Segoe UI,Arial,sans-serif;background:#f3efe4;color:#1b1f24;margin:0;padding:22px 30px}#top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #1b1f24;padding-bottom:10px;margin-bottom:14px}#h{font-size:25px;font-weight:700}#ck{font-size:42px;font-weight:700;color:#c2410c;font-variant-numeric:tabular-nums}#pl,#st{color:#6b6458;font-size:17px}#n p{margin:0 0 12px}#top{position:sticky;top:0;background:#f3efe4;z-index:2;padding-top:12px}#n p{scroll-margin-top:120px}#n p[data-k]{padding:6px 10px;border-left:5px solid transparent;border-radius:4px}#n p.now{background:#fff3c4;border-left-color:#c2410c}#n p.past{color:#8a8375}#n p.src,#n p.live{font-size:16px;color:#6b6458}#n i{color:#6b6458}#n b{color:#c2410c}#nx{margin-top:18px;padding-top:12px;border-top:1px solid #b9b2a2;color:#1f5fbf;font-weight:700}button{font:inherit;margin-right:8px}</style><div id="top"><div><div id="h"></div><span id="pl"></span> <span id="st"></span></div><div id="ck">0:00</div></div><div id="n"></div><div id="nx"></div><p><button id="b1">Previous</button><button id="b2">Next</button><button id="b3">Restart clock</button></p>');
  nw.document.close();nw.document.getElementById('b1').onclick=prev;nw.document.getElementById('b2').onclick=next;nw.document.getElementById('b3').onclick=function(){t0=Date.now();};
  nw.document.addEventListener('keydown',onKey);nw.addEventListener('blur',focusGone);nw.addEventListener('focus',function(){setPaused(false);});pushNotes();}
setInterval(function(){if(nw&&!nw.closed){var c=nw.document.getElementById('ck');if(c)c.textContent=clock();}},1000);

/* ---------- overview ---------- */
var grid=$('#grid');
function buildGrid(){grid.innerHTML='<p>Click a sheet, or press O or Esc.</p>'+sheets.map(function(s,i){return '<a data-i="'+i+'"'+(i===cur?' class="cur"':'')+'><b>'+(i+1)+'</b>'+titleOf(s)+'</a>';}).join('');}
grid.addEventListener('click',function(e){var a=e.target.closest('a');if(a){grid.classList.remove('on');show(+a.dataset.i,0);}});

/* ---------- keys, clicker, touch ---------- */
var jump='',jumpEl=$('#jump');
function onKey(e){var k=e.key,s=sheets[cur];if(e.ctrlKey||e.metaKey||e.altKey)return;if(paused)setPaused(false);
  if(e.target&&/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)&&!/^(PageDown|PageUp|Escape)$/.test(k))return;
  if(k===' '||k==='Enter'&&!jump){e.preventDefault();return;}
  if(k==='Escape'){grid.classList.remove('on');jump='';jumpEl.style.display='none';return;}
  if(/^[0-9]$/.test(k)){var h=hooks[s.id];if(h&&h.key&&h.key(k))return;jump+=k;jumpEl.textContent='Sheet '+jump+' (Enter)';jumpEl.style.display='block';return;}
  if(k==='Enter'&&jump){show(parseInt(jump,10)-1,0);jump='';jumpEl.style.display='none';return;}
  if(k==='ArrowRight'||k==='PageDown'||k==='ArrowDown'){e.preventDefault();next();}
  else if(k==='ArrowLeft'||k==='PageUp'||k==='ArrowUp'||k==='Backspace'){e.preventDefault();prev();}
  else if(k==='Home')show(0,0);else if(k==='End')show(sheets.length-1,0);
  else if(k==='f'||k==='F'){if(document.fullscreenElement)document.exitFullscreen();else if(root.requestFullscreen)root.requestFullscreen();}
  else if(k==='N'){inl.classList.toggle('on');pushNotes();}else if(k==='n')openNotes();
  else if(k==='o'||k==='O'){buildGrid();grid.classList.toggle('on');}
  else if(k==='t'||k==='T')t0=Date.now();
  else{var h2=hooks[s.id];if(h2&&h2.key)h2.key(k);}}
addEventListener('keydown',onKey);
var tx=null;addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});
addEventListener('touchend',function(e){if(tx===null)return;var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>70&&!e.target.closest('input,button,canvas.drag,video,figure.vp'))(dx<0?next:prev)();tx=null;},{passive:true});

/* ---------- start ---------- */
DK.start=function(){fit();sheets.forEach(function(s,i){var z=$('.zone',s);});
  var h=location.hash.slice(1).split('.');show((parseInt(h[0],10)||1)-1,parseInt(h[1],10)||0);
  DK.ready=true;if(!DK.STATIC)raf=requestAnimationFrame(frame);else DK.draw(0);};
})();
