function goalStages(plan) {
  const children=tasks.filter(task=>task.planId===plan.id && task.status!=='已取消');
  const names=[...new Set(children.map(task=>task.stage || '执行推进'))];
  names.sort((a,b)=>{const order=plan.stages || [];return (order.includes(a)?order.indexOf(a):999)-(order.includes(b)?order.indexOf(b):999);});
  return names.map(name=>{
    const items=children.filter(task=>(task.stage || '执行推进')===name);
    return {name,items,progress:Math.round(items.reduce((sum,task)=>sum+task.progress,0)/items.length),done:items.every(task=>task.status==='已完成'),blocked:items.some(task=>task.blocker && active(task))};
  });
}
function renderDashboard() {
  const today=tasks.filter(task=>isToday(task) && task.status!=='已取消'), finished=today.filter(task=>task.status==='已完成').length;
  const rate=today.length?Math.round(finished/today.length*100):0;
  $('todayOrbit').style.setProperty('--orbit-progress',rate+'%');
  $('todayOrbit').setAttribute('aria-label',`今日已完成 ${finished} / ${today.length} 项`);
  $('todayFinished').textContent=finished;
  $('todaySummary').textContent=today.length?`已完成 ${finished} 项，余下 ${today.filter(active).length} 项继续推进`:'今天还没有安排任务';
  const days=Array.from({length:7},(_,index)=>{const day=new Date(WEEK_START+'T12:00:00');day.setDate(day.getDate()+index);const key=dateKey(day);const items=tasks.filter(task=>task.status!=='已取消' && [task.executionDate,task.dueDate].includes(key));return {key,items,finished:items.filter(task=>task.status==='已完成').length};});
  const max=Math.max(1,...days.map(day=>day.items.length));
  $('weekRhythm').innerHTML=days.map((day,index)=>`<button class="rhythm-day ${day.key===TODAY?'is-today':''}" data-dashboard-day="${day.key}" aria-label="周${'一二三四五六日'[index]}，${day.items.length} 项安排，${day.finished} 项完成"><span class="rhythm-count">${day.items.length || '—'}</span><span class="rhythm-track"><span class="rhythm-total" style="height:${day.items.length/max*100}%"><i style="height:${day.items.length?day.finished/day.items.length*100:0}%"></i></span></span><span>${'一二三四五六日'[index]}</span></button>`).join('');
  const risks=tasks.filter(overdue);$('overdueSummary').textContent=risks.length?`${risks.filter(task=>task.priority==='P0').length} 项最高优先级`:'当前没有逾期任务';
}
function renderHomeGoals() {
  const items=plans.filter(plan=>plan.type==='goal' && !['已完成','已取消','终止'].includes(plan.status));
  document.querySelector('#page-home .goal').innerHTML=items.length?items.map(plan=>{
    const stages=goalStages(plan), current=stages.find(stage=>!stage.done), rate=goalProgress(plan);
    const stageIndex=current?stages.indexOf(current)+1:stages.length;
    const blocker=stages.flatMap(stage=>stage.items).find(task=>task.blocker && active(task));
    return `<button class="goal-journey" data-gantt="${plan.id}" aria-label="${escapeHtml(plan.title)}，当前${escapeHtml(current?.name || (stages.length?'待核对完成标准':'待安排任务'))}，查看甘特图"><div class="goal-journey-head"><div><div class="goal-phase-label">${current?`阶段 ${stageIndex} / ${stages.length} · 正在推进 ${escapeHtml(current.name)}`:stages.length?'任务均已完成 · 待核对完成标准':'待安排执行任务'}</div><h3>${escapeHtml(plan.title)}</h3></div><span class="goal-overall">${rate ?? '—'}<small>${rate===null?'':'%'}</small><em class="goal-deadline">${shortDate(plan.end)}截止</em></span></div><div class="goal-stages">${stages.map((stage,index)=>`<div class="goal-stage ${stage.done?'is-done':stage===current?'is-current':''}"><span class="stage-node">${stage.done?'✓':index+1}</span><span class="stage-name">${escapeHtml(stage.name)}</span><span class="stage-value">${stage.progress}%</span><span class="stage-track"><i style="width:${stage.progress}%"></i></span></div>`).join('') || '<span class="muted">添加执行任务后，在这里跟踪阶段。</span>'}</div><div class="goal-journey-foot"><span>${blocker?`<i class="goal-warning-dot"></i>${escapeHtml(blocker.blocker)}`:`${shortDate(plan.end)}截止 · 进度按有效任务平均汇总`}</span><span class="gantt-link">查看甘特图 ${icon('chevron-right','icon-sm')}</span></div></button>`;
  }).join(''):'<div class="empty">还没有进行中的目标。创建目标后，在这里查看推进阶段。</div>';
}
const ganttDay = value => Date.parse(value+'T00:00:00Z')/86400000;
function renderGoalGantt(plan) {
  const children=tasks.filter(task=>task.planId===plan.id && task.status!=='已取消');
  const stages=goalStages(plan), rate=goalProgress(plan);
  const dates=[plan.start,plan.end,...children.flatMap(task=>[task.startDate,task.executionDate,task.dueDate])].filter(Boolean).sort();
  const start=ganttDay(dates[0] || TODAY),end=ganttDay(dates.at(-1) || TODAY),span=Math.max(1,end-start+1);
  const position=date=>Math.max(0,Math.min(100,(ganttDay(date)-start)/span*100));
  const interval=Math.max(7,Math.ceil(span/14/7)*7),ticks=[];
  for(let day=start;day<=end;day+=interval)ticks.push({left:(day-start)/span*100,label:shortDate(new Date(day*86400000).toISOString().slice(0,10))});
  const todayOffset=position(TODAY),showToday=ganttDay(TODAY)>=start && ganttDay(TODAY)<=end;
  $('drawerEyebrow').textContent='目标进展 · 甘特图';
  $('drawerBody').innerHTML=`${drawerBackMarkup()}<div class="gantt-title-row"><div><h2 class="drawer-title">${escapeHtml(plan.title)}</h2><p class="detail-copy">${shortDate(plan.start)} — ${shortDate(plan.end)} · ${children.length} 项执行任务</p></div><div class="gantt-total">${rate ?? '—'}<small>${rate===null?'':'%'}</small><span>整体进度</span></div></div><div class="gantt-stage-summary">${stages.map(stage=>`<span class="${stage.done?'stage-complete':''}">${stage.done?'✓':'◉'} ${escapeHtml(stage.name)} <strong>${stage.progress}%</strong></span>`).join('')}</div><div class="gantt-scroll" tabindex="0" aria-label="目标任务时间轴，可横向滚动"><div class="gantt-chart" style="--gantt-tick:${interval/span*100}%"><div class="gantt-header"><div>阶段 / 执行任务</div><div class="gantt-ruler">${ticks.map(tick=>`<span style="left:${tick.left}%">${tick.label}</span>`).join('')}</div></div>${stages.map(stage=>`<div class="gantt-group"><div>${escapeHtml(stage.name)}<span>${stage.items.filter(task=>task.status==='已完成').length} / ${stage.items.length} 完成</span></div><div class="gantt-track">${showToday?`<i class="gantt-today" style="left:${todayOffset}%"></i>`:''}</div></div>${stage.items.map(task=>{
    const from=task.startDate || task.executionDate || task.dueDate,to=task.dueDate || from;
    const invalid=from && to && to<from,point=from && !task.startDate && !task.executionDate;
    const width=from && !invalid?Math.max(.65,(ganttDay(to)-ganttDay(from)+1)/span*100):0;
    return `<div class="gantt-row"><div class="gantt-task-label"><button class="object-title" data-gantt-task="${task.id}">${escapeHtml(task.title)}</button><span>${stateMark(task.status)} · ${task.progress}%</span></div><div class="gantt-track">${showToday?`<i class="gantt-today" style="left:${todayOffset}%"></i>`:''}${from && !invalid?`<button class="gantt-bar ${task.status==='已完成'?'is-complete':''} ${task.status==='已暂停'?'is-paused':''} ${point?'is-point':''}" style="left:${position(from)}%;width:${width}%" data-gantt-task="${task.id}" aria-label="${escapeHtml(task.title)}，${point?'截止点 '+shortDate(to):shortDate(from)+'至'+shortDate(to)}，${task.progress}%"><i style="width:${task.progress}%"></i><span>${point?'◆':task.progress+'%'}</span></button>`:`<span class="gantt-undated">${invalid?'日期待校正':'尚未安排日期'}</span>`}</div></div>`;
  }).join('')}`).join('') || '<div class="empty">还没有执行任务，添加任务后可查看时间安排。</div>'}<div class="gantt-axis-foot"><span>任务采用当前计划日期</span><span>${showToday?'<i></i> 今日 '+shortDate(TODAY):'今日不在此时间范围'}</span></div></div></div><div class="gantt-legend"><span><i class="legend-bar"></i>计划区间 / 深色为完成进度</span><span><i class="legend-point">◆</i>仅截止日期</span><span>点击时间条查看任务</span></div>`;
  $('drawerFooter').innerHTML='<span class="window-footnote">进度来自同一份执行任务；目标完成需单独核对。</span><button class="secondary" data-close-drawer>关闭</button>';
}
