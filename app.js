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
// 模块一：每日计划（支持日期切换）
// ========================================================
let plans = loadData('plans');
let currentPlanDate = todayStr();

function savePlans() { saveData('plans', plans); }

// 格式化日期为中文显示
function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const weekdays = ['日','一','二','三','四','五','六'];
  const today = todayStr();
  if (dateStr === today) return '今天';
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return '昨天';
  return `${d.getMonth()+1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
}

function changePlanDate(offset) {
  const d = new Date(currentPlanDate);
  d.setDate(d.getDate() + offset);
  currentPlanDate = d.toISOString().slice(0, 10);
  $('planDateInput').value = currentPlanDate;
  renderPlans();
}

function changePlanDateDirect() {
  currentPlanDate = $('planDateInput').value || todayStr();
  renderPlans();
}

function goTodayPlan() {
  currentPlanDate = todayStr();
  $('planDateInput').value = currentPlanDate;
  renderPlans();
}

function addPlan() {
  const input = $('planInput');
  const text = input.value.trim();
  if (!text) return toast('请输入计划内容');
  plans.unshift({ id: Date.now(), text, done: false, date: currentPlanDate, note: '' });
  input.value = '';
  savePlans();
  renderPlans();
  toast('计划添加成功 ✓');
}

function togglePlan(id) {
  const p = plans.find(x => x.id === id);
  if (p) { p.done = !p.done; savePlans(); renderPlans(); }
}

// 备注相关
let noteEditingId = null; // 当前正在编辑备注的任务 id

function toggleNoteEdit(id) {
  if (noteEditingId === id) {
    noteEditingId = null; // 再点一次收起
  } else {
    noteEditingId = id;
  }
  renderPlans();
}

function saveNote(id) {
  const p = plans.find(x => x.id === id);
  const input = $('note-input-' + id);
  if (p && input) {
    p.note = input.value.trim();
    savePlans();
  }
  noteEditingId = null;
  renderPlans();
  toast('备注已保存 📝');
}

function delPlan(id) {
  plans = plans.filter(x => x.id !== id);
  if (noteEditingId === id) noteEditingId = null;
  savePlans();
  renderPlans();
  toast('已删除');
}

function renderPlans() {
  const isToday = currentPlanDate === todayStr();
  const dayPlans = plans.filter(p => p.date === currentPlanDate);
  const list = $('planList');

  // 更新日期显示
  $('planDateInput').value = currentPlanDate;
  $('planDateDisplay').textContent = formatDateLabel(currentPlanDate);
  $('planRateLabel').textContent = isToday ? '今日完成度' : '完成度';
  $('planListTitle').textContent = isToday ? '今日任务' : '当日任务';
  $('planCountBadge').textContent = dayPlans.length;

  // 非今日时隐藏添加框
  $('planAddCard').style.display = isToday ? 'flex' : 'none';

  if (dayPlans.length === 0) {
    list.innerHTML = emptyHTML('🌙', isToday ? '今天还没有计划，添加一个吧' : '该日期暂无计划');
  } else {
    list.innerHTML = dayPlans.map(p => {
      const editing = noteEditingId === p.id;
      return `
      <div class="list-item plan-with-note ${p.done ? 'done' : ''}">
        <div class="item-check ${p.done ? 'checked' : ''}" ${isToday ? `onclick="togglePlan(${p.id})"` : 'style="cursor:default"'}></div>
        <div class="item-main">
          <div class="item-title">${escapeHtml(p.text)}</div>
          <div class="item-desc">${p.done ? '已完成，真棒！' : '待完成'}</div>
          ${p.note && !editing ? `<div class="item-note">📝 ${escapeHtml(p.note)}</div>` : ''}
          ${editing ? `
            <div class="note-edit-area">
              <input type="text" id="note-input-${p.id}" class="note-input" value="${escapeHtml(p.note)}" placeholder="输入备注..." onkeydown="if(event.key==='Enter')saveNote(${p.id})">
              <button class="note-save-btn" onclick="saveNote(${p.id})">保存</button>
            </div>
          ` : ''}
        </div>
        <span class="item-tag ${p.done ? 'success' : ''}">${p.done ? '已完成' : '待办'}</span>
        ${isToday ? `<button class="note-btn ${p.note ? 'has-note' : ''}" onclick="toggleNoteEdit(${p.id})" title="备注">📝</button>` : ''}
        ${isToday ? `<button class="del-btn" onclick="delPlan(${p.id})">✕</button>` : ''}
      </div>
    `;}).join('');
  }

  const total = dayPlans.length;
  const done = dayPlans.filter(p => p.done).length;
  const rate = total ? Math.round(done / total * 100) : 0;
  $('planRate').textContent = rate + '%';

  // SVG 圆环进度
  const circle = $('planCircle');
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (rate / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

// ========================================================
// 模块二：每日花费（支持月度切换 + 日期筛选）
// ========================================================
let expenses = loadData('expenses');
let currentExpenseMonth = todayStr().slice(0, 7); // YYYY-MM
let expenseDateFilter = ''; // 空字符串=不筛选

function saveExpenses() { saveData('expenses', expenses); }

function formatMonthLabel(monthStr) {
  const [y, m] = monthStr.split('-');
  const thisMonth = todayStr().slice(0, 7);
  if (monthStr === thisMonth) return `${y}年${parseInt(m)}月（本月）`;
  return `${y}年${parseInt(m)}月`;
}

function changeExpenseMonth(offset) {
  const [y, m] = currentExpenseMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  currentExpenseMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  expenseDateFilter = '';
  $('expenseDateFilter').value = '';
  renderExpenses();
}

function goCurrentMonth() {
  currentExpenseMonth = todayStr().slice(0, 7);
  expenseDateFilter = '';
  $('expenseDateFilter').value = '';
  renderExpenses();
}

function filterExpenseByDate() {
  expenseDateFilter = $('expenseDateFilter').value || '';
  renderExpenses();
}

function clearExpenseFilter() {
  expenseDateFilter = '';
  $('expenseDateFilter').value = '';
  renderExpenses();
}

// 分类配置
const CATEGORIES = {
  '零食':     { icon: '🍿', color: '#F472B6' },
  '一日三餐': { icon: '🍚', color: '#FDBA74' },
  '周末游玩': { icon: '🎡', color: '#34D399' },
  '生活用品': { icon: '🧴', color: '#60A5FA' },
  '衣服':     { icon: '👗', color: '#A78BFA' },
  '生日节日': { icon: '🎂', color: '#F87171' },
  '其他':     { icon: '📦', color: '#94A3B8' }
};

let selectedCategory = '一日三餐'; // 默认分类

function selectCategory(cat) {
  selectedCategory = cat;
  // 更新按钮选中态
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.cat === cat);
  });
  // "其他"显示备注输入框
  $('categoryNoteRow').style.display = cat === '其他' ? 'flex' : 'none';
}

function addExpense() {
  const desc = $('expenseDesc').value.trim();
  const amount = parseFloat($('expenseAmount').value);
  const date = $('expenseDate').value || todayStr();
  const category = selectedCategory;
  const categoryNote = category === '其他' ? ($('categoryNoteInput').value.trim()) : '';
  if (!desc) return toast('请输入花费描述');
  if (!amount || amount < 0) return toast('请输入有效金额');
  expenses.unshift({ id: Date.now(), desc, amount, date, time: nowTime(), category, categoryNote });
  $('expenseDesc').value = '';
  $('expenseAmount').value = '';
  $('expenseDate').value = todayStr();
  $('categoryNoteInput').value = '';
  // 跳转到该日期所属的月份
  currentExpenseMonth = date.slice(0, 7);
  expenseDateFilter = '';
  $('expenseDateFilter').value = '';
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

  // 更新月度显示
  $('expenseMonthDisplay').textContent = formatMonthLabel(currentExpenseMonth);
  $('expenseMonthLabel').textContent = formatMonthLabel(currentExpenseMonth).replace('（本月）','');

  // 月度数据
  const monthExp = expenses.filter(e => e.date.startsWith(currentExpenseMonth));
  const monthSum = monthExp.reduce((s, e) => s + e.amount, 0);
  $('expenseMonthTotal').textContent = '¥' + monthSum.toFixed(2);
  $('expenseMonthCount').textContent = monthExp.length;
  // 日均（按当月有记录的天数算）
  const days = new Set(monthExp.map(e => e.date)).size;
  const avg = days ? monthSum / days : 0;
  $('expenseDailyAvg').textContent = '¥' + avg.toFixed(1);

  // ===== 分类月度汇总 =====
  renderCategoryStats(monthExp);

  // 列表筛选：有日期筛选就用筛选日期，否则显示当月全部
  let displayExp;
  let listTitle;
  if (expenseDateFilter) {
    displayExp = expenses.filter(e => e.date === expenseDateFilter);
    listTitle = formatDateLabel(expenseDateFilter) + '账单';
  } else {
    displayExp = monthExp;
    listTitle = formatMonthLabel(currentExpenseMonth) + '账单';
  }
  $('expenseListTitle').textContent = listTitle;
  $('expenseCountBadge').textContent = displayExp.length;

  if (displayExp.length === 0) {
    list.innerHTML = emptyHTML('🪙', expenseDateFilter ? '该日期无花费记录' : '本月还没有花费记录');
  } else {
    list.innerHTML = displayExp.map(e => {
      const cat = e.category || '未分类';
      const cfg = CATEGORIES[cat];
      const icon = cfg ? cfg.icon : '❓';
      const color = cfg ? cfg.color : '#94A3B8';
      const catLabel = cat === '其他' && e.categoryNote ? `${icon} ${escapeHtml(e.categoryNote)}` : `${icon} ${cat}`;
      return `
      <div class="list-item">
        <div class="item-check" style="cursor:default;border-color:${color}55;background:${color}22;color:${color}">${icon}</div>
        <div class="item-main">
          <div class="item-title">${escapeHtml(e.desc)}</div>
          <div class="item-desc">${e.date} ${e.time}</div>
        </div>
        <span class="cat-tag" style="background:${color}1A;color:${color}">${catLabel}</span>
        <span class="item-tag warning">¥${e.amount.toFixed(2)}</span>
        <button class="del-btn" onclick="delExpense(${e.id})">✕</button>
      </div>
    `;}).join('');
  }
}

// 分类月度汇总渲染
function renderCategoryStats(monthExp) {
  $('categoryStatsMonth').textContent = '· ' + formatMonthLabel(currentExpenseMonth).replace('（本月）','');
  const stats = {};
  monthExp.forEach(e => {
    const cat = e.category || '未分类';
    if (!stats[cat]) stats[cat] = 0;
    stats[cat] += e.amount;
  });

  const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const container = $('categoryStatsList');

  if (entries.length === 0) {
    container.innerHTML = `<div class="cat-stat-empty">本月暂无分类数据</div>`;
    return;
  }

  const total = monthExp.reduce((s, e) => s + e.amount, 0);
  container.innerHTML = entries.map(([cat, sum]) => {
    const cfg = CATEGORIES[cat];
    const icon = cfg ? cfg.icon : '❓';
    const color = cfg ? cfg.color : '#94A3B8';
    const pct = total ? Math.round(sum / total * 100) : 0;
    return `
      <div class="cat-stat-row">
        <span class="cat-stat-icon" style="background:${color}1A;color:${color}">${icon}</span>
        <span class="cat-stat-name">${cat}</span>
        <div class="cat-stat-bar-wrap">
          <div class="cat-stat-bar" style="width:${pct}%;background:${color}"></div>
        </div>
        <span class="cat-stat-pct" style="color:${color}">${pct}%</span>
        <span class="cat-stat-amount">¥${sum.toFixed(0)}</span>
      </div>
    `;
  }).join('');
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
  // 初始化日期默认值
  const today = todayStr();
  $('planDateInput').value = today;
  $('expenseDate').value = today;
  // 初始化默认分类
  selectCategory('一日三餐');
  renderPlans();
  renderExpenses();
  renderInspirations();
  renderExercises();
  renderReadings();
}

// ========================================================
// 数据管理：导出 / 导入 / 清空
// ========================================================
const DATA_KEYS = [
  { key: 'plans', label: '计划', icon: '📋' },
  { key: 'expenses', label: '花费', icon: '💰' },
  { key: 'inspirations', label: '灵感', icon: '💡' },
  { key: 'exercises', label: '锻炼', icon: '🏃' },
  { key: 'readings', label: '阅读', icon: '📚' }
];

function openDataModal() {
  const grid = $('dataStatGrid');
  grid.innerHTML = DATA_KEYS.map(({ key, label, icon }) => {
    const data = loadData(key);
    return `
      <div class="data-stat-item">
        <span class="data-stat-icon">${icon}</span>
        <div class="data-stat-info">
          <span class="data-stat-value">${data.length} 条</span>
          <span class="data-stat-label">${label}</span>
        </div>
      </div>
    `;
  }).join('');
  $('dataImportArea').style.display = 'none';
  $('dataModal').classList.add('show');
}

function closeDataModal() {
  $('dataModal').classList.remove('show');
}

function exportData() {
  const dump = {
    _exported: new Date().toISOString(),
    _version: 'luvky-workbench-v3.5'
  };
  DATA_KEYS.forEach(({ key }) => {
    try { dump[key] = JSON.parse(localStorage.getItem('luvky_' + key)) || []; }
    catch { dump[key] = []; }
  });
  const json = JSON.stringify(dump, null, 2);
  const text = $('importText');
  text.value = json;
  $('dataImportArea').style.display = 'block';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(json).then(() => {
      toast('已复制到剪贴板 ✓ 请粘贴到备忘录保存');
    }).catch(() => {
      toast('已生成 JSON，请长按下方文本复制');
    });
  } else {
    toast('已生成 JSON，请长按下方文本复制');
  }
}

function importDataFromText() {
  const text = $('importText').value.trim();
  if (!text) return toast('请粘贴 JSON 数据');
  try {
    const dump = JSON.parse(text);
    let count = 0;
    DATA_KEYS.forEach(({ key }) => {
      if (Array.isArray(dump[key])) {
        localStorage.setItem('luvky_' + key, JSON.stringify(dump[key]));
        count++;
      }
    });
    closeDataModal();
    renderAll();
    toast(`恢复成功！已加载 ${count} 个模块的数据 ✓`);
  } catch (e) {
    toast('JSON 格式错误，请检查');
  }
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    $('importText').value = e.target.result;
    $('dataImportArea').style.display = 'block';
    importDataFromText();
  };
  reader.readAsText(file);
  event.target.value = '';
}

function wipeAllData() {
  confirmModal('确认清空所有数据？此操作不可恢复！', () => {
    DATA_KEYS.forEach(({ key }) => localStorage.removeItem('luvky_' + key));
    closeDataModal();
    renderAll();
    toast('已清空所有数据');
  });
}

// ========================================================
// 密码锁屏
// ========================================================
const PWD_KEY = 'luvky_pwd_hash';
const PWD_FAIL_KEY = 'luvky_pwd_fail';
const PWD_LOCKOUT_KEY = 'luvky_pwd_lockout';
const MAX_FAILS = 5;
const LOCKOUT_MIN = 5;

// SHA-256 哈希（用 Web Crypto API）
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hasPassword() {
  return !!localStorage.getItem(PWD_KEY);
}

function isLockedOut() {
  const until = parseInt(localStorage.getItem(PWD_LOCKOUT_KEY) || '0');
  if (Date.now() < until) {
    const remain = Math.ceil((until - Date.now()) / 1000 / 60);
    return remain;
  }
  return 0;
}

async function initLockScreen() {
  if (!hasPassword()) return; // 没设密码不显示锁屏
  // 检查锁定
  const lockRemain = isLockedOut();
  if (lockRemain > 0) {
    $('lockPassword').disabled = true;
    $('lockBtn').disabled = true;
    $('lockHint').textContent = `尝试过多，${lockRemain} 分钟后重试`;
  }
  $('lockScreen').classList.add('show');
  setTimeout(() => $('lockPassword').focus(), 100);
}

async function unlockApp() {
  const pwd = $('lockPassword').value;
  if (!pwd) return showLockError('请输入密码');

  // 锁定状态检查
  if (isLockedOut() > 0) {
    const remain = isLockedOut();
    return showLockError(`已被锁定，请 ${remain} 分钟后再试`);
  }

  const hash = await sha256(pwd);
  const saved = localStorage.getItem(PWD_KEY);
  if (hash === saved) {
    // 成功：清除失败记录，隐藏锁屏
    localStorage.removeItem(PWD_FAIL_KEY);
    localStorage.removeItem(PWD_LOCKOUT_KEY);
    $('lockScreen').classList.remove('show');
    $('lockPassword').value = '';
    $('lockError').textContent = '';
  } else {
    // 失败
    let fails = parseInt(localStorage.getItem(PWD_FAIL_KEY) || '0') + 1;
    localStorage.setItem(PWD_FAIL_KEY, fails);
    if (fails >= MAX_FAILS) {
      // 触发锁定
      const until = Date.now() + LOCKOUT_MIN * 60 * 1000;
      localStorage.setItem(PWD_LOCKOUT_KEY, until);
      $('lockPassword').disabled = true;
      $('lockBtn').disabled = true;
      $('lockHint').textContent = `已锁定，${LOCKOUT_MIN} 分钟后重试`;
      showLockError(`错误次数过多，已锁定 ${LOCKOUT_MIN} 分钟`);
    } else {
      showLockError(`密码错误（还可尝试 ${MAX_FAILS - fails} 次）`);
    }
    $('lockPassword').value = '';
    $('lockPassword').focus();
  }
}

function showLockError(msg) {
  const el = $('lockError');
  el.textContent = msg;
  el.style.animation = 'none';
  setTimeout(() => el.style.animation = 'shake 0.4s', 10);
}

// 密码管理
function openPasswordPanel() {
  $('passwordPanel').style.display = 'block';
  $('oldPassword').placeholder = hasPassword() ? '当前密码' : '首次设置留空';
}

function closePasswordPanel() {
  $('passwordPanel').style.display = 'none';
  $('oldPassword').value = '';
  $('newPassword').value = '';
  $('confirmPassword').value = '';
}

async function changePassword() {
  const oldPwd = $('oldPassword').value;
  const newPwd = $('newPassword').value;
  const confirmPwd = $('confirmPassword').value;

  // 如果已有密码，验证旧密码
  if (hasPassword()) {
    if (!oldPwd) return toast('请输入当前密码');
    const oldHash = await sha256(oldPwd);
    if (oldHash !== localStorage.getItem(PWD_KEY)) return toast('当前密码错误');
  }

  if (!newPwd || newPwd.length < 4) return toast('新密码至少4位');
  if (newPwd !== confirmPwd) return toast('两次输入的新密码不一致');

  const newHash = await sha256(newPwd);
  localStorage.setItem(PWD_KEY, newHash);
  // 重置失败计数
  localStorage.removeItem(PWD_FAIL_KEY);
  localStorage.removeItem(PWD_LOCKOUT_KEY);
  closePasswordPanel();
  toast(hasPassword() ? '密码已更新 ✓' : '密码已设置 ✓ 退出后生效');
}

function removePassword() {
  if (!hasPassword()) return toast('当前未设置密码');
  confirmModal('确认取消密码保护？取消后任何人打开链接都能直接看到数据', () => {
    localStorage.removeItem(PWD_KEY);
    localStorage.removeItem(PWD_FAIL_KEY);
    localStorage.removeItem(PWD_LOCKOUT_KEY);
    closePasswordPanel();
    toast('已取消密码保护');
  });
}
renderAll();
initLockScreen();
