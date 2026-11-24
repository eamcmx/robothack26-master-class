/* Films on the sheets, with real controls.
   - Every film has the browser's own player bar: play, pause, scrub, full screen. Click the picture to pause or play.
   - Keys while a film's sheet is shown: K pauses or plays, J goes back 5 s, L forward 5 s, R plays it again from the
     start. Arrows, Page Up/Down and the clicker still move the sheets; Space still does nothing (the talk key).
   - A film with data-play waits at its first frame and starts, filling the sheet, on the click that reaches that step;
     the next click puts it back in its frame. Going back before that step stops and rewinds it.
   - A film with data-loop plays muted, round and round, from the moment its sheet is shown.
   - In ?static every film shows its last frame (screenshots and tests). */
(function(){
'use strict';
var H=DK.hooks;
function play(v){var p=v.play();if(p&&p.catch)p.catch(function(){});}
DK.$$('video.film').forEach(function(v){
  v.controls=true;v.tabIndex=-1;
  v.addEventListener('focus',function(){v.blur();});          /* arrow keys stay with the deck, not the player */
  v.addEventListener('keydown',function(e){e.stopPropagation();});
});
DK.$$('.sheet').forEach(function(s){
  var vids=DK.$$('video.film',s);if(!vids.length)return;
  var own=H[s.id]||{},enter=own.enter,step=own.step,leave=own.leave,okey=own.key;
  function atEnd(v){var go=function(){try{v.currentTime=Math.max(0,v.duration-0.2);}catch(e){}};if(v.readyState>=1)go();else v.addEventListener('loadedmetadata',go,{once:true});}
  function set(k){vids.forEach(function(v){
    var fig=v.closest('figure');
    if(DK.STATIC){v.pause();atEnd(v);if(fig)fig.classList.remove('big');return;}
    if(v.dataset.loop!=null){v.muted=true;v.loop=true;play(v);return;}
    var at=+(v.dataset.play||1);
    if(fig)fig.classList.toggle('big',k===at);
    if(k===at){if(v.ended){v.currentTime=0;}if(v.paused&&!v.dataset.held)play(v);}
    else if(k<at){v.pause();try{v.currentTime=0;}catch(e){}}
    v.dataset.held='';});}
  function main(){return vids.filter(function(v){return v.dataset.loop==null;})[0]||vids[0];}
  H[s.id]={enter:function(k){if(enter)enter(k);set(k||0);},
    step:function(k){if(step)step(k);set(k);},
    leave:function(){if(leave)leave();vids.forEach(function(v){v.pause();var f=v.closest('figure');if(f)f.classList.remove('big');});},
    key:function(k){var v=main();if(!v)return okey?okey(k):false;k=k.toLowerCase();
      if(k==='k'){if(v.paused)play(v);else v.pause();return true;}
      if(k==='j'){v.currentTime=Math.max(0,v.currentTime-5);return true;}
      if(k==='l'){v.currentTime=Math.min(v.duration||0,v.currentTime+5);return true;}
      if(k==='r'){v.currentTime=0;play(v);return true;}
      return okey?okey(k):false;},
    frame:own.frame,resize:own.resize};
});
DK.films=function(){return DK.$$('video.film').map(function(v){var f=v.closest('figure');return {src:v.getAttribute('src'),t:v.currentTime,paused:v.paused,ended:v.ended,dur:v.duration,big:!!(f&&f.classList.contains('big')),controls:v.controls};});};
})();
