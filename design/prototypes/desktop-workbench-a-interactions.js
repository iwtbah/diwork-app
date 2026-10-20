// Shared cards and calendar interactions for the design prototype.
const cardLaneOrder = {};
const cardLayoutAnimations = new WeakMap();
const BOARD_STATUSES = ['待办', '进行中', '已暂停', '已完成'];
let statusUndo = null;
let dragSession = null;
let suppressCardClickUntil = 0;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
function allowedTaskStatuses(task) {
  if (task.status === '已取消' && task.cancelReason) return ['已取消'];
  if (task.status === '已完成') return ['待办', '进行中', '已暂停', '已完成'];
  if (task.status === '已取消') return ['待办', '进行中', '已暂停', '已取消'];
  return [...BOARD_STATUSES, '已取消'];
}
function taskCard(task, draggable = true) {
  const locked = task.status === '已取消' && task.cancelReason;
  const related = task.planId ? getPlan(task.planId)?.title : '临时新增';
  const count = taskLogs(task.id).length;
  return `<article class="task-card ${task.status === '已完成' ? 'card-completed' : ''} ${locked ? 'card-locked' : ''} ${!draggable?'gallery-card':''}" data-card-task="${task.id}" aria-label="${escapeHtml(task.title)}，${task.status}"><div class="card-topline"><span class="card-id">${task.id.toUpperCase()}</span><div class="card-top-actions">${priorityTag(task.priority)}${locked || !draggable ? '' : `<button class="card-drag-handle" data-drag-handle="${task.id}" aria-label="拖动${escapeHtml(task.title)}；空格拿起，方向键移动，Enter 放下" title="拖动更改状态"><span aria-hidden="true">⠿</span></button>`}</div></div><button class="card-title" data-open-task="${task.id}">${escapeHtml(task.title)}</button><div class="card-context">${escapeHtml(related)}</div>${task.blocker && active(task) ? `<div class="card-blocker">卡点 · ${escapeHtml(task.blocker)}</div>` : ''}<div class="card-progress"><div class="progress-line"><span style="width:${task.progress}%"></span></div><span>${task.progress}%</span></div><div class="card-details"><span class="card-date ${overdue(task) ? 'overdue-date' : ''}">${icon('calendar', 'icon-sm')}${taskTime(task)}${overdue(task) ? ' · 逾期' : ''}</span>${count ? `<button class="card-log-count" data-open-task="${task.id}" aria-label="${count} 条关联工作记录">${icon('note','icon-sm')}${count}</button>` : ''}</div><div class="card-footer"><span class="card-state-static">${stateMark(task.status)}</span><button class="card-record-button" data-card-record="${task.id}" aria-label="为${escapeHtml(task.title)}写记录">${icon('pen', 'icon-sm')}记录</button></div>${locked ? '<div class="card-lock-note">由计划变更取消，需从计划处理</div>' : ''}</article>`;
}
function renderTaskBoard(items, context, includeCancelled = false) {
  const statuses = includeCancelled ? [...BOARD_STATUSES, '已取消'] : BOARD_STATUSES;
  const emptyCopy = {'待办':'把待做的工作放在这里','进行中':'拖入一张卡片，开始推进','已暂停':'暂时搁置的工作留在这里','已完成':'完成后，把卡片放在这里','已取消':'保留取消事项的执行历史'};
  return `<div class="task-board ${includeCancelled ? 'board-with-cancelled' : ''}" data-board-id="${context}" aria-label="${context === 'home' ? '今日' : '全部筛选结果的'}任务状态看板">${statuses.map((status,index) => {
    const order=cardLaneOrder[status] || [];
    const group = items.filter(task => task.status === status).sort((a,b)=>(order.includes(a.id)?order.indexOf(a.id):9999)-(order.includes(b.id)?order.indexOf(b.id):9999));
    return `<section class="board-lane lane-${index}" data-drop-status="${status}" aria-label="${status}，${group.length} 项"><header class="lane-heading"><div>${stateMark(status)}<span class="lane-count">${group.length}</span></div><span class="lane-drop-hint">放到这里</span></header><div class="lane-cards">${group.map(task=>taskCard(task)).join('')}${!group.length ? `<div class="lane-empty"><span class="lane-empty-mark" aria-hidden="true">${index === 3 ? '✓' : '+'}</span>${emptyCopy[status]}</div>` : ''}</div></section>`;
  }).join('')}</div>`;
}
function changeCardStatus(id, next, announce = true) {
  const task = getTask(id);
  if (!task || !allowedTaskStatuses(task).includes(next)) { if (announce) showToast('此任务需从关联计划中恢复'); return false; }
  if (task.status === next) return false;
  const before = {status:task.status,progress:task.progress,previousStatus:task.previousStatus,previousProgress:task.previousProgress,cancelStatus:task.cancelStatus,cancelReason:task.cancelReason};
  if (task.status === '已完成') task.progress = task.previousProgress ?? 0;
  if (next === '已完成') { task.previousStatus = task.status; task.previousProgress = task.progress; task.progress = 100; }
  if (next === '已取消') { task.cancelStatus = task.status; task.cancelReason = ''; }
  task.status = next;
  task.events.unshift(`刚刚 · 状态由${before.status}改为${next}`);
  refreshAll();
  if (announce) {
    showToast(`「${task.title}」已移至${next}`, true);
    statusUndo = {id,before,after:{status:task.status,progress:task.progress}};
    $('boardAnnouncements').textContent = `${task.title}，状态已由${before.status}改为${next}。可撤销。`;
  }
  return true;
}
function undoCardStatusChange() {
  if (!statusUndo) return;
  const {id,before,after} = statusUndo, task = getTask(id);
  if (!task || task.status !== after.status || task.progress !== after.progress) { showToast('任务已有后续变化，请在详情中调整'); return; }
  Object.assign(task,before);
  task.events.unshift('刚刚 · 撤销卡片状态变更，恢复为'+before.status);
  refreshAll(); showToast('已撤销状态变更');
}
function usableDragRect(rect) {
  return rect && ['left','top','width','height'].every(key=>Number.isFinite(rect[key])) && rect.width>1 && rect.height>1;
}
function dragCards(list,state) { return [...list.querySelectorAll('.task-card')].filter(card=>card!==state.source && !card.classList.contains('is-drag-source')); }
function animateBoardLayout(board,mutate) {
  if(!board){mutate();return;}
  const cards=[...board.querySelectorAll('.task-card:not(.is-drag-source)')];
  const before=new Map(cards.map(card=>[card,card.getBoundingClientRect()]));
  cards.forEach(card=>cardLayoutAnimations.get(card)?.cancel());
  mutate();
  if(reducedMotion())return;
  for(const card of cards){
    const old=before.get(card),now=card.getBoundingClientRect(),dx=old.left-now.left,dy=old.top-now.top;
    if(usableDragRect(now) && Math.hypot(dx,dy)>.5 && card.animate){
      const animation=card.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:190,easing:'cubic-bezier(.2,.8,.2,1)'});
      cardLayoutAnimations.set(card,animation);
    }
  }
}
function placeCardPlaceholder(state,lane,before=null) {
  const list=lane.querySelector('.lane-cards');
  let next=state.placeholder.nextElementSibling;
  while(next && (!next.matches('.task-card') || next===state.source))next=next.nextElementSibling;
  if(state.placeholder.parentElement===list && next===before)return;
  const board=lane.closest('[data-board-id]');
  animateBoardLayout(board,()=>{
    state.placeholder.parentElement?.classList.remove('has-drag-placeholder');
    list.insertBefore(state.placeholder,before);
    list.classList.add('has-drag-placeholder');
  });
}
function onCardPointerDown(event) {
  if(event.button!==0 || dragSession || $('drawer').classList.contains('open'))return;
  const card=event.target.closest('.task-card');
  if(!card || card.classList.contains('card-locked') || card.closest('[hidden],[inert]'))return;
  const handle=event.target.closest('[data-drag-handle]');
  if(!handle && !event.target.closest('.card-title') && event.target.closest('button,select,input,textarea,a'))return;
  const rect=card.getBoundingClientRect(),board=card.closest('[data-board-id]');
  if(!board || !usableDragRect(rect) || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY))return;
  dragSession={phase:'pending',id:card.dataset.cardTask,source:card,boardId:board.dataset.boardId,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,pointerX:event.clientX,pointerY:event.clientY,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,x:rect.left,y:rect.top,vx:0,vy:0,angle:0,scale:1,sourceRect:rect,startedAt:0,frame:0,lane:null,motion:!reducedMotion()};
}
function scheduleCardFrame(state) {
  if(state.frame || dragSession!==state)return;
  state.frame=requestAnimationFrame(time=>{state.frame=0;if(dragSession===state)cardDragFrame(time);});
}
function beginCardDrag() {
  const state=dragSession;if(!state || state.phase!=='pending')return;
  const rect=state.source.getBoundingClientRect();
  if(!usableDragRect(rect)){dragSession=null;return;}
  state.sourceRect=rect;state.x=rect.left;state.y=rect.top;state.lastTime=null;
  state.offsetX=Math.max(0,Math.min(rect.width,state.startX-rect.left));state.offsetY=Math.max(0,Math.min(rect.height,state.startY-rect.top));
  state.phase='dragging';
  // Position belongs to the outer layer. No animation or transform is inherited from the card.
  const layer=document.createElement('div'),preview=state.source.cloneNode(true);
  layer.className='card-drag-layer';layer.setAttribute('aria-hidden','true');layer.inert=true;
  preview.className='task-card drag-card'+(getTask(state.id).status==='已完成'?' card-completed':'');
  preview.removeAttribute('data-card-task');preview.removeAttribute('style');
  preview.style.setProperty('animation','none','important');preview.style.setProperty('transition','none','important');preview.style.setProperty('transform','none','important');
  layer.style.width=rect.width+'px';layer.style.height=rect.height+'px';
  layer.style.left=rect.left+'px';layer.style.top=rect.top+'px';
  layer.style.transform='translate3d(0,0,0)';layer.appendChild(preview);document.body.appendChild(layer);
  state.ghost=layer;state.preview=preview;state.originX=rect.left;state.originY=rect.top;
  state.placeholder=document.createElement('div');state.placeholder.className='card-drop-placeholder';state.placeholder.style.height=rect.height+'px';state.placeholder.setAttribute('aria-hidden','true');
  state.source.before(state.placeholder);state.source.parentElement.classList.add('has-drag-placeholder');
  cardLayoutAnimations.get(state.source)?.cancel();state.source.classList.add('is-drag-source');
  document.body.classList.add('card-dragging');
  if(!state.keyboard){state.captureTarget=document.documentElement;try{state.captureTarget.setPointerCapture?.(state.pointerId);}catch{}}
  state.lane=state.source.closest('[data-drop-status]');state.lane.classList.add('is-drop-target');
  $('boardAnnouncements').textContent=`已拿起${getTask(state.id).title}。目标列会自动让位；Escape 取消。`;
  scheduleCardFrame(state);
}
function updateCardDropTarget(x,y) {
  const state=dragSession;if(!state || state.phase!=='dragging' || state.keyboard)return;
  const candidate=document.elementFromPoint(x,y)?.closest('[data-drop-status]');
  const lane=candidate?.closest('[data-board-id]')?.dataset.boardId===state.boardId?candidate:null;
  if(state.lane!==lane){state.lane?.classList.remove('is-drop-target','is-drop-rejected');state.lane=lane;}
  if(!lane){state.placeholder.classList.add('placeholder-invalid');return;}
  const allowed=allowedTaskStatuses(getTask(state.id)).includes(lane.dataset.dropStatus);
  lane.classList.toggle('is-drop-target',allowed);lane.classList.toggle('is-drop-rejected',!allowed);state.placeholder.classList.toggle('placeholder-invalid',!allowed);
  if(!allowed)return;
  const list=lane.querySelector('.lane-cards'),listTop=list.getBoundingClientRect().top;
  const before=dragCards(list,state).find(card=>y<listTop+card.offsetTop+card.offsetHeight/2) || null;
  placeCardPlaceholder(state,lane,before);
}
function onCardPointerMove(event) {
  const state=dragSession;if(!state || state.keyboard || state.pointerId!==event.pointerId || !['pending','dragging'].includes(state.phase))return;
  if(!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY))return;
  state.pointerX=event.clientX;state.pointerY=event.clientY;
  if(state.phase==='pending' && Math.hypot(event.clientX-state.startX,event.clientY-state.startY)>7)beginCardDrag();
  if(state.phase==='dragging'){event.preventDefault();updateCardDropTarget(event.clientX,event.clientY);}
}
function cardDragFrame(time) {
  const state=dragSession;if(!state?.ghost)return;
  const dt=state.lastTime===null?1/60:Math.min(Math.max((time-state.lastTime)/1000,1/240),1/30);state.lastTime=time;
  let targetX=state.pointerX-state.offsetX,targetY=state.pointerY-state.offsetY,targetScale=1,targetAngle=0;
  if(state.phase==='dragging'){
    targetScale=state.motion?1.035:1;targetAngle=state.motion?Math.max(-5,Math.min(5,state.vx*.006)):0;
    if(!state.keyboard){
      const board=document.querySelector(`[data-board-id="${state.boardId}"]`),scroll=board?.parentElement;
      if(scroll){const b=scroll.getBoundingClientRect();if(state.pointerY>=b.top && state.pointerY<=b.bottom){if(state.pointerX>b.right-35)scroll.scrollLeft+=Math.min(10,(state.pointerX-b.right+35)*.22);else if(state.pointerX<b.left+35)scroll.scrollLeft-=Math.min(10,(b.left+35-state.pointerX)*.22);}}
      if(state.pointerY>window.innerHeight-45)window.scrollBy(0,7);else if(state.pointerY<45)window.scrollBy(0,-7);
      updateCardDropTarget(state.pointerX,state.pointerY);
    }else{const rect=state.placeholder.getBoundingClientRect();if(usableDragRect(rect)){targetX=rect.left;targetY=rect.top;}}
  }else{targetX=state.targetX;targetY=state.targetY;}
  if(!state.motion){state.x=targetX;state.y=targetY;state.angle=0;state.scale=1;}
  else{
    state.vx+=((targetX-state.x)*290-state.vx*30)*dt;state.vy+=((targetY-state.y)*290-state.vy*30)*dt;
    state.x+=state.vx*dt;state.y+=state.vy*dt;state.angle+=(targetAngle-state.angle)*Math.min(1,dt*17);state.scale+=(targetScale-state.scale)*Math.min(1,dt*20);
  }
  if(!Number.isFinite(state.x+state.y+state.vx+state.vy)){state.x=targetX;state.y=targetY;state.vx=state.vy=0;}
  if(state.phase==='settling'){
    const blend=state.motion?Math.min(1,dt*20):1;
    state.width+=(state.targetWidth-state.width)*blend;state.height+=(state.targetHeight-state.height)*blend;
    state.ghost.style.width=state.width+'px';state.ghost.style.height=state.height+'px';
  }
  state.ghost.style.transform=`translate3d(${state.x-state.originX}px,${state.y-state.originY}px,0) rotate(${state.angle}deg) scale(${state.scale})`;
  if(state.phase==='settling' && (!state.motion || Math.hypot(state.x-targetX,state.y-targetY)<.7 && Math.hypot(state.vx,state.vy)<12 || time-state.startedAt>600)){cleanupCardDrag();return;}
  scheduleCardFrame(state);
}
function releaseCardCapture(state){try{state.captureTarget?.releasePointerCapture?.(state.pointerId);}catch{}}
function finishCardDrag(commit,immediate=false) {
  const state=dragSession;if(!state)return;
  if(state.phase==='pending'){dragSession=null;return;}
  if(state.phase==='settling'){if(immediate)cleanupCardDrag();return;}
  const next=commit && state.lane?.dataset.dropStatus,accepted=Boolean(next && allowedTaskStatuses(getTask(state.id)).includes(next));
  // Freeze the transaction before capture release or any render removes the source node.
  state.phase='settling';releaseCardCapture(state);state.lane?.classList.remove('is-drop-target','is-drop-rejected');
  let landingRect=state.placeholder.getBoundingClientRect();
  const oldBoard=document.querySelector(`[data-board-id="${state.boardId}"]`),beforeLayout=new Map([...oldBoard.querySelectorAll('.task-card:not(.is-drag-source)')].map(card=>[card.dataset.cardTask,card.getBoundingClientRect()]));
  if(accepted){
    const list=state.placeholder.parentElement,visible=[...list.children].filter(node=>node===state.placeholder || node.matches('.task-card:not(.is-drag-source)')).map(node=>node===state.placeholder?state.id:node.dataset.cardTask);
    cardLaneOrder[next]=[...visible,...(cardLaneOrder[next] || []).filter(id=>!visible.includes(id))];
    if(getTask(state.id).status!==next)changeCardStatus(state.id,next);else{refreshAll();showToast('卡片位置已调整');}
  }else{
    animateBoardLayout(state.source.closest('[data-board-id]'),()=>{state.placeholder.parentElement?.classList.remove('has-drag-placeholder');state.source.before(state.placeholder);state.placeholder.parentElement.classList.add('has-drag-placeholder');});
    landingRect=state.placeholder.getBoundingClientRect();
    $('boardAnnouncements').textContent='已取消移动，任务状态保持不变。';
  }
  const board=document.querySelector(`[data-board-id="${state.boardId}"]`),target=board?.querySelector(`[data-card-task="${state.id}"]`),targetRect=target?.getBoundingClientRect();
  if(accepted && state.motion){for(const card of board?.querySelectorAll('.task-card') || []){if(card.dataset.cardTask===state.id)continue;const old=beforeLayout.get(card.dataset.cardTask),now=card.getBoundingClientRect();if(old && usableDragRect(now) && Math.hypot(old.left-now.left,old.top-now.top)>.5 && card.animate){const animation=card.animate([{transform:`translate(${old.left-now.left}px,${old.top-now.top}px)`},{transform:'translate(0,0)'}],{duration:190,easing:'cubic-bezier(.2,.8,.2,1)'});cardLayoutAnimations.set(card,animation);}}}
  const rect=accepted && usableDragRect(targetRect)?targetRect:usableDragRect(landingRect)?landingRect:state.sourceRect;
  state.width=state.sourceRect.width;state.height=state.sourceRect.height;state.targetWidth=rect.width;state.targetHeight=rect.height;state.targetX=rect.left;state.targetY=rect.top;state.startedAt=performance.now();state.lastTime=null;
  if(target){state.preview.innerHTML=target.innerHTML;state.preview.classList.toggle('card-completed',getTask(state.id).status==='已完成');target.classList.add('is-landing');state.landing=target;}
  suppressCardClickUntil=performance.now()+500;
  if(immediate)cleanupCardDrag();else scheduleCardFrame(state);
}
function cleanupCardDrag() {
  const state=dragSession;if(!state)return;
  cancelAnimationFrame(state.frame);releaseCardCapture(state);state.ghost?.remove();state.placeholder?.parentElement?.classList.remove('has-drag-placeholder');state.placeholder?.remove();state.source.classList.remove('is-drag-source');state.landing?.classList.remove('is-landing');
  document.querySelectorAll('.is-drop-target,.is-drop-rejected').forEach(node=>node.classList.remove('is-drop-target','is-drop-rejected'));document.body.classList.remove('card-dragging');
  if(state.landing && !state.landing.closest('[hidden]') && (state.keyboard || document.activeElement===document.body))state.landing.querySelector('[data-drag-handle]')?.focus({preventScroll:true});
  dragSession=null;
}
function onCardKeyboard(event) {
  const state=dragSession,handle=event.target.closest('[data-drag-handle]');
  if(!state && handle && [' ','Enter'].includes(event.key)){
    const card=handle.closest('.task-card'),rect=card.getBoundingClientRect();if(!usableDragRect(rect))return;
    event.preventDefault();onCardPointerDown({button:0,target:handle,pointerId:null,clientX:rect.left+rect.width/2,clientY:rect.top+20});
    if(dragSession){dragSession.keyboard=true;beginCardDrag();}return;
  }
  if(!state?.keyboard || state.phase!=='dragging')return;
  if([' ','Enter'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();finishCardDrag(true);return;}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();
  const board=document.querySelector(`[data-board-id="${state.boardId}"]`),lanes=[...board.querySelectorAll('[data-drop-status]')],index=lanes.indexOf(state.lane);
  if(event.key==='ArrowLeft' || event.key==='ArrowRight'){
    const lane=lanes[Math.max(0,Math.min(lanes.length-1,index+(event.key==='ArrowRight'?1:-1)))];
    if(!allowedTaskStatuses(getTask(state.id)).includes(lane.dataset.dropStatus))return;
    state.lane.classList.remove('is-drop-target');state.lane=lane;lane.classList.add('is-drop-target');placeCardPlaceholder(state,lane,null);
  }else{
    const list=state.lane.querySelector('.lane-cards'),cards=dragCards(list,state),current=[...list.children].filter(node=>node===state.placeholder || cards.includes(node)).indexOf(state.placeholder),position=Math.max(0,Math.min(cards.length,current+(event.key==='ArrowDown'?1:-1)));
    placeCardPlaceholder(state,state.lane,cards[position] || null);
  }
  state.placeholder.scrollIntoView?.({block:'nearest',inline:'nearest'});$('boardAnnouncements').textContent=`目标：${state.lane.dataset.dropStatus}，Enter 放下，Escape 取消。`;
}
function initializeCardInteractions() {
  document.addEventListener('pointerdown',onCardPointerDown);document.addEventListener('pointermove',onCardPointerMove,{passive:false});
  document.addEventListener('pointerup',event=>{if(dragSession?.pointerId===event.pointerId)finishCardDrag(true);});
  document.addEventListener('pointercancel',event=>{if(dragSession?.pointerId===event.pointerId)finishCardDrag(false);});
  window.addEventListener('blur',()=>{if(dragSession)finishCardDrag(false,true);});
  document.addEventListener('keydown',onCardKeyboard);
}
