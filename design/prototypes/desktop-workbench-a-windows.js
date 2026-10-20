// A separate animation layer keeps window transforms away from live form layout.
const popupFlights = new WeakMap();
function cancelPopupFlight(surface) {
  const flight = popupFlights.get(surface);
  if (!flight) return;
  flight.animations.forEach(animation => animation.cancel());
  flight.layer.remove(); surface.style.opacity = ''; surface.style.pointerEvents = ''; popupFlights.delete(surface);
}
function popupSnapshot(surface, rect) {
  const clone = surface.cloneNode(true);
  [clone, ...clone.querySelectorAll('*')].forEach(node => {
    node.removeAttribute('id'); node.removeAttribute('autofocus');
    node.removeAttribute('aria-labelledby'); node.removeAttribute('aria-describedby');
  });
  const originalFields = surface.querySelectorAll('input,textarea,select');
  clone.querySelectorAll('input,textarea,select').forEach((field,index) => {
    field.value = originalFields[index].value;
    if ('checked' in field) field.checked = originalFields[index].checked;
  });
  Object.assign(clone.style, {position:'absolute', left:'0', top:'0', right:'auto', bottom:'auto', margin:'0', width:rect.width+'px', height:rect.height+'px', maxHeight:'none', transform:'none', transition:'none', animation:'none', visibility:'visible', opacity:'1', display:surface.id==='drawer'?'flex':'block'});
  clone.inert = true; clone.setAttribute('aria-hidden','true');
  const scroll = surface.querySelector('.drawer-body,.search-results');
  const clonedScroll = clone.querySelector('.drawer-body,.search-results');
  if (scroll && clonedScroll) clonedScroll.scrollTop = scroll.scrollTop;
  return clone;
}
function animatePopup(surface, trigger, opening = true, originOverride = null) {
  cancelPopupFlight(surface);
  const rect=surface.getBoundingClientRect(), origin=originOverride || (trigger?.isConnected?trigger.getBoundingClientRect():null);
  if (reducedMotion() || !usableDragRect(rect) || !usableDragRect(origin) || !surface.animate) return;
  const layer = document.createElement('div'); layer.className='genie-flight'; layer.inert=true; layer.setAttribute('aria-hidden','true');
  const snapshot=popupSnapshot(surface,rect), count=14, height=rect.height/count;
  const flight={layer,animations:[]}; popupFlights.set(surface,flight);
  const smooth = value => value*value*(3-2*value);
  const fromX=origin.left+origin.width/2, fromY=origin.top+origin.height/2;
  const targetX=rect.left+rect.width/2, sourceScale=Math.min(.5,origin.width/rect.width);
  for(let index=0;index<count;index++) {
    const strip=document.createElement('div'), content=snapshot.cloneNode(true), t=(index+.5)/count;
    strip.className='genie-strip'; strip.style.width=rect.width+'px'; strip.style.height=(height+.6)+'px';
    content.style.top=(-index*height)+'px'; strip.appendChild(content); layer.appendChild(strip);
    const frames=Array.from({length:19},(_,step)=>{
      const phase=step/18, p=opening?phase:1-phase;
      const far=fromY<rect.top+rect.height/2?t:1-t;
      const delay=.26*(1-far), stretch=smooth(Math.max(0,Math.min(1,(p-delay)/(1-delay))));
      const spread=smooth(p), sx=sourceScale+(1-sourceScale)*stretch;
      const sy=origin.height/rect.height+(1-origin.height/rect.height)*spread;
      const cx=fromX+(targetX-fromX)*stretch;
      const cy=fromY+(t-.5)*origin.height+(rect.top+t*rect.height-fromY-(t-.5)*origin.height)*spread;
      return {transform:`translate(${cx-rect.width/2}px,${cy-height/2}px) scale(${sx},${sy})`,opacity:Math.min(1,p*6),offset:phase};
    });
    // WAAPI animations belong only to the disposable strips; live inputs stay in place.
    const animation=strip.animate(frames,{duration:opening?540:390,easing:'linear',fill:'both'});
    flight.animations.push(animation);
  }
  document.body.appendChild(layer);
  const originalScroll=surface.querySelector('.drawer-body,.search-results');
  if(originalScroll)layer.querySelectorAll('.drawer-body,.search-results').forEach(node=>node.scrollTop=originalScroll.scrollTop);
  if(opening){surface.style.opacity='0';surface.style.pointerEvents='none';}
  Promise.all(flight.animations.map(animation=>Promise.resolve(animation.finished).catch(()=>{}))).then(()=>{
    if(popupFlights.get(surface)!==flight)return;
    layer.remove();surface.style.opacity='';surface.style.pointerEvents='';popupFlights.delete(surface);
  });
}
function setWindowPresentation(mode) {
  const surface=$('drawer');
  surface.dataset.windowMode=mode;
  surface.classList.toggle('form-window',['create','createChild','record','editLog','reschedule'].includes(mode));
  surface.classList.toggle('gantt-window',mode==='gantt');
}
function toggleTaskSearch(open = !$('searchPopover').classList.contains('open')) {
  const surface=$('searchPopover'),trigger=$('searchTrigger');
  if(open){
    surface.classList.add('open');renderSearch();animatePopup(surface,trigger,true);$('searchInput').focus();
  }else if(surface.classList.contains('open')){
    animatePopup(surface,trigger,false);surface.classList.remove('open');
  }else cancelPopupFlight(surface);
  trigger.setAttribute('aria-expanded',String(open));
}
let pendingConfirmation = null;
function askConfirmation(message, trigger = document.activeElement, actionLabel = '放弃更改') {
  if(pendingConfirmation)return pendingConfirmation.promise;
  const surface=$('confirmationWindow'),backdrop=$('confirmationOverlay');
  const surfaces=[document.querySelector('.shell'),$('calendarStage'),$('drawer'),$('searchPopover')];
  const previous=surfaces.map(node=>({node,inert:node.inert})),overflow=document.body.style.overflow;
  let resolve;const promise=new Promise(done=>resolve=done);
  pendingConfirmation={promise};
  $('confirmationMessage').textContent=message;$('confirmAccept').textContent=actionLabel;
  surface.hidden=false;backdrop.hidden=false;surface.inert=false;
  previous.forEach(({node})=>node.inert=true);document.body.style.overflow='hidden';
  animatePopup(surface,trigger,true);$('confirmCancel').focus();
  function finish(accepted){
    if(!pendingConfirmation)return;
    animatePopup(surface,trigger,false);surface.hidden=true;surface.inert=true;backdrop.hidden=true;
    previous.forEach(({node,inert})=>node.inert=inert);document.body.style.overflow=overflow;
    document.removeEventListener('keydown',onKey,true);pendingConfirmation=null;
    if(trigger?.isConnected && !trigger.closest('[inert]'))trigger.focus();
    resolve(accepted);
  }
  function onKey(event){
    event.stopImmediatePropagation();
    if(event.key==='Escape'){event.preventDefault();finish(false);}
    if(event.key==='Tab'){event.preventDefault();(document.activeElement===$('confirmCancel')?$('confirmAccept'):$('confirmCancel')).focus();}
  }
  $('confirmAccept').onclick=()=>finish(true);$('confirmCancel').onclick=()=>finish(false);backdrop.onclick=()=>finish(false);
  document.addEventListener('keydown',onKey,true);
  return promise;
}
function capturePopupReturn(trigger) {
  if(!trigger)return null;
  const scope=trigger.closest('.page,#calendarStage,#searchPopover');
  const key=['gantt','openTask','cardRecord','openLog','createDay','newTask','newLog','planImpact','newChild'].find(name=>name in trigger.dataset);
  return {element:trigger,id:trigger.id,scopeId:scope?.id,key,value:key?trigger.dataset[key]:null,rect:trigger.getBoundingClientRect()};
}
function resolvePopupReturn(anchor) {
  if(!anchor)return null;
  if(anchor.element?.isConnected && !anchor.element.closest('[hidden]'))return anchor.element;
  if(anchor.id)return document.getElementById(anchor.id);
  const scope=anchor.scopeId?document.getElementById(anchor.scopeId):document;
  return anchor.key?[...scope?.querySelectorAll('button') || []].find(button=>button.dataset[anchor.key]===anchor.value && !button.closest('[hidden]')):null;
}
