/* ========================================================
   luvky专属工作台 v2 — 紫色系卡片风格
   数据存储：localStorage，按日期隔离
======================================================== */

const $ = id => document.getElementById(id);
const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

// 通用读写
function loadData(key) {
  try { return JSON.parse(localStorage.getItem('luvky_' + key)) || []; }
  catch { return []; }
}
function saveData(key, data) {
  localStorage.setItem('luvky_' + key, JSON.stringify(data));
}

// 弹窗
let modalCallback = null;
function confirmModal(text, cb) {
  $('modalText').textContent = text;
  modalCallback = cb;
  $('modalOverlay').classList.add('show');
}
function closeModal() {
  $('modalOverlay').classList.remove('show');
  modalCallback = null;
}
$('modalConfirmBtn').addEventListener('click', () => { if (modalCallback) modalCallback(); closeModal(); });
$('modalOverlay').addEventListener('click', e => { if (e.target === $('modalOverlay')) closeModal(); });

// Toast
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// HTML转义
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 空状态
function emptyHTML(icon, text) {
  return `<div class="empty-state"><span class="empty-icon">${icon}</span><span class="empty-text">${text}</span></div>`;
}

// 页面切换 + 标题联动
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    $('page-' + item.dataset.page).classList.add('active');
    $('topTitle').textContent = item.querySelector('.nav-label').textContent;
  });
});

