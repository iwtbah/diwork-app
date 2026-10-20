let calendarMonth=null;
let selectedCalendarDay=null;
let calendarPresentation='landing';
let hasEnteredWorkspace=false;
let calendarTransition=null;
let paperTurn=null;
const calendarTurnQueue=[];
function planOccursOnDay(plan,key) {
  if(plan.type!=='recurring' || key<plan.start || key<TODAY || plan.endMode==='date' && key>plan.end)return false;
  if(['暂停','终止'].includes(plan.status) && (!plan.lastEffective || key>=plan.lastEffective))return false;
  const date=new Date(key+'T12:00:00');
  const matches=date=>{
    if(plan.cycle==='daily')return true;
    if(plan.cycle==='weekly')return plan.weekdays.includes(date.getDay());
    const last=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
    const day=Number(plan.monthday)>last && plan.monthFallback==='last'?last:Number(plan.monthday);
    return date.getDate()===day;
  };
  if(!matches(date))return false;
  if(plan.endMode==='count'){
    let count=0;const cursor=new Date(plan.start+'T12:00:00');
    while(cursor<=date){if(matches(cursor))count++;if(count>plan.count)return false;cursor.setDate(cursor.getDate()+1);}
  }
  return true;
}
function calendarEntries(key) {
  const actual=tasks.filter(task=>(task.executionDate || task.dueDate)===key && task.status!=='已取消').map(task=>({kind:'task',task,key}));
  const previews=plans.filter(plan=>planOccursOnDay(plan,key) && !tasks.some(task=>task.planId===plan.id && (task.originalDate || task.executionDate)===key)).map(plan=>({kind:'preview',plan,key}));
  return [...actual,...previews];
}
function calendarEvent(entry) {
  if(entry.kind==='preview')return `<button class="month-event event-preview" data-plan="${entry.plan.id}" title="${escapeHtml(entry.plan.title)}，规则预览，尚未生成任务"><span>${escapeHtml(entry.plan.title)}</span><small>预览</small></button>`;
  const task=entry.task;
  return `<button class="month-event ${task.status==='已完成'?'event-complete':overdue(task)?'event-overdue':''}" data-open-task="${task.id}" title="${escapeHtml(task.title)}，${task.status}"><span>${task.startTime || (!task.executionDate?'到期':'')}${task.startTime?' ':''}${escapeHtml(task.title)}</span></button>`;
}
function renderMonthCalendar() {
  if(!calendarMonth)calendarMonth=new Date(TODAY+'T12:00:00');
  if(!selectedCalendarDay)selectedCalendarDay=TODAY;
  const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();
  $('calendarYear').textContent=year+' 年';$('calendarMonthNumber').textContent=String(month+1).padStart(2,'0');
  $('calendarMonthTitle').textContent=['一','二','三','四','五','六','七','八','九','十','十一','十二'][month]+'月工作日历';
  $('prevMonth').setAttribute('aria-label',`${month===0?year-1:year}年${month===0?12:month}月`);
  $('nextMonth').setAttribute('aria-label',`${month===11?year+1:year}年${month===11?1:month+2}月`);
  const first=new Date(year,month,1,12),offset=(first.getDay()+6)%7,last=new Date(year,month+1,0).getDate(),cells=42;
  $('monthGrid').innerHTML=Array.from({length:cells},(_,index)=>{
    const date=new Date(year,month,index-offset+1,12),key=dateKey(date),outside=date.getMonth()!==month,entries=calendarEntries(key);
    return `<div role="gridcell" class="calendar-day ${outside?'outside-month':''} ${key===TODAY?'calendar-today':''} ${key===selectedCalendarDay?'calendar-selected':''}"><button class="date-select" data-calendar-day="${key}" aria-label="${key}${key===TODAY?'，今天':''}，${entries.length}项安排" aria-pressed="${key===selectedCalendarDay}"><span>${date.getDate()}</span>${key===TODAY?'<small>今天</small>':''}</button><div class="calendar-day-events">${entries.slice(0,2).map(calendarEvent).join('')}${entries.length>2?`<button class="calendar-more" data-calendar-day="${key}">还有 ${entries.length-2} 项</button>`:''}</div></div>`;
  }).join('');
  renderDayAgenda();updateCalendarDock();
}
function renderDayAgenda() {
  const date=new Date(selectedCalendarDay+'T12:00:00'),entries=calendarEntries(selectedCalendarDay);
  const actual=entries.filter(entry=>entry.kind==='task');
  $('dayAgenda').innerHTML=`<div class="agenda-date"><span>${shortDate(selectedCalendarDay)} · 星期${'日一二三四五六'[date.getDay()]}</span><strong>${date.getDate()}</strong><p>${selectedCalendarDay===TODAY?'今天的安排':'当天工作安排'}<small>${actual.length} 项任务${entries.length>actual.length?' / '+(entries.length-actual.length)+' 项预览':''}</small></p></div><div class="agenda-events">${entries.length?entries.map(entry=>entry.kind==='task'?`<button class="agenda-entry" data-open-task="${entry.task.id}"><span class="agenda-time">${entry.task.startTime || (!entry.task.executionDate?'到期':'全天')}</span><span class="agenda-entry-main"><strong>${escapeHtml(entry.task.title)}</strong><small>${entry.task.status} · ${entry.task.priority}</small></span></button>`:`<button class="agenda-entry agenda-preview" data-plan="${entry.plan.id}"><span class="agenda-time">${entry.plan.time || '全天'}</span><span class="agenda-entry-main"><strong>${escapeHtml(entry.plan.title)}</strong><small>规则预览 · 尚未生成任务</small></span></button>`).join(''):'<div class="agenda-empty">当天没有工作安排。<br>留一些空间，或安排一项工作。</div>'}</div><button class="agenda-add" data-create-day="${selectedCalendarDay}">${icon('plus','icon-sm')}在这一天安排任务</button>`;
}
function selectCalendarDay(key) {
  selectedCalendarDay=key;const date=new Date(key+'T12:00:00');
  if(date.getMonth()!==calendarMonth.getMonth() || date.getFullYear()!==calendarMonth.getFullYear())calendarMonth=new Date(date.getFullYear(),date.getMonth(),1,12);
  renderMonthCalendar();
  document.querySelector(`.date-select[data-calendar-day="${key}"]`)?.focus();
}
function updateCalendarDock(){
  const date=calendarMonth || new Date(TODAY+'T12:00:00');
  document.querySelectorAll('[data-dock-year]').forEach(node=>node.textContent=date.getFullYear());
  document.querySelectorAll('[data-dock-month]').forEach(node=>node.textContent=String(date.getMonth()+1).padStart(2,'0'));
  $('calendarDock').setAttribute('aria-label',`展开${date.getFullYear()}年${date.getMonth()+1}月工作日历`);
}
function calendarIsOpen(){return !$('calendarStage').hidden;}
function syncSurfaceInert(){
  const drawerOpen=$('drawer').classList.contains('open'),calendarOpen=calendarIsOpen();
  document.querySelector('.shell').inert=drawerOpen || calendarOpen;
  $('calendarStage').inert=drawerOpen || Boolean(calendarTransition);
  document.body.style.overflow=drawerOpen || calendarOpen?'hidden':'';
}
function snapshotCalendar(node){
  const copy=node.cloneNode(true);copy.removeAttribute('id');copy.removeAttribute('aria-labelledby');
  copy.querySelectorAll('[id]').forEach(child=>child.removeAttribute('id'));
  copy.querySelectorAll('[aria-live]').forEach(child=>child.removeAttribute('aria-live'));
  copy.setAttribute('aria-hidden','true');copy.inert=true;return copy;
}
function finishCalendarPageTurn(processQueue=true){
  const state=paperTurn;
  if(state){cancelAnimationFrame(state.frame);state.sheet.remove();state.underlay?.remove();paperTurn=null;$('calendarBook').removeAttribute('aria-busy');}
  if(processQueue && calendarTurnQueue.length)runCalendarMonthMove(calendarTurnQueue.shift());
}
function calendarPaperFrame(time){
  const state=paperTurn;if(!state)return;
  if(state.start===null)state.start=time;
  const t=Math.min(1,(time-state.start)/680),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const progress=state.direction>0?ease:1-ease;
  let y=0,z=0;
  state.strips.forEach((strip,index)=>{
    const bend=Math.sin(Math.PI*progress)*.24*index/(state.strips.length-1),theta=Math.min(1,progress+bend)*Math.PI;
    strip.style.transform=`translate3d(0,${y}px,${z}px) rotateX(${theta*180/Math.PI}deg)`;
    strip.querySelector('.paper-strip-shade').style.opacity=String(Math.sin(theta)*.19);
    y+=state.segmentHeight*Math.cos(theta);z+=state.segmentHeight*Math.sin(theta);
  });
  state.sheet.style.opacity=String(t>.9?(1-t)/.1:1);
  if(t>=1){finishCalendarPageTurn();return;}
  state.frame=requestAnimationFrame(frame=>{if(paperTurn===state)calendarPaperFrame(frame);});
}
function moveCalendarMonth(direction){
  if(calendarTransition)return;
  if(paperTurn){if(direction===0)calendarTurnQueue.length=0;if(calendarTurnQueue.length<6)calendarTurnQueue.push(direction);return;}
  runCalendarMonthMove(direction);
}
function runCalendarMonthMove(direction){
  const surface=$('calendarPageSurface'),oldSnapshot=snapshotCalendar(surface),rect=surface.getBoundingClientRect();
  const oldKey=calendarMonth.getFullYear()*12+calendarMonth.getMonth(),today=new Date(TODAY+'T12:00:00');
  if(!direction){calendarMonth=new Date(today.getFullYear(),today.getMonth(),1,12);selectedCalendarDay=TODAY;}
  else{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+direction,1,12);const day=Math.min(Number(selectedCalendarDay.slice(8,10)),new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate());selectedCalendarDay=dateKey(new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),day,12));}
  renderMonthCalendar();
  const newKey=calendarMonth.getFullYear()*12+calendarMonth.getMonth(),sign=newKey>=oldKey?1:-1;
  if(newKey===oldKey || reducedMotion() || !usableDragRect(rect)){if(calendarTurnQueue.length)runCalendarMonthMove(calendarTurnQueue.shift());return;}
  const book=$('calendarBook'),sheet=document.createElement('div'),count=8,segmentHeight=rect.height/count,strips=[];
  sheet.className='calendar-page-turn';sheet.setAttribute('aria-hidden','true');sheet.inert=true;
  const snapshot=sign>0?oldSnapshot:snapshotCalendar(surface);
  let underlay=null;
  if(sign<0){underlay=document.createElement('div');underlay.className='paper-turn-underlay';underlay.setAttribute('aria-hidden','true');underlay.inert=true;underlay.appendChild(oldSnapshot);book.appendChild(underlay);}
  for(let index=0;index<count;index++){
    const strip=document.createElement('div'),front=document.createElement('div'),back=document.createElement('div'),shade=document.createElement('div'),content=snapshot.cloneNode(true);
    strip.className='paper-strip';front.className='paper-strip-front';back.className='paper-strip-back';shade.className='paper-strip-shade';
    strip.style.width=rect.width+'px';strip.style.height=(segmentHeight+1)+'px';
    content.classList.add('paper-snapshot');content.style.width=rect.width+'px';content.style.height=rect.height+'px';content.style.transform=`translateY(${-index*segmentHeight}px)`;
    front.append(content,shade);strip.append(front,back);sheet.appendChild(strip);strips.push(strip);
  }
  book.appendChild(sheet);book.setAttribute('aria-busy','true');
  paperTurn={sheet,underlay,strips,segmentHeight,start:null,direction:sign,frame:0};calendarPaperFrame(performance.now());
}
function dismissCalendarImmediately(){
  calendarTurnQueue.length=0;finishCalendarPageTurn(false);
  const state=calendarTransition;calendarTransition=null;
  if(state){state.animations.forEach(animation=>animation.cancel());state.flight?.remove();}
  $('calendarStage').hidden=true;$('calendarStage').style.opacity='';$('calendarBook').classList.remove('calendar-in-flight');$('calendarDock').classList.remove('calendar-dock-hidden');
  $('calendarDock').hidden=currentPage!=='home';$('calendarDock').setAttribute('aria-expanded','false');
  calendarPresentation='workspace';hasEnteredWorkspace=true;syncSurfaceInert();
}
function animateCalendarPart(state,node,keyframes,options){
  if(!node.animate)return Promise.resolve();
  const animation=node.animate(keyframes,{fill:'both',...options});state.animations.push(animation);return Promise.resolve(animation.finished).catch(()=>{});
}
async function transitionCalendar(open){
  if(calendarTransition || open && calendarIsOpen() || !open && !calendarIsOpen())return;
  calendarTurnQueue.length=0;finishCalendarPageTurn(false);
  const stage=$('calendarStage'),book=$('calendarBook'),dock=$('calendarDock');
  const state={animations:[],flight:null};calendarTransition=state;
  if(open){stage.hidden=false;stage.scrollTop=0;$('enterWorkspace').firstChild.textContent='返回工作台';dock.setAttribute('aria-expanded','true');}
  else{dock.hidden=false;hasEnteredWorkspace=true;}
  const expandedRect=book.getBoundingClientRect(),closedRect=dock.getBoundingClientRect();
  calendarPresentation=open?'opening':'closing';syncSurfaceInert();
  if(!reducedMotion() && usableDragRect(expandedRect) && usableDragRect(closedRect)){
    const flight=document.createElement('div'),pages=document.createElement('div'),cover=document.createElement('div'),openCopy=snapshotCalendar(book),closedCopy=snapshotCalendar(dock);
    flight.className='calendar-flight';pages.className='calendar-flight-pages';cover.className='calendar-flight-cover';flight.inert=true;flight.setAttribute('aria-hidden','true');
    flight.style.width=expandedRect.width+'px';flight.style.height=expandedRect.height+'px';
    openCopy.style.margin='0';openCopy.style.width='100%';openCopy.style.height='100%';openCopy.classList.remove('calendar-in-flight');
    closedCopy.hidden=false;closedCopy.classList.remove('calendar-dock-hidden');closedCopy.style.width=closedRect.width+'px';closedCopy.style.height=closedRect.height+'px';closedCopy.style.transformOrigin='0 0';closedCopy.style.transform=`scale(${expandedRect.width/closedRect.width},${expandedRect.height/closedRect.height})`;
    pages.appendChild(openCopy);cover.appendChild(closedCopy);flight.append(pages,cover);document.body.appendChild(flight);state.flight=flight;
    const expanded=`translate3d(${expandedRect.left}px,${expandedRect.top}px,0) scale(1,1)`;
    const closed=`translate3d(${closedRect.left}px,${closedRect.top}px,0) scale(${closedRect.width/expandedRect.width},${closedRect.height/expandedRect.height})`;
    const middle=`translate3d(${expandedRect.left+(closedRect.left-expandedRect.left)*.67}px,${expandedRect.top+(closedRect.top-expandedRect.top)*.38}px,0) scale(.39,.43) rotate(3deg)`;
    book.classList.add('calendar-in-flight');dock.classList.add('calendar-dock-hidden');
    const transforms=open?[{transform:closed},{transform:middle,offset:.42},{transform:expanded}]:[{transform:expanded},{transform:middle,offset:.6},{transform:closed}];
    const motions=[
      animateCalendarPart(state,flight,transforms,{duration:720,easing:'cubic-bezier(.22,.75,.2,1)'}),
      animateCalendarPart(state,pages,open?[{opacity:0,transform:'rotateY(11deg)'},{opacity:1,transform:'rotateY(0deg)',offset:.68},{opacity:1}]:[{opacity:1,transform:'rotateY(0deg)'},{opacity:0,transform:'rotateY(11deg)',offset:.62},{opacity:0}],{duration:650}),
      animateCalendarPart(state,cover,open?[{opacity:1,transform:'rotateY(0deg)'},{opacity:1,transform:'rotateY(-95deg)',offset:.55},{opacity:0,transform:'rotateY(-110deg)'}]:[{opacity:0,transform:'rotateY(-110deg)'},{opacity:1,transform:'rotateY(-35deg)',offset:.52},{opacity:1,transform:'rotateY(0deg)'}],{duration:650,easing:'cubic-bezier(.2,.65,.3,1)'}),
      animateCalendarPart(state,stage,open?[{opacity:0},{opacity:1}]:[{opacity:1},{opacity:0}],{duration:open?400:480,delay:open?0:180})
    ];
    await Promise.all(motions);
  }
  if(calendarTransition!==state)return;
  state.animations.forEach(animation=>animation.cancel());state.flight?.remove();calendarTransition=null;
  stage.hidden=!open;stage.style.opacity='';book.classList.remove('calendar-in-flight');dock.classList.remove('calendar-dock-hidden');dock.hidden=currentPage!=='home';
  calendarPresentation=open?'expanded':'workspace';dock.setAttribute('aria-expanded',String(open));syncSurfaceInert();
  if(open)$('enterWorkspace').focus();else dock.focus();
}
function initializeCalendarPresentation(){
  $('calendarDock').onclick=()=>transitionCalendar(true);$('enterWorkspace').onclick=()=>transitionCalendar(false);
  if(currentPage==='home'){
    $('calendarStage').hidden=false;$('calendarDock').hidden=true;calendarPresentation='landing';syncSurfaceInert();$('enterWorkspace').focus();
  }else dismissCalendarImmediately();
  document.addEventListener('keydown',event=>{
    if(!calendarIsOpen() || $('drawer').classList.contains('open'))return;
    if(event.key==='Escape'){event.preventDefault();transitionCalendar(false);return;}
    if(event.key==='Tab'){
      if(calendarTransition){event.preventDefault();return;}
      const controls=[...$('calendarStage').querySelectorAll('button,input,select')].filter(control=>!control.disabled && !control.closest('[hidden],[inert]'));
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
}
