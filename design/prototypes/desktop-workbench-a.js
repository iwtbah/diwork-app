const TODAY = '2026-10-20';
const WEEK_START = '2026-10-19';
const WEEK_END = '2026-10-25';
const WINDOW_END = '2026-11-03';
const $ = id => document.getElementById(id);
const icon = (name, className = '') => `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const shortDate = value => value ? `${Number(value.slice(5, 7))} 月 ${Number(value.slice(8, 10))} 日` : '未安排';
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const active = task => !['已完成', '已取消'].includes(task.status);
const isToday = task => task.executionDate === TODAY || task.dueDate === TODAY;
const isWeek = task => [task.executionDate, task.dueDate].some(date => date && date >= WEEK_START && date <= WEEK_END);
const overdue = task => active(task) && task.dueDate && task.dueDate < TODAY;
const stateMark = status => `<span class="status-mark ${{'进行中':'running','已暂停':'paused','已完成':'finished','已取消':'cancelled'}[status] || ''}"></span>${escapeHtml(status)}`;
const priorityTag = priority => `<span class="tag priority-${priority.toLowerCase()}">${priority}</span>`;
const progressBar = value => `<div class="table-progress"><div class="progress-line"><span style="width:${value}%"></span></div>${value}%</div>`;
const planTypes = { goal: '目标计划', recurring: '周期计划', once: '一次性计划' };
let plans = [
  { id: 'p2', type: 'goal', title: '11 月底前完成平台 V1', description: '打通计划、任务、记录的个人工作管理闭环。', priority: 'P1', status: '进行中', decomposed: true, stages: ['需求确认','接口开发','联调验证'], start: '2026-10-12', end: '2026-11-30', standard: '核心工作闭环可用，关键场景通过验收，并完成内网部署。' },
  { id: 'p1', type: 'recurring', title: '科室例会', description: '同步工作进展、风险与本周需要协调的事项。', priority: 'P2', status: '启用', start: '2026-10-12', cycle: 'weekly', weekdays: [1], time: '09:00', endMode: 'never' },
  { id: 'p3', type: 'recurring', title: '每周工作回顾', description: '整理本周成果、未解决卡点和下周安排。', priority: 'P2', status: '启用', start: TODAY, cycle: 'weekly', weekdays: [5], time: '16:30', endMode: 'never' },
  { id: 'p4', type: 'once', title: '准备月度工作汇报', description: '整理十月工作成果与关键数据。', priority: 'P1', status: '待办', start: '2026-10-23', end: '2026-10-23' }
];
let tasks = [
  { id: 't3', title: '排查线上问题', source: '临时任务', sourceKey: 'manual', priority: 'P0', status: '待办', executionDate: TODAY, dueDate: '2026-10-18', progress: 0, notes: '优先定位问题原因，再补充处理记录。', events: ['昨天 17:30 · 创建临时任务'] },
  { id: 't2', title: '完成登录接口', source: '目标任务', sourceKey: 'goal', planId: 'p2', priority: 'P1', status: '进行中', stage: '接口开发', startDate: '2026-10-16', dueDate: TODAY, progress: 60, notes: '基础流程已完成，继续处理异常分支与联调。', events: ['今天 09:40 · 进度由 40% 更新至 60%', '10 月 16 日 · 开始任务'] },
  { id: 't1', title: '科室例会', source: '周期计划', sourceKey: 'plan', planId: 'p1', priority: 'P2', status: '待办', originalDate: '2026-10-19', exception: true, executionDate: TODAY, dueDate: TODAY, startTime: '09:00', progress: 0, notes: '整理议题并记录会议结论。本次任务独立于下周例会。', events: ['10 月 12 日 · 根据每周一规则生成'] },
  { id: 't4', title: '整理平台 V1 需求', source: '目标任务', sourceKey: 'goal', planId: 'p2', priority: 'P1', status: '已完成', stage: '需求确认', startDate: '2026-10-12', previousStatus: '进行中', previousProgress: 80, executionDate: TODAY, dueDate: TODAY, progress: 100, notes: '已完成第一轮需求整理。', events: ['今天 11:20 · 完成任务', '今天 08:40 · 开始任务'] },
  { id: 't5', title: '梳理接口联调卡点', source: '目标任务', sourceKey: 'goal', planId: 'p2', priority: 'P1', status: '已暂停', stage: '联调验证', executionDate: '2026-10-21', dueDate: '2026-10-22', progress: 30, blocker: '等待联调环境确认', notes: '环境确认后继续联调，当前卡点未解决。', events: ['10 月 16 日 · 暂停任务'] },
  { id: 't6', title: '科室例会', source: '周期计划', sourceKey: 'plan', planId: 'p1', priority: 'P2', status: '待办', executionDate: '2026-10-26', dueDate: '2026-10-26', startTime: '09:00', progress: 0, notes: '下周独立任务，尚未开始。', events: ['10 月 19 日 · 根据每周一规则生成'] },
  { id: 't7', title: '每周工作回顾', source: '周期计划', sourceKey: 'plan', planId: 'p3', priority: 'P2', status: '待办', executionDate: '2026-10-23', dueDate: '2026-10-23', startTime: '16:30', progress: 0, notes: '回顾本周记录与目标推进情况。', events: ['今天 · 根据每周五规则生成'] },
  { id: 't8', title: '准备月度工作汇报', source: '一次性计划', sourceKey: 'plan', planId: 'p4', priority: 'P1', status: '待办', executionDate: '2026-10-23', dueDate: '2026-10-23', progress: 0, notes: '整理十月已完成工作、成果和风险。', events: ['今天 · 从一次性计划创建'] },
  { id: 't9', title: '整理接口命名规范', source: '临时任务', sourceKey: 'manual', priority: 'P3', status: '待办', executionDate: '', dueDate: '', progress: 0, notes: '待安排日期，不进入今日或本周统计。', events: ['10 月 16 日 · 创建临时任务'] },
  { id: 't10', title: '科室例会', source: '周期计划', sourceKey: 'plan', planId: 'p1', priority: 'P2', status: '已完成', previousStatus: '进行中', previousProgress: 0, executionDate: '2026-10-12', dueDate: '2026-10-12', startTime: '09:00', progress: 100, notes: '上周例会已完成，会议纪要可在记录中追溯。', events: ['10 月 12 日 10:00 · 完成任务'] },
  { id: 't11', title: '每周工作回顾', source: '周期计划', sourceKey: 'plan', planId: 'p3', priority: 'P2', status: '待办', executionDate: '2026-10-30', dueDate: '2026-10-30', startTime: '16:30', progress: 0, notes: '下周工作回顾。', events: ['今天 · 根据每周五规则生成'] },
  { id: 't12', title: '科室例会', source: '周期计划', sourceKey: 'plan', planId: 'p1', priority: 'P2', status: '待办', executionDate: '2026-11-02', dueDate: '2026-11-02', startTime: '09:00', progress: 0, notes: '十一月第一次例会，已提前生成独立任务。', events: ['今天 · 根据每周一规则生成'] },
  { id: 't13', title: '整理九月工作回顾', source: '临时任务', sourceKey: 'manual', priority: 'P2', status: '已完成', previousStatus: '进行中', previousProgress: 90, executionDate: '2026-09-30', dueDate: '2026-09-30', progress: 100, notes: '上个月的工作回顾，保留用于历史查询。', events: ['9 月 30 日 · 完成任务'] }
];
let logs = [
  { id: 'r1', date: TODAY, taskId: 't2', taskTitle: '完成登录接口', content: '完成登录校验与会话续期流程', outcome: '基础接口已联通，异常返回格式统一。', blocker: '', next: '补充边界场景并进行联调。', hours: 2, progressFrom: 40, progressTo: 60, savedAt: '2026-10-20 09:40', versions: [] },
  { id: 'r2', date: TODAY, taskId: 't4', taskTitle: '整理平台 V1 需求', content: '梳理一期业务边界，明确周期计划与临时任务的区别', outcome: '形成第一版需求清单和验收场景。', blocker: '', next: '进入页面设计评审。', hours: 1.5, savedAt: '2026-10-20 11:20', versions: [] },
  { id: 'r3', date: TODAY, taskId: '', taskTitle: '', content: '协助确认内网部署环境', outcome: '记录服务器运行环境与待确认事项。', blocker: '', next: '核实数据备份位置。', hours: .5, savedAt: '2026-10-20 11:45', versions: [] },
  { id: 'r4', date: '2026-10-16', taskId: 't5', taskTitle: '梳理接口联调卡点', content: '整理接口联调问题并确认依赖项', outcome: '已完成问题分类。', blocker: '等待联调环境确认', next: '环境就绪后执行联调。', hours: 1, progressFrom: 20, progressTo: 30, savedAt: '2026-10-16 16:10', versions: [] },
  { id: 'r5', date: '2026-10-12', taskId: 't10', taskTitle: '科室例会', content: '同步上周工作进展与本周安排', outcome: '明确三项协调事项与跟进节点。', blocker: '', next: '按会议结论更新任务。', hours: 1, savedAt: '2026-10-12 10:00', versions: [] }
];
let currentPage = 'home';
let taskLayout = 'cards';
try { taskLayout = localStorage.getItem('diwork-task-layout') === 'list' ? 'list' : 'cards'; } catch {}
let createDateOverride = null;
let activeTaskId = null;
let activeLogId = null;
let activePlanId = null;
let planAction = null;
let drawerMode = null;
let drawerHistory = [];
let returnFocus = null;
let returnPopupAnchor = null;
let undoTaskId = null;
let toastTimer;
let sequence = 20;
let planView = { mode: 'list' };
const planFilters = { type: 'all', query: '' };
const taskFilters = { view: 'all', query: '', source: '', priority: '', status: '', date: '' };
const logFilters = { query: '', from: WEEK_START, to: WEEK_END, task: '', plan: '' };
const pageScroll = {};
const pageNames = { home: '工作台', plans: '工作计划', tasks: '任务中心', logs: '工作记录' };
const getTask = id => tasks.find(task => task.id === id);
const getPlan = id => plans.find(plan => plan.id === id);
const getLog = id => logs.find(log => log.id === id);
const taskLogs = id => logs.filter(log => log.taskId === id).sort((a,b) => b.date.localeCompare(a.date));
const taskTime = task => task.executionDate ? `${task.startTime ? task.startTime + ' · ' : ''}${task.executionDate === TODAY ? '今天执行' : shortDate(task.executionDate)}` : task.dueDate ? `${shortDate(task.dueDate)}到期` : '未安排日期';
const goalProgress = plan => { const children = tasks.filter(task => task.planId === plan.id && task.status !== '已取消'); return children.length ? Math.round(children.reduce((sum,task) => sum + task.progress,0) / children.length) : null; };
function showToast(message, action = false) {
  statusUndo=null;
  clearTimeout(toastTimer); $('toastMessage').textContent = message; $('toastAction').hidden = !action; $('toast').classList.add('show');
  toastTimer = setTimeout(() => { $('toast').classList.remove('show'); undoTaskId = null; statusUndo=null; }, 5000);
}
function sortTasks(items) {
  return [...items].sort((a,b) => Number(!active(a))-Number(!active(b)) || Number(Boolean(overdue(b)))-Number(Boolean(overdue(a))) || Number(Boolean(active(b) && b.dueDate && b.dueDate <= '2026-10-22'))-Number(Boolean(active(a) && a.dueDate && a.dueDate <= '2026-10-22')) || a.priority.localeCompare(b.priority) || (a.executionDate || a.dueDate || '9999').localeCompare(b.executionDate || b.dueDate || '9999'));
}
function taskCheck(task) {
  return task.status === '已取消' ? '<span class="muted" aria-label="已取消">—</span>' : `<button class="check ${task.status === '已完成' ? 'done' : ''}" data-complete="${task.id}" aria-label="${task.status === '已完成' ? '撤销完成' : '完成'}：${escapeHtml(task.title)}">${task.status === '已完成' ? icon('check') : ''}</button>`;
}
function taskRow(task) {
  return `<div class="task-row ${task.status === '已完成' ? 'completed' : ''} ${activeTaskId === task.id ? 'is-active' : ''}">${taskCheck(task)}<button class="task-open" data-open-task="${task.id}"><div class="task-title">${escapeHtml(task.title)}</div><div class="task-sub"><span>${escapeHtml(task.source)}</span><span class="dot"></span><span>${taskTime(task)}</span><span class="dot"></span><span>${task.status}</span></div></button><div class="task-meta">${overdue(task) ? '<span class="tag risk">逾期</span>' : active(task) && task.dueDate === TODAY ? '<span class="tag due">今天到期</span>' : ''}${priorityTag(task.priority)}</div></div>`;
}
function renderTasks() {
  const today = tasks.filter(task => isToday(task) && task.status !== '已取消');
  const thisWeek = tasks.filter(task => isWeek(task) && task.status !== '已取消');
  const rate = thisWeek.length ? Math.round(thisWeek.filter(task => task.status === '已完成').length / thisWeek.length * 100) : null;
  $('weekRate').innerHTML = rate === null ? '—' : `${rate}<small>%</small>`; $('weekProgress').style.width = `${rate || 0}%`;
  $('todayCount').innerHTML = `${today.length}<small>项</small>`; $('pendingCount').innerHTML = `${today.filter(active).length}<small>项</small>`;

  document.querySelector('.metric-value.alert').innerHTML = `${tasks.filter(overdue).length}<small>项</small>`;
  $('taskList').innerHTML = renderTaskBoard(sortTasks(today), 'home');
  renderDashboard();
}
function renderCalendar() { renderMonthCalendar(); }
function renderHomeExtras() { renderHomeGoals(); }
function navigate(page, changeHash = true) {
  if (!pageNames[page]) page = 'home';
  if(dragSession)finishCardDrag(false,true);
  if(page!=='home' && calendarIsOpen())dismissCalendarImmediately();
  pageScroll[currentPage] = window.scrollY; currentPage = page;
  for (const name of Object.keys(pageNames)) $('page-'+name).hidden = name !== page;
  document.querySelectorAll('.nav [data-page]').forEach(button => { button.classList.toggle('active',button.dataset.page === page); if (button.dataset.page === page) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current'); });
  document.querySelector('.breadcrumbs').innerHTML = `<strong>${pageNames[page]}</strong><span>/</span><span>${page === 'home' ? '今天' : page === 'plans' ? '安排未来' : page === 'tasks' ? '统一任务列表' : '工作轨迹'}</span>`;
  if (page === 'plans' && !$('page-plans').innerHTML) renderPlanListPage();
  if (page === 'tasks' && !$('page-tasks').innerHTML) renderTaskPage();
  if (page === 'logs' && !$('page-logs').innerHTML) renderLogPage();
  if (changeHash && location.hash !== '#'+page) history.replaceState(null,'','#'+page);
  $('calendarDock').hidden=page!=='home' || !hasEnteredWorkspace;
  window.scrollTo(0,pageScroll[page] || 0);
}
function ruleLabel(plan) {
  if (plan.type === 'goal') return `${shortDate(plan.start)} – ${shortDate(plan.end)}`;
  if (plan.type === 'once') return `${shortDate(plan.start)}执行`;
  const cycle = plan.cycle === 'daily' ? '每天' : plan.cycle === 'monthly' ? `每月 ${plan.monthday} 日` : `每周${plan.weekdays.map(day => '日一二三四五六'[day]).join('、')}`;
  return `${cycle}${plan.time ? ' '+plan.time : ''}`;
}
function renderPlanListPage() {
  planView = {mode:'list'};
  $('page-plans').innerHTML = `<div class="page-intro"><div><div class="section-kicker">让重复工作有节奏，让长期目标有落点</div><h1>工作计划</h1><p class="subtitle">定义安排与目标，执行交给独立任务。</p></div><button class="primary" data-new-plan>${icon('plus')}新建计划</button></div><div class="workspace-layout"><section class="work-canvas"><div class="view-toolbar"><div class="tabs" role="tablist" aria-label="计划类型">${[['all','全部'],['goal','目标'],['recurring','周期'],['once','一次性']].map(([key,label])=>`<button role="tab" data-plan-filter="${key}" aria-selected="${planFilters.type===key}">${label}</button>`).join('')}</div><label class="inline-search">${icon('search','icon-sm')}<input id="planQuery" type="search" aria-label="搜索计划" placeholder="搜索计划名称" value="${escapeHtml(planFilters.query)}"/></label></div><div id="planRows"></div><div class="list-footer"><span id="planCount"></span><span>计划定义安排，任务记录执行</span></div></section><aside class="workspace-aside"><h2 class="aside-heading">接下来的计划任务</h2><div id="planUpcoming"></div><div class="info-note">未来 14 天内的周期任务提前生成；每次执行有独立状态与工作记录。</div></aside></div>`;
  $('planQuery').oninput = event => { planFilters.query = event.target.value; renderPlanRows(); };
  renderPlanRows();
}
function renderPlanRows() {
  if (!$('planRows')) return;
  const items = plans.filter(plan => (planFilters.type === 'all' || plan.type === planFilters.type) && plan.title.toLowerCase().includes(planFilters.query.toLowerCase()));
  $('planRows').innerHTML = ['goal','recurring','once'].map(type => {
    const group = items.filter(plan => plan.type === type); if (!group.length) return '';
    return `<div class="section-label">${planTypes[type]}<span class="count-label">${group.length} 项</span></div>${group.map(plan => { const rate = plan.type === 'goal' ? goalProgress(plan) : null; return `<div class="plan-row"><div class="plan-kind-icon ${type === 'goal' ? 'goal-kind' : type === 'once' ? 'once-kind' : ''}">${icon(type === 'goal' ? 'checklist' : 'calendar')}</div><div><button class="object-title" data-plan="${plan.id}">${escapeHtml(plan.title)}</button><div class="object-meta">${ruleLabel(plan)}${plan.type === 'goal' ? '' : ' · '+tasks.filter(task=>task.planId===plan.id && active(task)).length+' 个待执行任务'}${plan.lastEffective?' · '+shortDate(plan.lastEffective)+'起'+(plan.status==='启用'?'恢复':plan.status):''}</div>${rate !== null ? `<div class="mini-progress"><div class="progress-line"><span style="width:${rate}%"></span></div>${rate}% · 子任务汇总</div>` : ''}</div><div><span class="tag ${plan.type === 'goal' ? 'ongoing' : 'source'}">${plan.type === 'once' ? escapeHtml(tasks.find(task=>task.planId===plan.id)?.status || plan.status) : plan.status}</span></div>${icon('chevron-right','icon-sm')}</div>`; }).join('')}`;
  }).join('') || '<div class="empty">没有找到匹配的计划。<br>试试其他名称或计划类型。</div>';
  $('planCount').textContent = `共 ${items.length} 项计划`;
  if ($('planUpcoming')) $('planUpcoming').innerHTML = tasks.filter(task=>task.planId && active(task) && task.executionDate >= TODAY).sort((a,b)=>a.executionDate.localeCompare(b.executionDate)).slice(0,4).map(task=>`<div class="schedule-item"><div class="schedule-date">${Number(task.executionDate.slice(5,7))} 月<strong>${Number(task.executionDate.slice(8,10))}</strong></div><div><button class="object-title" data-open-task="${task.id}">${escapeHtml(task.title)}</button><div class="object-meta">${task.startTime || '全天'} · ${escapeHtml(task.source)}</div></div></div>`).join('') || '<p class="aside-copy">当前没有未来安排。</p>';
}
function openPlan(id) { navigate('plans'); planView = {mode:'detail',id}; renderPlanDetail(id); window.scrollTo(0,0); }
function renderPlanDetail(id) {
  const plan = getPlan(id); if (!plan) return;
  const children = sortTasks(tasks.filter(task=>task.planId===id));
  const rate = plan.type === 'goal' ? goalProgress(plan) : null;
  const related = logs.filter(log=>getTask(log.taskId)?.planId===id);
  $('page-plans').innerHTML = `<button class="back-link" data-plan-back>${icon('chevron-left','icon-sm')}全部计划</button><div class="page-intro"><div><div class="section-kicker">${planTypes[plan.type]} · ${plan.status}</div><h1>${escapeHtml(plan.title)}</h1><p class="subtitle">${escapeHtml(plan.description || '为这项计划安排独立的执行任务。')}</p></div><button class="secondary" data-plan-logs="${id}">${icon('note','icon-sm')}相关工作记录</button></div><div class="detail-page-grid"><section class="work-canvas">${plan.type === 'goal' ? `<div class="detail-block"><h2>完成标准</h2><p>${escapeHtml(plan.standard)}</p><div class="mini-progress"><div class="progress-line" style="width:220px"><span style="width:${rate || 0}%"></span></div><strong>${rate ?? '—'}%</strong> · 来自 ${children.filter(task=>task.status!=='已取消').length} 个有效执行任务</div></div><div class="section-label">执行任务<span class="count-label">目标本身不重复计数</span></div>${children.map(taskRow).join('')}` : `<div class="detail-block"><h2>${plan.type === 'once' ? '执行安排' : '周期规则'}</h2><p>${ruleLabel(plan)}${plan.type === 'recurring' ? `；${shortDate(plan.start)}起生效。${plan.endMode === 'never' ? '持续生成，直至暂停或终止。' : plan.endMode === 'date' ? shortDate(plan.end)+'结束。' : '共发生 '+plan.count+' 次。'}` : '，对应一条独立任务。'}</p></div><div class="detail-block"><h2>${plan.type === 'once' ? '执行任务' : '未来任务与发生日预览'}</h2><div class="occurrence-list">${children.filter(task=>(task.executionDate || task.dueDate)>=TODAY).map(task=>`<div class="occurrence"><span class="occurrence-date">${shortDate(task.executionDate || task.dueDate)}</span><button class="object-title" data-open-task="${task.id}">${escapeHtml(task.title)}</button><span class="tag source">已生成 · ${task.status}</span></div>`).join('') || '<p>当前没有待执行任务。</p>'}${plan.type === 'recurring' ? generatePlanDates(plan,6).filter(date=>!children.some(task=>task.executionDate===date)).map(date=>`<div class="occurrence"><span class="occurrence-date">${shortDate(date)}</span><span class="muted">${escapeHtml(plan.title)}</span><span class="tag source">日期预览 · 尚未生成</span></div>`).join('') : ''}</div></div><div class="detail-block"><h2>执行历史</h2>${children.filter(task=>(task.executionDate || task.dueDate)<TODAY || task.status==='已完成').map(task=>`<div class="occurrence"><span class="occurrence-date">${shortDate(task.executionDate || task.dueDate)}</span><button class="object-title" data-open-task="${task.id}">${escapeHtml(task.title)}</button><span class="tag finished">${task.status}</span></div>`).join('') || '<p>执行后，历史会保留在这里。</p>'}</div>`}</section><aside><h2 class="aside-heading">计划信息</h2><dl class="detail-grid"><dt>类型</dt><dd>${planTypes[plan.type]}</dd><dt>优先级</dt><dd>${plan.priority}</dd><dt>开始日期</dt><dd>${shortDate(plan.start)}</dd>${plan.end ? `<dt>截止日期</dt><dd>${shortDate(plan.end)}</dd>` : ''}<dt>工作记录</dt><dd>${related.length} 条</dd></dl><div class="info-note">${plan.type === 'goal' ? '目标进度由执行任务汇总。达到 100% 后，还需核对完成标准并显式完成目标。' : plan.type === 'once' ? '一次性计划保留正式安排与执行历史；任务详情承载本次执行。' : '任务详情中的改期仅影响本次。后续规则调整需明确生效日期，并保留已有执行事实。'}</div></aside></div>`;
  const aside=$('page-plans').querySelector('.detail-page-grid > aside');
  if(plan.type==='recurring' && plan.status!=='终止')aside.insertAdjacentHTML('beforeend',`<div style="display:grid;gap:9px;margin-top:22px"><button class="secondary" data-plan-impact="${plan.id}" data-impact-action="${plan.status==='暂停'?'resume':'pause'}">${plan.status==='暂停'?'恢复生成':'暂停生成'}</button><button class="text-button" style="color:var(--danger)" data-plan-impact="${plan.id}" data-impact-action="terminate">终止计划</button></div>`);
  if(plan.type==='goal' && plan.decomposed)$('page-plans').querySelector('.page-intro').insertAdjacentHTML('beforeend',`<button class="primary" data-new-child="${plan.id}">${icon('plus')}添加子任务</button>`);
}
function renderTaskPage() {
  $('page-tasks').innerHTML = `<div class="page-intro"><div><div class="section-kicker">每一项具体工作，都在这里推进</div><h1>任务中心</h1><p class="subtitle">周期、目标与临时任务，共用一份执行清单。</p></div><button class="primary" data-new-task>${icon('plus')}新建临时任务</button></div><section class="work-canvas"><div class="view-toolbar"><div class="task-period-filter" role="group" aria-label="任务日期范围"><span>日期</span>${[['all','全部时间'],['today','今日'],['week','本周'],['month','本月']].map(([key,label])=>`<button data-task-period="${key}" aria-pressed="${taskFilters.view===key && !taskFilters.date}">${label}</button>`).join('')}<span id="taskCustomDate" ${taskFilters.date?'':'hidden'}>${shortDate(taskFilters.date)}</span></div><div class="task-view-controls"><div class="view-switch" role="group" aria-label="任务显示方式"><button data-task-layout="cards" aria-pressed="${taskLayout==='cards'}">${icon('grid','icon-sm')}卡片</button><button data-task-layout="list" aria-pressed="${taskLayout==='list'}">${icon('checklist','icon-sm')}条形目录</button></div><label class="inline-search">${icon('search','icon-sm')}<input id="taskQuery" type="search" aria-label="搜索任务名称" placeholder="搜索任务名称" value="${escapeHtml(taskFilters.query)}"/></label></div></div><div class="filter-row"><label for="taskStatus">状态</label><select id="taskStatus"><option value="">全部状态</option><option value="pending">未完成</option><option value="待办">待办</option><option value="进行中">进行中</option><option value="overdue">逾期</option><option value="已暂停">已暂停</option><option value="已完成">已完成</option><option value="已取消">已取消</option></select><label for="taskSource">来源</label><select id="taskSource"><option value="">全部来源</option><option value="plan">周期／一次性计划</option><option value="goal">目标计划</option><option value="manual">临时新增</option></select><label for="taskPriority">优先级</label><select id="taskPriority"><option value="">全部优先级</option>${['P0','P1','P2','P3'].map(value=>`<option>${value}</option>`).join('')}</select><button class="text-button" id="clearTaskFilters">重置筛选</button></div><div class="task-gallery" id="taskCardView"></div><div class="table-scroll" id="taskTableView"><table class="data-table"><thead><tr><th>任务名称</th><th>状态</th><th>优先级</th><th>来源</th><th>执行／截止</th><th>进度</th></tr></thead><tbody id="taskTableBody"></tbody></table></div><div class="list-footer"><span id="taskResultCount"></span><span id="taskViewHint"></span></div></section>`;
  $('taskQuery').oninput = event=>{ taskFilters.query=event.target.value; renderTaskCenterRows(); };
  for (const [id,key] of [['taskSource','source'],['taskPriority','priority'],['taskStatus','status']]) { $(id).value=taskFilters[key]; $(id).onchange=event=>{taskFilters[key]=event.target.value;renderTaskCenterRows();}; }
  $('clearTaskFilters').onclick=()=>{ Object.assign(taskFilters,{view:'all',date:'',query:'',source:'',priority:'',status:''});renderTaskPage(); };
  renderTaskCenterRows();
}
function filteredTasks() {
  return sortTasks(tasks.filter(task=>{
    const view=taskFilters.view, dates=[task.executionDate,task.dueDate].filter(Boolean), status=taskFilters.status;
    const inDate=taskFilters.date?dates.includes(taskFilters.date):view==='all' || view==='today' && isToday(task) || view==='week' && isWeek(task) || view==='month' && dates.some(date=>date.slice(0,7)===TODAY.slice(0,7));
    const inStatus=!status || (status==='pending'?active(task):status==='overdue'?overdue(task):task.status===status);
    return inDate && inStatus && (!taskFilters.source || task.sourceKey===taskFilters.source) && (!taskFilters.priority || task.priority===taskFilters.priority) && task.title.toLowerCase().includes(taskFilters.query.toLowerCase());
  }));
}
function renderTaskCenterRows() {
  if (!$('taskTableBody')) return;
  const items=filteredTasks();
  $('taskCardView').innerHTML=items.length?items.map(task=>taskCard(task,false)).join(''):'<div class="empty">没有符合条件的任务。<br>调整筛选，或新增临时任务。</div>';
  $('taskCardView').hidden=taskLayout!=='cards';$('taskTableView').hidden=taskLayout!=='list';
  document.querySelectorAll('[data-task-layout]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.taskLayout===taskLayout)));
  $('taskViewHint').textContent=taskLayout==='cards'?'打开卡片查看详情、推进状态或记录工作':'未终结优先，依次按逾期、临近截止、优先级与日期排序';
  $('taskTableBody').innerHTML=items.length ? items.map(task=>`<tr><td><div class="task-cell">${taskCheck(task)}<div><button class="object-title" data-open-task="${task.id}">${escapeHtml(task.title)}</button><div class="task-id">${task.id.toUpperCase()}${task.planId ? ' / '+escapeHtml(getPlan(task.planId)?.title) : ''}</div></div></div></td><td>${stateMark(task.status)}</td><td>${priorityTag(task.priority)}</td><td class="muted">${escapeHtml(task.source)}</td><td><div>${shortDate(task.executionDate || task.dueDate)}${!task.executionDate && task.dueDate ? ' 到期' : ''}</div>${overdue(task) ? '<div class="risk-inline">已逾期</div>' : task.dueDate && task.executionDate !== task.dueDate ? `<div class="task-id">${shortDate(task.dueDate)}截止</div>` : ''}</td><td>${progressBar(task.progress)}</td></tr>`).join('') : '<tr><td colspan="6"><div class="empty">没有符合条件的任务。<br>调整筛选，或新增临时任务。</div></td></tr>';
  $('taskResultCount').textContent=`显示 ${items.length} / ${tasks.length} 项任务`;
  document.querySelectorAll('[data-task-period]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.taskPeriod===taskFilters.view && !taskFilters.date)));
  $('taskCustomDate').hidden=!taskFilters.date;$('taskCustomDate').textContent=shortDate(taskFilters.date);
}
function renderLogPage() {
  $('page-logs').innerHTML=`<div class="page-intro"><div><div class="section-kicker">把实际做过的工作，留下来</div><h1>工作记录</h1><p class="subtitle">记录成果、投入与卡点，回看每一步推进。</p></div><button class="primary" data-new-log>${icon('plus')}新增工作记录</button></div><div class="workspace-layout"><section class="work-canvas"><div class="view-toolbar"><div class="tabs" role="tablist" aria-label="记录日期范围"><button role="tab" data-log-range="week" aria-selected="${logFilters.from===WEEK_START && logFilters.to===WEEK_END}">本周</button><button role="tab" data-log-range="recent" aria-selected="${logFilters.from==='2026-10-14'}">近 7 天</button><button role="tab" data-log-range="all" aria-selected="${!logFilters.from && !logFilters.to}">全部时间</button></div><label class="inline-search">${icon('search','icon-sm')}<input id="logQuery" type="search" aria-label="搜索工作内容" placeholder="搜索工作内容" value="${escapeHtml(logFilters.query)}"/></label></div><div class="filter-row"><label for="logFrom">日期</label><input type="date" id="logFrom" value="${logFilters.from}" aria-label="记录开始日期"/><span class="muted">至</span><input type="date" id="logTo" value="${logFilters.to}" aria-label="记录结束日期"/><select id="logTask" aria-label="按任务查询"><option value="">全部任务</option><option value="independent">独立记录</option>${tasks.map(task=>`<option value="${task.id}">${escapeHtml(task.title)} · ${task.id.toUpperCase()}</option>`).join('')}</select><select id="logPlan" aria-label="按计划查询"><option value="">全部计划</option>${plans.map(plan=>`<option value="${plan.id}">${escapeHtml(plan.title)}</option>`).join('')}</select><button class="text-button" id="clearLogFilters">重置</button></div><div id="logEntries"></div><div class="list-footer"><span id="logResultCount"></span><span>工作日期与实际操作时间分别保留</span></div></section><aside class="workspace-aside"><h2 class="aside-heading">当前查询范围</h2><div class="record-stats"><div><strong id="logTotal">0</strong><span>条工作记录</span></div><div><strong id="logHours">0</strong><span>小时实际投入</span></div></div><p class="aside-copy">每条记录保存实际工作、成果和下一步。耗时描述投入，进度描述推进程度。</p><div class="info-note">允许独立记录临时协助与会议。独立记录不计入任务完成率。</div><button class="text-button" style="margin-top:18px" data-new-log>补记一项工作</button></aside></div>`;
  $('logTask').value=logFilters.task; $('logPlan').value=logFilters.plan;
  for (const [id,key] of [['logQuery','query'],['logFrom','from'],['logTo','to'],['logTask','task'],['logPlan','plan']]) $(id)[id==='logQuery'?'oninput':'onchange']=event=>{logFilters[key]=event.target.value;renderLogRows();};
  $('clearLogFilters').onclick=()=>{Object.assign(logFilters,{query:'',from:WEEK_START,to:WEEK_END,task:'',plan:''});renderLogPage();};
  renderLogRows();
}
function syncLogFilterOptions() {
  if($('logTask') && $('logTask').options.length!==tasks.length+2){$('logTask').innerHTML='<option value="">全部任务</option><option value="independent">独立记录</option>'+tasks.map(task=>`<option value="${task.id}">${escapeHtml(task.title)} · ${task.id.toUpperCase()}</option>`).join('');$('logTask').value=logFilters.task;}
  if($('logPlan') && $('logPlan').options.length!==plans.length+1){$('logPlan').innerHTML='<option value="">全部计划</option>'+plans.map(plan=>`<option value="${plan.id}">${escapeHtml(plan.title)}</option>`).join('');$('logPlan').value=logFilters.plan;}
}
function filteredLogs() {
  return logs.filter(log=>(!logFilters.from || log.date>=logFilters.from) && (!logFilters.to || log.date<=logFilters.to) && (!logFilters.task || (logFilters.task==='independent' ? !log.taskId : log.taskId===logFilters.task)) && (!logFilters.plan || getTask(log.taskId)?.planId===logFilters.plan) && (log.content+' '+log.outcome+' '+log.blocker).toLowerCase().includes(logFilters.query.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date) || b.savedAt.localeCompare(a.savedAt));
}
function renderLogRows() {
  if (!$('logEntries')) return;
  syncLogFilterOptions();
  if(logFilters.from && logFilters.to && logFilters.from>logFilters.to){$('logEntries').innerHTML='<div class="empty">结束日期不能早于开始日期，请调整日期范围。</div>';$('logResultCount').textContent='日期范围无效';$('logTotal').textContent='—';$('logHours').textContent='—';return;}
  const items=filteredLogs(); const dates=[...new Set(items.map(log=>log.date))];
  $('logEntries').innerHTML=items.length ? dates.map(date=>{const group=items.filter(log=>log.date===date);return `<div class="record-layout"><div class="record-day"><strong>${Number(date.slice(8,10))}</strong><small>${Number(date.slice(5,7))} 月 · ${date===TODAY?'今天':'星期'+'日一二三四五六'[new Date(date+'T12:00:00').getDay()]}</small></div><div class="record-day-items">${group.map(log=>`<article class="log-entry"><div class="log-entry-head"><button class="object-title" data-open-log="${log.id}">${escapeHtml(log.content)}</button>${log.hours ? `<span class="tag source">${log.hours}h</span>` : ''}</div>${log.outcome ? `<p>${escapeHtml(log.outcome)}</p>` : ''}<div class="log-entry-meta">${log.taskId ? `<button class="linked-object" data-open-task="${log.taskId}">${escapeHtml(log.taskTitle)}</button>` : '<span class="tag source">独立记录</span>'}${log.progressTo!==undefined ? `<span>进度 ${log.progressFrom}% → ${log.progressTo}%</span>` : ''}${log.blocker ? '<span style="color:var(--warn)">有卡点记录</span>' : ''}${log.versions.length ? '<span>已更正</span>' : ''}<button class="text-button" data-open-log="${log.id}">查看记录</button></div></article>`).join('')}</div></div>`;}).join('') : '<div class="empty">当前日期与条件下没有工作记录。<br>扩大日期范围，或补记一项实际工作。</div>';
  $('logResultCount').textContent=`共 ${items.length} 条记录`;
  $('logTotal').textContent=items.length; $('logHours').textContent=Number(items.reduce((sum,log)=>sum+Number(log.hours || 0),0).toFixed(2));
  document.querySelectorAll('[data-log-range]').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.logRange==='week' ? logFilters.from===WEEK_START && logFilters.to===WEEK_END : tab.dataset.logRange==='recent' ? logFilters.from==='2026-10-14' && logFilters.to===TODAY : !logFilters.from && !logFilters.to)));
}
function generatePlanDates(plan, limit=6) {
  if (plan.type==='once') return [plan.start];
  if (plan.type!=='recurring') return [];
  const dates=[]; const start=new Date((plan.start>TODAY?plan.start:TODAY)+'T12:00:00');
  for(let offset=0;offset<400 && dates.length<limit;offset++) {
    const date=new Date(start);date.setDate(start.getDate()+offset);const key=dateKey(date);
    if(plan.endMode==='date' && key>plan.end) break;
    if(plan.endMode==='count' && dates.length>=plan.count) break;
    const lastDay=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
    const day=plan.monthday>lastDay && plan.monthFallback==='last' ? lastDay : plan.monthday;
    if(plan.cycle==='daily' || plan.cycle==='weekly' && plan.weekdays.includes(date.getDay()) || plan.cycle==='monthly' && date.getDate()===Number(day)) dates.push(key);
  }
  return dates;
}
let newPlanType='recurring';
function renderPlanForm(type='recurring') {
  newPlanType=type;planView={mode:'form'};
  $('page-plans').innerHTML=`<button class="back-link" data-plan-back>${icon('chevron-left','icon-sm')}全部计划</button><div class="page-intro"><div><h1>新建工作计划</h1><p class="subtitle">先定义意图，再让任务承接每一次执行。</p></div></div><div class="form-layout"><form class="form-canvas" id="planForm"><div class="type-picker">${[['recurring','周期计划','按固定日期重复发生'],['goal','目标计划','围绕明确结果推进'],['once','一次性计划','只安排一次工作']].map(([key,label,copy])=>`<button class="type-option" type="button" data-plan-type="${key}" aria-pressed="${key===type}"><strong>${label}</strong><small>${copy}</small></button>`).join('')}</div><div class="field"><label for="planName">计划名称 *</label><input id="planName" required maxlength="80" placeholder="${type==='goal'?'例如：11 月底前完成平台 V1':type==='once'?'例如：准备月度工作汇报':'例如：每周工作回顾'}"/></div><div class="field"><label for="planDescription">${type==='goal'?'目标说明':'计划说明'}</label><textarea id="planDescription" placeholder="补充这项工作的背景与要求"></textarea></div><div class="field-pair"><div class="field"><label for="planStart">${type==='once'?'执行日期':'开始／生效日期'} *</label><input id="planStart" type="date" value="${TODAY}" ${type==='recurring'?'min="'+TODAY+'"':''} required/></div><div class="field"><label for="planPriority">优先级</label><select id="planPriority">${['P2','P1','P0','P3'].map(p=>`<option>${p}</option>`).join('')}</select></div></div>${type==='recurring'?`<h2>发生规则</h2><div class="field"><label for="planCycle">循环方式 *</label><select id="planCycle"><option value="weekly">每周</option><option value="daily">每天</option><option value="monthly">每月</option></select></div><div id="cycleFields"></div><div class="field-pair"><div class="field"><label for="planTime">开始时间</label><input type="time" id="planTime" value="09:00"/></div><div class="field"><label for="planEndMode">结束条件 *</label><select id="planEndMode"><option value="never">永不结束</option><option value="date">指定日期</option><option value="count">指定次数</option></select></div></div><div id="endFields"></div>`:type==='goal'?`<div class="field"><label for="planGoalEnd">截止日期 *</label><input type="date" id="planGoalEnd" value="2026-11-30" min="${TODAY}" required/></div><div class="field"><label for="planStandard">完成标准 *</label><textarea id="planStandard" required placeholder="什么结果可以说明目标已经达成？"></textarea></div>`:''}<div class="form-buttons"><button type="button" class="secondary" data-plan-back>取消</button><button type="submit" class="primary">创建计划</button></div></form><aside><h2 class="aside-heading" id="previewHeading">${type==='goal'?'执行方式':'未来发生日预览'}</h2><div id="planPreview"></div><div class="info-note">${type==='goal'?'未拆解时，由一条目标任务承接执行；后续可拆解为子任务。':'预览不等于任务。保存后，未来 14 天内的周期实例成为可操作的独立任务。'}</div></aside></div>`;
  if(type==='recurring'){renderCycleFields();$('planCycle').onchange=()=>{renderCycleFields();renderPlanPreview();};$('planEndMode').onchange=()=>{const mode=$('planEndMode').value;$('endFields').innerHTML=mode==='date'?'<div class="field"><label for="planEndDate">结束日期 *</label><input id="planEndDate" type="date" min="'+TODAY+'" required/></div>':mode==='count'?'<div class="field"><label for="planCountInput">发生次数 *</label><input id="planCountInput" type="number" min="1" max="1000" value="12" required/></div>':'';renderPlanPreview();};}
  $('planForm').oninput=renderPlanPreview;$('planForm').onchange=renderPlanPreview;
  $('planForm').onsubmit=event=>{event.preventDefault();savePlan();};renderPlanPreview();
}
function renderCycleFields() {
  const cycle=$('planCycle').value;
  $('cycleFields').innerHTML=cycle==='weekly'?`<div class="field"><label>每周执行日 *</label><div class="weekday-picker">${[1,2,3,4,5,6,0].map(day=>`<label><input type="checkbox" name="weekday" value="${day}" ${day===1?'checked':''}/>周${'日一二三四五六'[day]}</label>`).join('')}</div></div>`:cycle==='monthly'?'<div class="field-pair"><div class="field"><label for="planMonthDay">每月日期 *</label><input type="number" id="planMonthDay" min="1" max="31" value="31" required/></div><div class="field"><label for="planMonthFallback">当月不存在此日期 *</label><select id="planMonthFallback" required><option value="">请选择处理方式</option><option value="skip">跳过本月</option><option value="last">当月最后一天</option></select></div></div>':'<p class="field-hint">每天产生一个独立任务，一期不包含工作日或节假日规则。</p>';
}
function readPlanForm() {
  return {type:newPlanType,title:$('planName').value.trim(),description:$('planDescription').value.trim(),priority:$('planPriority').value,status:newPlanType==='recurring'?'启用':newPlanType==='goal'?'待开始':'待办',start:$('planStart').value,cycle:$('planCycle')?.value,weekdays:[...document.querySelectorAll('[name="weekday"]:checked')].map(input=>Number(input.value)),monthday:Number($('planMonthDay')?.value),monthFallback:$('planMonthFallback')?.value,time:$('planTime')?.value,endMode:$('planEndMode')?.value,end:$('planGoalEnd')?.value || $('planEndDate')?.value || (newPlanType==='once'?$('planStart').value:''),count:Number($('planCountInput')?.value || 0),standard:$('planStandard')?.value.trim()};
}
function renderPlanPreview() {
  const plan=readPlanForm();
  if(plan.type==='goal'){$('planPreview').innerHTML='<p class="aside-copy">创建后会建立一条同名执行任务，可记录工作与更新进度。目标不会额外计入任务数量。</p>';return;}
  if(plan.cycle==='monthly' && !plan.monthFallback){$('planPreview').innerHTML='<p class="aside-copy">先选择月末缺失日期的处理方式，预览会同步更新。</p>';return;}
  const dates=generatePlanDates(plan);
  $('planPreview').innerHTML=dates.length?dates.map(date=>`<div class="preview-date">${shortDate(date)}<small>${plan.type==='once' || date<WINDOW_END?'保存后可执行':'仅日期预览'}</small></div>`).join(''):'<p class="aside-copy">当前规则没有未来发生日。请检查执行日、起止日期与结束条件。</p>';
}
function addTask(data) {
  const task={id:'t'+(++sequence),priority:'P2',status:'待办',progress:0,executionDate:'',dueDate:'',source:'临时任务',sourceKey:'manual',notes:'',events:['刚刚 · 创建任务'],...data};tasks.unshift(task);return task;
}
function savePlan() {
  if(!$('planForm').reportValidity())return;
  const plan=readPlanForm();
  if(plan.type==='goal' && !plan.standard){showToast('请填写明确的完成标准');return;}
  if(!plan.title){$('planName').setCustomValidity('请输入计划名称');$('planName').reportValidity();$('planName').setCustomValidity('');return;}
  if(plan.type==='recurring' && plan.cycle==='weekly' && !plan.weekdays.length){showToast('至少选择一个每周执行日');return;}
  if(plan.end && plan.end<plan.start){showToast('截止／结束日期不能早于开始日期');return;}
  plan.id='p'+(++sequence);plans.unshift(plan);
  if(plan.type==='goal')addTask({title:plan.title,source:'目标任务',sourceKey:'goal',planId:plan.id,priority:plan.priority,executionDate:plan.start,dueDate:plan.end,notes:plan.description});
  else for(const date of generatePlanDates(plan,100).filter(date=>plan.type==='once'||date<WINDOW_END))addTask({title:plan.title,source:plan.type==='once'?'一次性计划':'周期计划',sourceKey:'plan',planId:plan.id,priority:plan.priority,executionDate:date,dueDate:date,startTime:plan.time,notes:plan.description});
  planView={mode:'detail',id:plan.id};renderPlanDetail(plan.id);refreshAll();showToast('计划已创建，相关任务已加入执行清单');window.scrollTo(0,0);
}
function openDrawer(mode,id,trigger) {
  returnFocus=trigger || document.activeElement;returnPopupAnchor=capturePopupReturn(returnFocus);drawerHistory=[];drawerMode=mode;activeTaskId=['detail','record','reschedule'].includes(mode)?id:null;activeLogId=['log','editLog'].includes(mode)?id:null;createDateOverride=mode==='create'?id:null;activePlanId=['planImpact','createChild','gantt'].includes(mode)?id:null;
  toggleTaskSearch(false);$('overlay').classList.add('open');$('drawer').classList.add('open');$('drawer').setAttribute('aria-hidden','false');$('drawer').inert=false;document.querySelector('.shell').inert=true;document.body.style.overflow='hidden';renderDrawer();syncSurfaceInert();animatePopup($('drawer'),returnFocus,true);$('closeDrawer').focus();
}
function switchDrawer(mode,id,trigger=document.activeElement) {
  const origin=trigger?.getBoundingClientRect();
  cancelPopupFlight($('drawer'));drawerHistory.push({mode:drawerMode,taskId:activeTaskId,logId:activeLogId,planId:activePlanId});drawerMode=mode;activeTaskId=['detail','record','reschedule'].includes(mode)?id:null;activeLogId=['log','editLog'].includes(mode)?id:null;renderDrawer();animatePopup($('drawer'),null,true,origin);$('closeDrawer').focus();
}
async function closeDrawer(force=false) {
  if(!force && $('drawerBody').querySelector('form[data-dirty="true"]') && !await askConfirmation('放弃尚未保存的填写内容？'))return;
  const id=activeTaskId,target=resolvePopupReturn(returnPopupAnchor);animatePopup($('drawer'),target,false,target?null:returnPopupAnchor?.rect);$('overlay').classList.remove('open');$('drawer').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');$('drawer').inert=true;document.querySelector('.shell').inert=false;document.body.style.overflow='';activeTaskId=null;activeLogId=null;drawerMode=null;
  syncSurfaceInert();
  if(target?.isConnected && !target.closest('[inert]'))target.focus();else if(calendarIsOpen())$('enterWorkspace').focus();else(document.querySelector(`#page-${currentPage} [data-drag-handle="${id}"]`) || document.querySelector(`.nav [data-page="${currentPage}"]`)).focus();
}
async function drawerBack(trigger=document.activeElement) {
  if($('drawerBody').querySelector('form[data-dirty="true"]') && !await askConfirmation('放弃尚未保存的填写内容？'))return;
  const origin=trigger?.getBoundingClientRect();cancelPopupFlight($('drawer'));const previous=drawerHistory.pop();if(!previous){closeDrawer(true);return;}drawerMode=previous.mode;activeTaskId=previous.taskId;activeLogId=previous.logId;activePlanId=previous.planId;renderDrawer();animatePopup($('drawer'),null,true,origin);$('closeDrawer').focus();
}
function drawerBackMarkup() { return drawerHistory.length?`<button class="back-link" data-drawer-back>${icon('chevron-left','icon-sm')}返回上一项</button>`:''; }
function renderDrawer() {
  cancelPopupFlight($('drawer'));const task=getTask(activeTaskId);setWindowPresentation(drawerMode);$('drawerFooter').innerHTML='';
  if(drawerMode==='gantt'){renderGoalGantt(getPlan(activePlanId));}
  else if(drawerMode==='planImpact'){renderPlanImpact(getPlan(activePlanId));}
  else if(drawerMode==='detail' && task){
    $('drawerEyebrow').textContent='任务详情 · '+task.id.toUpperCase();
    const linkedLogs=taskLogs(task.id), hours=linkedLogs.reduce((sum,log)=>sum+Number(log.hours || 0),0);
    $('drawerBody').innerHTML=`${drawerBackMarkup()}<h2 class="drawer-title">${escapeHtml(task.title)}</h2><div class="drawer-actions">${task.status!=='已取消'?`<button class="primary" id="detailComplete">${icon('check','icon-sm')}${task.status==='已完成'?'撤销完成':'完成任务'}</button>`:''}${active(task)?`<button class="secondary" id="detailState">${task.status==='进行中'?'暂停':task.status==='已暂停'?'继续':'开始'}</button>`:''}<button class="secondary" id="detailRecord">${icon('pen','icon-sm')}写工作记录</button></div><div class="detail-section"><h3>任务信息</h3><dl class="detail-grid"><dt>状态</dt><dd>${stateMark(task.status)}</dd><dt>优先级</dt><dd>${task.priority}</dd><dt>来源</dt><dd>${escapeHtml(task.source)}</dd>${task.planId?`<dt>关联计划</dt><dd><button class="linked-object" id="detailPlan">${escapeHtml(getPlan(task.planId)?.title)}</button></dd>`:''}<dt>执行日期</dt><dd>${shortDate(task.executionDate)} ${task.startTime || ''}</dd><dt>截止日期</dt><dd>${shortDate(task.dueDate)}${overdue(task)?' · 已逾期':''}</dd><dt>当前进度</dt><dd>${task.progress}%</dd><dt>实际投入</dt><dd>${hours} 小时</dd></dl>${active(task)?'<button class="text-button" style="margin-top:15px" id="rescheduleTask">调整日期</button>':''}</div><div class="detail-section"><h3>当前工作</h3><p class="detail-copy">${escapeHtml(task.notes || '尚未补充任务说明。')}</p>${task.blocker?`<div class="info-note" style="border-color:var(--warn);color:var(--warn);background:var(--warn-soft)">当前卡点：${escapeHtml(task.blocker)}<br><button class="text-button" id="resolveBlocker">标为已解决</button></div>`:''}</div><div class="detail-section"><h3>工作记录 · ${linkedLogs.length}</h3>${linkedLogs.map(log=>`<div class="detail-event"><button class="linked-object" data-switch-log="${log.id}">${escapeHtml(log.content)}</button><small>${shortDate(log.date)}${log.hours?' · '+log.hours+' 小时':''}</small></div>`).join('') || '<p class="detail-copy">还没有工作记录。执行后可在这里留下成果与卡点。</p>'}</div><div class="detail-section"><h3>进度与历史</h3>${task.events.map(event=>`<div class="detail-event">${escapeHtml(event.split(' · ').slice(1).join(' · ') || event)}<small>${escapeHtml(event.split(' · ')[0])}</small></div>`).join('')}</div>`;
    $('drawerFooter').innerHTML=`${task.status==='已取消'?(task.cancelReason?'<span class="field-hint">由计划变更取消，请在关联计划中处理。</span>':'<button class="secondary" id="restoreTask">恢复任务</button>'):active(task)?'<button class="secondary" id="cancelTask">取消任务</button>':''}<button class="secondary" data-close-drawer>关闭</button>`;
    if($('detailComplete'))$('detailComplete').onclick=()=>{toggleTask(task.id);renderDrawer();$('detailComplete').focus();};
    if($('detailState'))$('detailState').onclick=()=>{task.status=task.status==='进行中'?'已暂停':'进行中';task.events.unshift('刚刚 · 状态更新为'+task.status);refreshAll();renderDrawer();};
    $('detailRecord').onclick=()=>switchDrawer('record',task.id,$('detailRecord'));
    if($('rescheduleTask'))$('rescheduleTask').onclick=()=>switchDrawer('reschedule',task.id,$('rescheduleTask'));
    if($('detailPlan'))$('detailPlan').onclick=()=>{closeDrawer(true);openPlan(task.planId);};
    if($('resolveBlocker'))$('resolveBlocker').onclick=()=>{task.blocker='';task.events.unshift('刚刚 · 当前卡点标为已解决');refreshAll();renderDrawer();};
    if($('cancelTask'))$('cancelTask').onclick=async()=>{if(!await askConfirmation('取消此任务？进度与工作记录会保留。',$('cancelTask'),'取消任务'))return;task.cancelStatus=task.status;task.status='已取消';task.events.unshift('刚刚 · 取消任务');refreshAll();renderDrawer();};
    if($('restoreTask'))$('restoreTask').onclick=()=>{task.status=task.cancelStatus || '待办';task.events.unshift('刚刚 · 恢复任务');refreshAll();renderDrawer();};
  } else if(drawerMode==='create' || drawerMode==='createChild'){
    const parent=drawerMode==='createChild'?getPlan(activePlanId):null;
    const todayDefault=currentPage==='home'||taskFilters.view==='today';
    $('drawerEyebrow').textContent=parent?'新增目标子任务':'新建临时任务';
    $('drawerBody').innerHTML=`<h2 class="drawer-title">${parent?'把目标拆成具体工作':'安排一项具体工作'}</h2><p class="detail-copy">${parent?'关联目标：'+escapeHtml(parent.title)+'。日期与优先级默认继承目标。':'仅名称必填。未安排日期的任务仍可在全部与未完成中查看。'}</p><form id="createForm"><div class="field"><label for="newTitle">任务名称 *</label><input id="newTitle" required maxlength="80" placeholder="例如：确认本周会议安排"/></div><div class="field"><label for="newPriority">优先级</label><select id="newPriority">${['P2','P1','P0','P3'].map(p=>`<option>${p}</option>`).join('')}</select></div><div class="field-pair"><div class="field"><label for="newDate">执行日期</label><input id="newDate" type="date" value="${parent?parent.start:createDateOverride || (currentPage==='home'?TODAY:taskFilters.date || (todayDefault?TODAY:''))}" ${parent?'min="'+parent.start+'" max="'+parent.end+'"':''}/></div><div class="field"><label for="newDue">截止日期</label><input id="newDue" type="date" value="${parent?.end || ''}" ${parent?'max="'+parent.end+'"':''}/></div></div><div class="field"><label for="newNotes">工作说明</label><textarea id="newNotes" placeholder="可选，补充背景或完成要求"></textarea></div></form>`;
    $('drawerFooter').innerHTML='<button class="secondary" data-close-drawer>取消</button><button class="primary" id="saveTask">创建任务</button>';
    if(parent)$('newPriority').value=parent.priority;
    $('saveTask').onclick=()=>{if(!$('createForm').reportValidity())return;const title=$('newTitle').value.trim();if(!title){showToast('请输入任务名称');return;}const task=addTask({title,priority:$('newPriority').value,executionDate:$('newDate').value,dueDate:$('newDue').value,notes:$('newNotes').value.trim(),...(parent?{source:'目标任务',sourceKey:'goal',planId:parent.id}:{})});closeDrawer(true);refreshAll();showToast(isToday(task)?'任务已加入今日':'任务已创建，可在任务中心查看');};
  } else if(drawerMode==='reschedule' && task){
    $('drawerEyebrow').textContent='调整任务日期';
    $('drawerBody').innerHTML=`${drawerBackMarkup()}<h2 class="drawer-title">${escapeHtml(task.title)}</h2><p class="detail-copy">${task.sourceKey==='plan'?'仅调整本次任务，后续计划规则保持原安排。':'执行日期表示计划开展工作，截止日期表示最晚完成。'}</p><form id="rescheduleForm"><div class="field"><label for="changeExecution">执行日期</label><input id="changeExecution" type="date" value="${task.executionDate || ''}"/></div><div class="field"><label for="changeDue">截止日期</label><input id="changeDue" type="date" value="${task.dueDate || ''}"/></div></form>`;
    $('drawerFooter').innerHTML='<button class="secondary" data-drawer-back>返回任务</button><button class="primary" id="saveSchedule">保存日期</button>';
    $('saveSchedule').onclick=()=>{if(task.sourceKey==='plan'){task.originalDate=task.originalDate || task.executionDate;task.exception=true;}task.executionDate=$('changeExecution').value;task.dueDate=$('changeDue').value;task.events.unshift('刚刚 · 调整本次执行与截止日期');refreshAll();drawerMode='detail';drawerHistory.pop();renderDrawer();showToast('本次任务日期已更新');};
  } else if(drawerMode==='record' || drawerMode==='editLog')renderRecordForm(task);
  else if(drawerMode==='log')renderLogDetail(getLog(activeLogId));
  if(currentPage==='home' && drawerMode==='detail'){for(const id of ['detailComplete','detailState','cancelTask','restoreTask'])$(id)?.remove();}
  const form=$('drawerBody').querySelector('form');if(form){form.addEventListener('input',()=>form.dataset.dirty='true');form.onsubmit=event=>{event.preventDefault();$('drawerFooter').querySelector('.primary')?.click();};}
  $('drawerBody').querySelectorAll('input[id],select[id],textarea[id]').forEach(field=>field.dataset.windowField=field.id);
  $('drawerBody').scrollTop=0;
}
function planImpact(plan,effective) {
  const future=tasks.filter(task=>task.planId===plan.id && ((task.originalDate || task.executionDate)>=effective || task.executionDate>=effective));
  const adjustable=future.filter(task=>active(task) && task.status==='待办' && !task.progress && !taskLogs(task.id).length && !task.exception);
  const restorable=future.filter(task=>task.status==='已取消' && task.cancelReason==='plan-pause' && !task.exception);
  const kept=future.filter(task=>active(task) && !adjustable.includes(task));
  return {adjustable,restorable,kept};
}
function renderPlanImpact(plan) {
  const title=planAction==='resume'?'恢复生成':planAction==='terminate'?'终止计划':'暂停生成';
  $('drawerEyebrow').textContent=title+' · 影响确认';
  $('drawerBody').innerHTML=`<h2 class="drawer-title">${title}「${escapeHtml(plan.title)}」</h2><p class="detail-copy">${planAction==='resume'?'从生效日继续生成，不追补暂停期间的工作。':planAction==='terminate'?'终止后停止生成，一期不提供恢复。已执行事实会保留。':'从生效日停止生成，并处理普通未执行的未来实例。'}</p><form id="planImpactForm"><div class="field"><label for="impactDate">生效日期 *</label><input id="impactDate" type="date" value="2026-10-21" min="${TODAY}" required/></div></form><div class="detail-section"><h3>当前规则</h3><p class="detail-copy">${ruleLabel(plan)}</p></div><div id="impactSummary"></div>`;
  const summary=()=>{const {adjustable,restorable,kept}=planImpact(plan,$('impactDate').value);$('impactSummary').innerHTML=`<div class="detail-section"><h3>${planAction==='resume'?'将恢复的普通实例':'将因计划'+(planAction==='terminate'?'终止':'暂停')+'取消的实例'} · ${planAction==='resume'?restorable.length:adjustable.length}</h3><p class="detail-copy">${(planAction==='resume'?restorable:adjustable).map(task=>shortDate(task.originalDate || task.executionDate)+' '+escapeHtml(task.title)).join('<br>') || '没有符合条件的已生成实例。'}</p></div><div class="detail-section"><h3>保留执行中与手动例外 · ${kept.length}</h3><p class="detail-copy">${kept.map(task=>escapeHtml(task.title)+' · '+task.status).join('<br>') || '没有需要单独保留的未来实例。'}</p></div><div class="info-note">历史状态、进度和记录均保留。${planAction==='resume'?'仅恢复因暂停取消的实例，用户主动取消与手动例外不会被重置。':'有工作投入或手动改期的任务，需在任务详情单独处理。'}</div>`;};
  $('impactDate').onchange=summary;summary();
  $('drawerFooter').innerHTML=`<button class="secondary" data-close-drawer>返回</button><button class="primary" id="confirmPlanImpact">确认${title}</button>`;
  $('confirmPlanImpact').onclick=()=>{
    if(!$('planImpactForm').reportValidity())return;
    const effective=$('impactDate').value,{adjustable,restorable}=planImpact(plan,effective);
    if(planAction==='resume'){
      plan.status='启用';
      for(const task of restorable){task.status='待办';task.cancelReason='';task.events.unshift('刚刚 · 计划恢复生成，复用原实例');}
      for(const date of generatePlanDates(plan,100).filter(date=>date>=effective && date<WINDOW_END))if(!tasks.some(task=>task.planId===plan.id && (task.originalDate || task.executionDate)===date))addTask({title:plan.title,source:'周期计划',sourceKey:'plan',planId:plan.id,priority:plan.priority,executionDate:date,dueDate:date,startTime:plan.time,notes:plan.description});
    }else{
      plan.status=planAction==='terminate'?'终止':'暂停';
      for(const task of adjustable){task.cancelStatus=task.status;task.status='已取消';task.cancelReason=planAction==='terminate'?'plan-terminate':'plan-pause';task.events.unshift('刚刚 · 因计划'+plan.status+'取消本次实例');}
    }
    plan.lastEffective=effective;closeDrawer(true);refreshAll();showToast('计划已'+(planAction==='resume'?'恢复生成':planAction==='terminate'?'终止':'暂停')+'，生效日期 '+shortDate(effective));
  };
}
function renderRecordForm(task) {
  const editing=drawerMode==='editLog', log=editing?getLog(activeLogId):null;
  if(editing)task=getTask(log.taskId);
  $('drawerEyebrow').textContent=editing?'更正工作记录':'新增工作记录';
  $('drawerBody').innerHTML=`${drawerBackMarkup()}<h2 class="drawer-title">${editing?'更正实际工作内容':'记录这次工作'}</h2><p class="detail-copy">${editing?'更正保留旧版本。关联任务与已发生的进度事件保持固定。':'记录实际做了什么，留下成果、投入与下一步。'}</p><form id="recordForm"><div class="field"><label for="recordTask">关联任务</label>${task || editing ? `<div class="tag source">${task?escapeHtml(log?.taskTitle || task.title)+' · '+task.id.toUpperCase():'独立记录'}</div><input type="hidden" id="recordTask" value="${task?.id || ''}"/>` : `<select id="recordTask"><option value="">独立记录，不关联任务</option>${tasks.map(item=>`<option value="${item.id}">${escapeHtml(item.title)} · ${item.id.toUpperCase()} · ${shortDate(item.executionDate || item.dueDate)}</option>`).join('')}</select>`}</div><div class="field-pair"><div class="field"><label for="recordDate">工作日期 *</label><input id="recordDate" type="date" value="${log?.date || TODAY}" max="${TODAY}" required/></div><div class="field"><label for="recordHours">实际耗时（小时）</label><input id="recordHours" type="number" min="0" step="0.25" value="${log?.hours ?? ''}" placeholder="例如 1.5"/></div></div><div class="field"><label for="recordContent">实际工作内容 *</label><textarea id="recordContent" required placeholder="本次完成了哪些工作？">${escapeHtml(log?.content || '')}</textarea></div><div class="field"><label for="recordOutcome">工作成果</label><textarea class="compact-textarea" id="recordOutcome" placeholder="留下具体结果或产出">${escapeHtml(log?.outcome || '')}</textarea></div><div class="field"><label for="recordBlocker">卡点／问题</label><textarea class="compact-textarea" id="recordBlocker" placeholder="可选">${escapeHtml(log?.blocker || '')}</textarea></div><div class="field"><label for="recordNext">下一步工作</label><textarea class="compact-textarea" id="recordNext" placeholder="可选">${escapeHtml(log?.next || '')}</textarea></div>${!editing?'<div id="recordProgressControls"></div>':'<div class="field-hint">更正耗时会更新事实投入；本次更正不会重放原进度事件。</div>'}</form>`;
  $('drawerFooter').innerHTML=`<button class="secondary" ${drawerHistory.length?'data-drawer-back':'data-close-drawer'}>取消</button><button class="primary" id="saveRecord">${editing?'保存更正':'保存记录'}</button>`;
  if(!editing){renderRecordProgress();$('recordTask').onchange=renderRecordProgress;}
  $('saveRecord').onclick=()=>{
    if(!$('recordForm').reportValidity())return;
    const content=$('recordContent').value.trim();if(!content){showToast('请输入实际工作内容');return;}
    const selected=getTask($('recordTask').value);
    const values={date:$('recordDate').value,content,outcome:$('recordOutcome').value.trim(),blocker:$('recordBlocker').value.trim(),next:$('recordNext').value.trim(),hours:$('recordHours').value===''?null:Number($('recordHours').value)};
    if(values.date>TODAY){showToast('工作日期不能晚于今天');return;}
    let saved;
    if(editing){log.versions.push({content:log.content,outcome:log.outcome,blocker:log.blocker,next:log.next,date:log.date,hours:log.hours,changedAt:'2026-10-20 当前操作'});Object.assign(log,values);saved=log;}
    else {saved={id:'r'+(++sequence),taskId:selected?.id || '',taskTitle:selected?.title || '',...values,savedAt:'2026-10-20 当前操作',versions:[]};if(selected && $('updateProgress')?.checked && active(selected)){saved.progressFrom=selected.progress;saved.progressTo=Number($('recordProgress').value);selected.progress=saved.progressTo;selected.events.unshift(`刚刚 · 进度由 ${saved.progressFrom}% 更新至 ${saved.progressTo}%`);}if(selected){selected.events.unshift('刚刚 · 添加工作记录');if(values.blocker)selected.blocker=values.blocker;}logs.unshift(saved);}
    activeLogId=saved.id;activeTaskId=null;drawerMode='log';refreshAll();renderDrawer();showToast(editing?'工作记录已更正，旧版本已保留':'工作记录已保存');
  };
}
function renderRecordProgress() {
  const task=getTask($('recordTask').value), container=$('recordProgressControls');
  if(!task){container.innerHTML='<div class="field-hint">独立记录不更新任务进度，也不计入任务完成率。</div>';return;}
  if(!active(task)){container.innerHTML='<div class="field-hint">可补录此任务的工作事实；更新当前进度前，需先恢复任务。</div>';return;}
  container.innerHTML=`<label class="checkbox-field"><input id="updateProgress" type="checkbox"/>同时更新任务当前进度</label><div id="progressFields" hidden><div class="field"><label for="recordProgress">更新后的进度（%）</label><input id="recordProgress" type="number" min="0" max="100" step="1" value="${task.progress}" disabled/></div><div class="info-note" id="progressSaveHint"></div></div>`;
  const hint=()=>{$('progressSaveHint').textContent=`保存记录，并将任务当前进度由 ${task.progress}% 更新为 ${$('recordProgress').value}%。补录过去工作时，也在当前操作时间更新进度。`;};
  $('updateProgress').onchange=()=>{$('progressFields').hidden=!$('updateProgress').checked;$('recordProgress').disabled=!$('updateProgress').checked;hint();};$('recordProgress').oninput=hint;hint();
}
function renderLogDetail(log) {
  if(!log)return;const task=getTask(log.taskId);
  $('drawerEyebrow').textContent='工作记录 · '+log.id.toUpperCase();
  $('drawerBody').innerHTML=`${drawerBackMarkup()}<div class="section-kicker">工作日期 · ${shortDate(log.date)}</div><h2 class="drawer-title">${escapeHtml(log.content)}</h2><div class="drawer-actions"><button class="secondary" id="editLog">${icon('pen','icon-sm')}更正记录</button>${task?'<button class="secondary" id="logTaskLink">查看任务当前状态</button>':''}</div><div class="detail-section"><dl class="detail-grid"><dt>关联任务</dt><dd>${task?escapeHtml(log.taskTitle):'独立记录'}</dd>${task && task.title!==log.taskTitle?`<dt>任务现名称</dt><dd>${escapeHtml(task.title)}</dd>`:''}<dt>实际耗时</dt><dd>${log.hours===null?'未填写':log.hours+' 小时'}</dd><dt>保存时间</dt><dd>${escapeHtml(log.savedAt)}</dd>${log.progressTo!==undefined?`<dt>当次进度事件</dt><dd>${log.progressFrom}% → ${log.progressTo}%</dd>`:''}</dl></div><div class="record-facts">${[['实际工作内容',log.content],['成果',log.outcome],['当时的卡点',log.blocker],['下一步',log.next]].filter(([,value])=>value).map(([label,value])=>`<section><h3>${label}</h3><p>${escapeHtml(value)}</p></section>`).join('')}</div>${log.versions.length?`<div class="detail-section"><h3>更正历史</h3>${log.versions.map(version=>`<div class="detail-event">${escapeHtml(version.content)}<small>${escapeHtml(version.changedAt)} · 旧工作日期 ${version.date} · 旧耗时 ${version.hours ?? '未填'}</small></div>`).join('')}</div>`:''}`;
  $('drawerFooter').innerHTML='<button class="secondary" data-close-drawer>关闭</button>';
  $('editLog').onclick=()=>switchDrawer('editLog',log.id,$('editLog'));if($('logTaskLink'))$('logTaskLink').onclick=()=>switchDrawer('detail',task.id,$('logTaskLink'));
}
function toggleTask(id) {
  const task=getTask(id);if(!task || task.status==='已取消')return;
  if(task.status==='已完成'){task.status=task.previousStatus || '待办';task.progress=task.previousProgress || 0;task.events.unshift('刚刚 · 撤销完成');showToast('已撤销完成');}
  else {task.previousStatus=task.status;task.previousProgress=task.progress;task.status='已完成';task.progress=100;task.events.unshift('刚刚 · 完成任务');undoTaskId=id;showToast('任务已完成',true);}
  refreshAll();
}
function refreshAll() { renderTasks();renderCalendar();renderHomeExtras();renderTaskCenterRows();renderLogRows();if(planView.mode==='list')renderPlanRows();else if(planView.mode==='detail')renderPlanDetail(planView.id); }
function renderSearch() {
  const query=$('searchInput').value.trim().toLowerCase();const matches=query?tasks.filter(task=>task.title.toLowerCase().includes(query)):sortTasks(tasks).slice(0,5);
  $('searchResults').innerHTML=matches.length?matches.map(task=>`<button data-search-task="${task.id}">${escapeHtml(task.title)}<small>${escapeHtml(task.source)} · ${task.status} · ${shortDate(task.executionDate || task.dueDate)}</small></button>`).join(''):'<div class="empty">没有找到匹配的任务。</div>';
}
async function handleClick(event) {
  if(event.target.closest('.task-card') && performance.now()<suppressCardClickUntil){event.preventDefault();return;}
  const day=event.target.closest('[data-calendar-day]');if(day){selectCalendarDay(day.dataset.calendarDay);return;}
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-gantt')){openDrawer('gantt',button.dataset.gantt,button);return;}
  if(button.hasAttribute('data-gantt-task')){switchDrawer('detail',button.dataset.ganttTask,button);return;}
  if(button.hasAttribute('data-dashboard-day')){Object.assign(taskFilters,{view:'all',date:button.dataset.dashboardDay,status:'',source:'',priority:'',query:''});navigate('tasks');renderTaskPage();return;}
  if(button.hasAttribute('data-card-record')){openDrawer('record',button.dataset.cardRecord,button);return;}
  if(button.hasAttribute('data-task-layout')){taskLayout=button.dataset.taskLayout;try{localStorage.setItem('diwork-task-layout',taskLayout);}catch{}renderTaskCenterRows();return;}
  if(button.hasAttribute('data-create-day')){openDrawer('create',button.dataset.createDay,button);return;}
  if(button.hasAttribute('data-page')){navigate(button.dataset.page);return;}
  if(button.hasAttribute('data-complete')){toggleTask(button.dataset.complete);return;}
  if(button.hasAttribute('data-open-task') || button.hasAttribute('data-task')){openDrawer('detail',button.dataset.openTask || button.dataset.task,button);return;}
  if(button.hasAttribute('data-open-log')){openDrawer('log',button.dataset.openLog,button);return;}
  if(button.hasAttribute('data-switch-log')){switchDrawer('log',button.dataset.switchLog,button);return;}
  if(button.hasAttribute('data-plan')){openPlan(button.dataset.plan);return;}
  if(button.hasAttribute('data-new-plan')){navigate('plans');renderPlanForm();window.scrollTo(0,0);return;}
  if(button.hasAttribute('data-plan-back')){if(planView.mode==='form' && document.querySelector('#planForm [data-changed]') && !await askConfirmation('放弃尚未保存的计划？',button))return;renderPlanListPage();return;}
  if(button.hasAttribute('data-plan-type')){const draft={title:$('planName').value,description:$('planDescription').value,priority:$('planPriority').value};renderPlanForm(button.dataset.planType);$('planName').value=draft.title;$('planDescription').value=draft.description;$('planPriority').value=draft.priority;return;}
  if(button.hasAttribute('data-plan-filter')){planFilters.type=button.dataset.planFilter;document.querySelectorAll('[data-plan-filter]').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));renderPlanRows();return;}
  if(button.hasAttribute('data-task-period')){taskFilters.view=button.dataset.taskPeriod;taskFilters.date='';renderTaskCenterRows();return;}
  if(button.hasAttribute('data-plan-impact')){planAction=button.dataset.impactAction;openDrawer('planImpact',button.dataset.planImpact,button);return;}
  if(button.hasAttribute('data-new-child')){openDrawer('createChild',button.dataset.newChild,button);return;}
  if(button.hasAttribute('data-new-task')){openDrawer('create',null,button);return;}
  if(button.hasAttribute('data-new-log')){openDrawer('record',null,button);return;}
  if(button.hasAttribute('data-plan-logs')){logFilters.plan=button.dataset.planLogs;logFilters.from='';logFilters.to='';logFilters.task='';logFilters.query='';navigate('logs');renderLogPage();return;}
  if(button.hasAttribute('data-log-range')){const range=button.dataset.logRange;logFilters.from=range==='week'?WEEK_START:range==='recent'?'2026-10-14':'';logFilters.to=range==='week'?WEEK_END:range==='recent'?TODAY:'';$('logFrom').value=logFilters.from;$('logTo').value=logFilters.to;renderLogRows();return;}
  if(button.hasAttribute('data-close-drawer')){closeDrawer();return;}
  if(button.hasAttribute('data-drawer-back')){drawerBack(button);return;}
  if(button.hasAttribute('data-search-task')){openDrawer('detail',button.dataset.searchTask,$('searchTrigger'));}
}
document.addEventListener('click',handleClick);
document.addEventListener('input',event=>{if(event.target.closest('#planForm'))event.target.dataset.changed='true';});
$('createTask').onclick=event=>openDrawer('create',null,event.currentTarget);
$('taskViewAll').onclick=()=>{Object.assign(taskFilters,{view:'today',date:'',status:'',source:'',priority:'',query:''});navigate('tasks');renderTaskPage();};
$('viewOverdue').onclick=()=>{Object.assign(taskFilters,{view:'all',date:'',status:'overdue',source:'',priority:'',query:''});navigate('tasks');renderTaskPage();};
$('closeDrawer').onclick=()=>closeDrawer();$('overlay').onclick=()=>closeDrawer();
$('toastAction').onclick=()=>{if(statusUndo){undoCardStatusChange();return;}if(!undoTaskId)return;const task=getTask(undoTaskId);if(task){task.status=task.previousStatus || '待办';task.progress=task.previousProgress || 0;task.events.unshift('刚刚 · 撤销完成');refreshAll();showToast('已撤销完成');if(drawerMode==='detail')renderDrawer();}undoTaskId=null;};
$('prevMonth').onclick=()=>moveCalendarMonth(-1);$('nextMonth').onclick=()=>moveCalendarMonth(1);$('currentMonth').onclick=()=>moveCalendarMonth(0);
$('searchTrigger').onclick=()=>{if($('drawer').classList.contains('open'))return;toggleTaskSearch();};$('searchInput').oninput=renderSearch;
document.addEventListener('click',event=>{if(!event.target.closest('#searchPopover') && !event.target.closest('#searchTrigger'))toggleTaskSearch(false);});
document.addEventListener('keydown',event=>{
  if((event.metaKey || event.ctrlKey) && event.key.toLowerCase()==='k'){event.preventDefault();$('searchTrigger').click();}
  if(event.key==='Escape' && dragSession){finishCardDrag(false);event.preventDefault();return;}
  if(event.key==='Escape'){if($('searchPopover').classList.contains('open')){toggleTaskSearch(false);$('searchTrigger').focus();}else if($('drawer').classList.contains('open'))closeDrawer();}
  if(event.key==='Tab' && $('drawer').classList.contains('open')){const elements=[...$('drawer').querySelectorAll('button,input,select,textarea')].filter(element=>!element.disabled && element.type!=='hidden' && !element.closest('[hidden]'));const first=elements[0],last=elements[elements.length-1];if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}}
});
let savedTheme;try{savedTheme=localStorage.getItem('diwork-prototype-theme');}catch{}
document.documentElement.dataset.theme=savedTheme==='dark'?'dark':'light';
function renderThemeButton(){const graphic=icon(document.documentElement.dataset.theme==='dark'?'sun':'moon');$('themeToggle').innerHTML=graphic;$('calendarThemeToggle').innerHTML=graphic;}
$('themeToggle').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('diwork-prototype-theme',next);}catch{}renderThemeButton();};
$('calendarThemeToggle').onclick=()=>$('themeToggle').onclick();
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1),false));
initializeCardInteractions();renderThemeButton();refreshAll();navigate('home');initializeCalendarPresentation();