// 日期显示
function renderDate() {
  const d = new Date();
  const weekdays = ['日','一','二','三','四','五','六'];
  $('todayDate').textContent = `${d.getMonth()+1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
}
renderDate();

// ========================================================
// 模块一：每日计划
// ========================================================
let plans = loadData('plans');

function savePlans() { saveData('plans', plans); }

function addPlan() {
  const input = $('planInput');
  const text = input.value.trim();
  if (!text) return toast('请输入计划内容');
  plans.unshift({ id: Date.now(), text, done: false, date: todayStr() });
  input.value = '';
  savePlans();
  renderPlans();
  toast('计划添加成功 ✓');
}

function togglePlan(id) {
  const p = plans.find(x => x.id === id);
  if (p) { p.done = !p.done; savePlans(); renderPlans(); }
}

function delPlan(id) {
  plans = plans.filter(x => x.id !== id);
  savePlans();
  renderPlans();
  toast('已删除');
}

function renderPlans() {
  const todayPlans = plans.filter(p => p.date === todayStr());
  const list = $('planList');
  $('planCountBadge').textContent = todayPlans.length;

  if (todayPlans.length === 0) {
    list.innerHTML = emptyHTML('🌙', '今天还没有计划，添加一个吧');
  } else {
    list.innerHTML = todayPlans.map(p => `
      <div class="list-item ${p.done ? 'done' : ''}">
        <div class="item-check ${p.done ? 'checked' : ''}" onclick="togglePlan(${p.id})"></div>
        <div class="item-main">
          <div class="item-title">${escapeHtml(p.text)}</div>
          <div class="item-desc">${p.done ? '已完成，真棒！' : '待完成'}</div>
        </div>
        <span class="item-tag ${p.done ? 'success' : ''}">${p.done ? '已完成' : '待办'}</span>
        <button class="del-btn" onclick="delPlan(${p.id})">✕</button>
      </div>
    `).join('');
  }

  const total = todayPlans.length;
  const done = todayPlans.filter(p => p.done).length;
  const rate = total ? Math.round(done / total * 100) : 0;
  $('planRate').textContent = rate + '%';

  // SVG 圆环进度
  const circle = $('planCircle');
  const circumference = 2 * Math.PI * 18; // 约113
  const offset = circumference - (rate / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

// ========================================================
// 模块二：每日花费
// ========================================================
let expenses = loadData('expenses');

function saveExpenses() { saveData('expenses', expenses); }

function addExpense() {
  const desc = $('expenseDesc').value.trim();
  const amount = parseFloat($('expenseAmount').value);
  if (!desc) return toast('请输入花费描述');
  if (!amount || amount < 0) return toast('请输入有效金额');
  expenses.unshift({ id: Date.now(), desc, amount, date: todayStr(), time: nowTime() });
  $('expenseDesc').value = '';
  $('expenseAmount').value = '';
  saveExpenses();
  renderExpenses();
  toast('花费记录成功');
}

function delExpense(id) {
  expenses = expenses.filter(x => x.id !== id);
  saveExpenses();
  renderExpenses();
}

function renderExpenses() {
  const list = $('expenseList');

  if (expenses.length === 0) {
    list.innerHTML = emptyHTML('🪙', '还没有花费记录');
  } else {
    list.innerHTML = expenses.map(e => `
      <div class="list-item">
        <div class="item-check" style="cursor:default;border-color:#FDBA74;background:#FFFBEB;color:#D97706">¥</div>
        <div class="item-main">
          <div class="item-title">${escapeHtml(e.desc)}</div>
          <div class="item-desc">${e.date} ${e.time}</div>
        </div>
        <span class="item-tag warning">¥${e.amount.toFixed(2)}</span>
        <button class="del-btn" onclick="delExpense(${e.id})">✕</button>
      </div>
    `).join('');
  }

  const todayExp = expenses.filter(e => e.date === todayStr());
  const todaySum = todayExp.reduce((s, e) => s + e.amount, 0);
  const month = todayStr().slice(0, 7);
  const monthSum = expenses.filter(e => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);
  $('expenseToday').textContent = '¥' + todaySum.toFixed(0);
  $('expenseMonth').textContent = '¥' + monthSum.toFixed(0);
  $('expenseCount').textContent = todayExp.length;
}

// ========================================================
// 模块三：灵感记录
// ========================================================
let inspirations = loadData('inspirations');

function saveInspirations() { saveData('inspirations', inspirations); }

function addInspiration() {
  const text = $('inspirationInput').value.trim();
  if (!text) return toast('请写点什么～');
  inspirations.unshift({ id: Date.now(), text, date: todayStr(), time: nowTime() });
  $('inspirationInput').value = '';
  saveInspirations();
  renderInspirations();
  toast('灵感已捕捉 ✨');
}

function delInspiration(id) {
  inspirations = inspirations.filter(x => x.id !== id);
  saveInspirations();
  renderInspirations();
}

function renderInspirations() {
  const list = $('inspirationList');

  if (inspirations.length === 0) {
    list.innerHTML = emptyHTML('💭', '还没有灵感记录');
  } else {
    list.innerHTML = inspirations.map(i => `
      <div class="list-item vertical">
        <div class="item-text">${escapeHtml(i.text)}</div>
        <div class="item-meta">
          <span>${i.date} ${i.time}</span>
          <button class="del-btn" onclick="delInspiration(${i.id})">✕</button>
        </div>
      </div>
    `).join('');
  }

  const todayIns = inspirations.filter(i => i.date === todayStr());
  $('inspirationToday').textContent = todayIns.length;
  $('inspirationTotal').textContent = inspirations.length;
}

// ========================================================
// 模块四：锻炼身体
// ========================================================
let exercises = loadData('exercises');

function saveExercises() { saveData('exercises', exercises); }

function addExercise() {
  const type = $('exerciseType').value.trim();
  const duration = parseInt($('exerciseDuration').value);
  if (!type) return toast('请输入运动类型');
  if (!duration || duration < 1) return toast('请输入有效时长');
  exercises.unshift({ id: Date.now(), type, duration, date: todayStr(), time: nowTime() });
  $('exerciseType').value = '';
  $('exerciseDuration').value = '';
  saveExercises();
  renderExercises();
  toast('运动记录成功 💪');
}

function quickAddExercise(type, duration) {
  exercises.unshift({ id: Date.now(), type, duration, date: todayStr(), time: nowTime() });
  saveExercises();
  renderExercises();
  toast(`${type} ${duration}分钟已记录`);
}

function delExercise(id) {
  exercises = exercises.filter(x => x.id !== id);
  saveExercises();
  renderExercises();
}

function renderExercises() {
  const list = $('exerciseList');

  if (exercises.length === 0) {
    list.innerHTML = emptyHTML('😴', '还没有运动记录，动起来吧');
  } else {
    list.innerHTML = exercises.map(e => `
      <div class="list-item">
        <div class="item-check" style="cursor:default;border-color:#34D399;background:#ECFDF5;color:#059669">🏃</div>
        <div class="item-main">
          <div class="item-title">${escapeHtml(e.type)}</div>
          <div class="item-desc">${e.date} ${e.time}</div>
        </div>
        <span class="item-tag success">${e.duration}分钟</span>
        <button class="del-btn" onclick="delExercise(${e.id})">✕</button>
      </div>
    `).join('');
  }

  const todayEx = exercises.filter(e => e.date === todayStr());
  const todayMin = todayEx.reduce((s, e) => s + e.duration, 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStr = weekAgo.toISOString().slice(0, 10);
  const weekMin = exercises.filter(e => e.date >= weekStr).reduce((s, e) => s + e.duration, 0);
  $('exerciseTodayMin').textContent = todayMin;
  $('exerciseTodayCount').textContent = todayEx.length;
  $('exerciseWeekMin').textContent = weekMin;
}

// ========================================================
// 模块五：每日阅读
// ========================================================
let readings = loadData('readings');

function saveReadings() { saveData('readings', readings); }

function addReading() {
  const title = $('readingTitle').value.trim();
  const author = $('readingAuthor').value.trim();
  const pages = parseInt($('readingPages').value);
  const note = $('readingNote').value.trim();
  if (!title) return toast('请输入书名');
  if (!pages || pages < 1) return toast('请输入有效页数');
  readings.unshift({ id: Date.now(), title, author, pages, note, date: todayStr(), time: nowTime() });
  $('readingTitle').value = '';
  $('readingAuthor').value = '';
  $('readingPages').value = '';
  $('readingNote').value = '';
  saveReadings();
  renderReadings();
  toast('阅读记录成功 📖');
}

function delReading(id) {
  readings = readings.filter(x => x.id !== id);
  saveReadings();
  renderReadings();
}

function renderReadings() {
  const list = $('readingList');

  if (readings.length === 0) {
    list.innerHTML = emptyHTML('📚', '还没有阅读记录');
  } else {
    list.innerHTML = readings.map(r => `
      <div class="list-item vertical">
        <div class="item-main" style="width:100%">
          <div class="item-title">${escapeHtml(r.title)}${r.author ? `<span style="color:var(--text-light);font-size:13px;font-weight:500"> · ${escapeHtml(r.author)}</span>` : ''}</div>
          ${r.note ? `<div class="item-text" style="margin-top:4px;color:var(--text-sub);font-size:14px">${escapeHtml(r.note)}</div>` : ''}
        </div>
        <div class="item-meta">
          <span>📄 ${r.pages}页 · ${r.date} ${r.time}</span>
          <button class="del-btn" onclick="delReading(${r.id})">✕</button>
        </div>
      </div>
    `).join('');
  }

  const todayRd = readings.filter(r => r.date === todayStr());
  const todayPages = todayRd.reduce((s, r) => s + r.pages, 0);
  const todayBooks = new Set(todayRd.map(r => r.title)).size;
  const totalBooks = new Set(readings.map(r => r.title)).size;
  $('readingTodayPages').textContent = todayPages;
  $('readingTodayBooks').textContent = todayBooks;
  $('readingTotalBooks').textContent = totalBooks;
}

// ========================================================
// 历史计划查看
// ========================================================
let historyExpanded = false;

function toggleHistory() {
  historyExpanded = !historyExpanded;
  const container = $('historyContainer');
  const btn = $('historyToggle');
  if (historyExpanded) {
    renderHistory();
    container.style.display = 'block';
    btn.textContent = '收起 ▲';
  } else {
    container.style.display = 'none';
    btn.textContent = '展开 ▼';
  }
}

function renderHistory() {
  const today = todayStr();
  // 按日期分组，排除今天
  const groups = {};
  plans.filter(p => p.date !== today).forEach(p => {
    if (!groups[p.date]) groups[p.date] = [];
    groups[p.date].push(p);
  });

  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const container = $('historyContainer');

  if (dates.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📅</span><span class="empty-text">还没有历史计划</span></div>`;
    return;
  }

  container.innerHTML = dates.map(date => {
    const items = groups[date];
    const done = items.filter(p => p.done).length;
    // 格式化日期显示
    const d = new Date(date);
    const weekdays = ['日','一','二','三','四','五','六'];
    const dateLabel = `${d.getMonth()+1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
    return `
      <div class="history-group">
        <div class="history-date">
          ${dateLabel}
          <span class="history-stat">${done}/${items.length} 完成</span>
        </div>
        <div class="history-list">
          ${items.map(p => `
            <div class="list-item ${p.done ? 'done' : ''}">
              <div class="item-check ${p.done ? 'checked' : ''}" style="cursor:default"></div>
              <div class="item-main">
                <div class="item-title">${escapeHtml(p.text)}</div>
              </div>
              <span class="item-tag ${p.done ? 'success' : ''}">${p.done ? '已完成' : '未完成'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ========================================================
// 每日重置
// ========================================================
$('resetTodayBtn').addEventListener('click', () => {
  confirmModal('确认重置今日计划？（其他累积记录不受影响）', () => {
    const today = todayStr();
    plans = plans.filter(p => p.date !== today);
    savePlans();
    renderPlans();
    toast('今日计划已重置 🔄');
  });
});

// ========================================================
// 初始化
// ========================================================
function renderAll() {
  renderPlans();
  renderExpenses();
  renderInspirations();
  renderExercises();
  renderReadings();
}
renderAll();
