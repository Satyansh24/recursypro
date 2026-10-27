// ============================================================================
// RECURSY PRO — FULL-STACK FRONTEND ENGINE (MONGODB ATLAS + JWT + VERCEL READY)
// ============================================================================
// STEP FOR VERCEL DEPLOYMENT:
// Local testing ke liye: 'http://localhost:5000/api'
// Jab Backend Vercel par deploy ho jaye, tab yahan apna Vercel Backend URL daalein:
// Example: const API_URL = 'https://recursy-backend.vercel.app/api';
// ============================================================================
const API_URL = 'http://localhost:5000/api';

let appState = {
    authMode: 'login', // 'login' or 'register'
    token: null,
    user: null, // { userId, name, email }
    activeSection: 'dashboard',
    todoFilter: 'all',
    selectedSubjectId: null,
    selectedUnitId: null,
    collapsedTopics: {},
    data: {
        todos: [],
        subjects: [],
        weakAreas: []
    }
};

// --- Default Starter Data ("Calculus for Engineers" & "DSA") ---
function createDefaultSampleData() {
    const subj1Id = 'subj_calculus';
    const unit1Id = 'unit_calc_1';
    const unit2Id = 'unit_calc_2';
    const subj2Id = 'subj_dsa';
    const unitDsa1Id = 'unit_dsa_1';

    return {
        todos: [
            { id: 'td_1', text: 'Revise all formulas for Calculus for Engineers - Unit 1', tag: 'Revision', completed: true, createdAt: Date.now() - 3600000 },
            { id: 'td_2', text: 'Solve 5 practice problems on Partial Derivatives & Euler Theorem', tag: 'Practice', completed: false, createdAt: Date.now() - 1800000 },
            { id: 'td_3', text: 'Complete Double Integration change of order exercise', tag: 'Exam Prep', completed: false, createdAt: Date.now() }
        ],
        subjects: [
            {
                id: subj1Id,
                name: 'Calculus for Engineers',
                createdAt: Date.now(),
                units: [
                    {
                        id: unit1Id,
                        name: 'Unit 1: Differential Calculus',
                        topics: [
                            {
                                id: 'top_101',
                                name: 'Limits, Continuity & Taylor Series',
                                revisions: 2,
                                completed: true,
                                isWeak: false,
                                questions: [
                                    { id: 'q_1', text: 'Q1: Leibnitz Theorem Proof & Maclaurin Series expansion of sin(x)', completed: true },
                                    { id: 'q_2', text: 'Q2: Test continuity and differentiability of f(x) = |x|/x at x = 0', completed: true },
                                    { id: 'q_3', text: 'Q3: Verify Rolle’s Theorem & Mean Value Theorem for polynomials', completed: true }
                                ]
                            },
                            {
                                id: 'top_102',
                                name: 'Partial Derivatives & Euler’s Theorem',
                                revisions: 1,
                                completed: false,
                                isWeak: true,
                                questions: [
                                    { id: 'q_4', text: 'Q1: Verify Euler’s Theorem for u = sin⁻¹(x/y) + tan⁻¹(y/x)', completed: true },
                                    { id: 'q_5', text: 'Q2: Find Jacobian J(u,v / x,y) for polar transformation', completed: false },
                                    { id: 'q_6', text: 'Q3: Maxima and Minima of functions of two variables (Lagrange Multipliers)', completed: false }
                                ]
                            }
                        ]
                    },
                    {
                        id: unit2Id,
                        name: 'Unit 2: Integral & Vector Calculus',
                        topics: [
                            {
                                id: 'top_201',
                                name: 'Double & Triple Integrals (Change of Order)',
                                revisions: 0,
                                completed: false,
                                isWeak: true,
                                questions: [
                                    { id: 'q_7', text: 'Q1: Evaluate Double Integral by changing the order of integration', completed: false },
                                    { id: 'q_8', text: 'Q2: Find the volume of an ellipsoid using Triple Integration', completed: false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: subj2Id,
                name: 'Data Structures & Algorithms',
                createdAt: Date.now() + 100,
                units: [
                    {
                        id: unitDsa1Id,
                        name: 'Unit 1: Arrays, Linked Lists & Stacks',
                        topics: [
                            {
                                id: 'top_301',
                                name: 'Singly & Doubly Linked List Operations',
                                revisions: 3,
                                completed: true,
                                isWeak: false,
                                questions: [
                                    { id: 'q_9', text: 'Q1: Reverse a Linked List iteratively and recursively', completed: true },
                                    { id: 'q_10', text: 'Q2: Detect cycle in a Linked List (Floyd Cycle Detection)', completed: true }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        weakAreas: [
            {
                id: 'wk_1',
                subjectName: 'Calculus for Engineers',
                topicName: 'Maxima & Minima (Lagrange Method)',
                actionPlan: 'Review lecture notes + solve 10 past exam questions (PYQs)',
                progress: 40
            },
            {
                id: 'wk_2',
                subjectName: 'Calculus for Engineers',
                topicName: 'Double Integration (Change of Order)',
                actionPlan: 'Practice 5 boundary-sketching integration limit problems',
                progress: 25
            }
        ]
    };
}

// --- Normalize Legacy Data Structures if any ---
function normalizeTrackerData(raw) {
    const todos = Array.isArray(raw.todos) ? raw.todos : [];
    const subjects = (Array.isArray(raw.subjects) ? raw.subjects : []).map(s => ({
        id: s.id || 'subj_' + Date.now() + Math.random(),
        name: s.name || 'Untitled Subject',
        units: (Array.isArray(s.units) ? s.units : []).map(u => ({
            id: u.id || 'unit_' + Date.now() + Math.random(),
            name: u.name || 'Unit 1',
            topics: (Array.isArray(u.topics || u.chapters) ? (u.topics || u.chapters) : []).map(t => ({
                id: t.id || 'top_' + Date.now() + Math.random(),
                name: t.name || 'Untitled Topic',
                revisions: Number(t.revisions) || 0,
                completed: !!t.completed,
                isWeak: !!t.isWeak,
                questions: (Array.isArray(t.questions) ? t.questions : []).map(q => ({
                    id: q.id || 'q_' + Date.now() + Math.random(),
                    text: q.text || 'Question',
                    completed: !!q.completed
                }))
            }))
        }))
    }));
    const weakAreas = (Array.isArray(raw.weakAreas) ? raw.weakAreas : []).map(w => ({
        id: w.id || 'wk_' + Date.now() + Math.random(),
        subjectName: w.subjectName || 'General',
        topicName: w.topicName || w.topic || 'Weak Topic',
        actionPlan: w.actionPlan || 'Review notes and solve practice problems',
        progress: Number(w.progress) || 0
    }));
    return { todos, subjects, weakAreas };
}

// --- Toast Notification Helper ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-emerald-600 text-white border-emerald-400',
        info: 'bg-indigo-600 text-white border-indigo-400',
        warning: 'bg-amber-500 text-slate-950 border-amber-300',
        error: 'bg-rose-600 text-white border-rose-400'
    };
    const icons = {
        success: 'fa-circle-check',
        info: 'fa-circle-info',
        warning: 'fa-bolt',
        error: 'fa-circle-exclamation'
    };
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold transform transition-all duration-300 ${colors[type] || colors.success}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.success} text-base"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 2600);
}

// --- Custom Confirmation Modal Helper (Replaces ugly confirm() prompts) ---
function askConfirmation(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const cancelBtn = document.getElementById('confirmCancelBtn');
    const okBtn = document.getElementById('confirmOkBtn');

    const cleanup = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        cancelBtn.onclick = null;
        okBtn.onclick = null;
    };

    cancelBtn.onclick = cleanup;
    okBtn.onclick = () => {
        cleanup();
        onConfirm();
    };
}

// --- Auto-Restore Session on Load ---
window.addEventListener('DOMContentLoaded', async () => {
    const savedToken = localStorage.getItem('recursy_token');
    const savedUser = localStorage.getItem('recursy_user');
    if (savedToken && savedUser) {
        appState.token = savedToken;
        appState.user = JSON.parse(savedUser);
        openDashboardUI(appState.user.name);
        await fetchUserDataFromBackend();
    }
});

function openDashboardUI(userName) {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    document.getElementById('headerUserName').textContent = userName;
    document.getElementById('BannerUserName').textContent = userName;
}

// --- Auth UI Handlers ---
window.switchAuthTab = function(mode) {
    appState.authMode = mode;
    const loginBtn = document.getElementById('tabLoginBtn');
    const regBtn = document.getElementById('tabRegisterBtn');
    const nameWrap = document.getElementById('nameFieldWrapper');
    const heading = document.getElementById('authHeading');
    const subheading = document.getElementById('authSubheading');
    const submitText = document.getElementById('authSubmitText');
    const errBox = document.getElementById('authErrorMsg');
    errBox.classList.add('hidden');

    if (mode === 'register') {
        regBtn.className = 'py-2 text-sm font-semibold rounded-lg bg-white dark:bg-darkCard text-neonPurple shadow-sm transition';
        loginBtn.className = 'py-2 text-sm font-semibold rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition';
        nameWrap.classList.remove('hidden');
        heading.textContent = 'Create Recursy Account';
        subheading.textContent = 'Register with your name, email, and password to start tracking';
        submitText.textContent = 'Sign Up & Open Dashboard';
    } else {
        loginBtn.className = 'py-2 text-sm font-semibold rounded-lg bg-white dark:bg-darkCard text-neonPurple shadow-sm transition';
        regBtn.className = 'py-2 text-sm font-semibold rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition';
        nameWrap.classList.add('hidden');
        heading.textContent = 'Sign In to Recursy';
        subheading.textContent = 'Enter your email and password to access your study dashboard';
        submitText.textContent = 'Login to Dashboard';
    }
};

window.handleAuthSubmit = async function(e) {
    e.preventDefault();
    const nameInput = document.getElementById('authName').value.trim();
    const emailInput = document.getElementById('authEmail').value.trim().toLowerCase();
    const passwordInput = document.getElementById('authPassword').value;
    const errBox = document.getElementById('authErrorMsg');
    errBox.classList.add('hidden');

    const endpoint = appState.authMode === 'register' ? '/signup' : '/login';
    const payload = appState.authMode === 'register'
        ? { name: nameInput || emailInput.split('@')[0], email: emailInput, password: passwordInput }
        : { email: emailInput, password: passwordInput };

    try {
        const res = await fetch(API_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');

        appState.token = data.token;
        appState.user = data.user;

        localStorage.setItem('recursy_token', data.token);
        localStorage.setItem('recursy_user', JSON.stringify(data.user));

        openDashboardUI(data.user.name);
        showToast(`Welcome, ${data.user.name}! Connected to MongoDB.`, 'success');
        await fetchUserDataFromBackend();
    } catch (err) {
        errBox.textContent = err.message || 'Could not connect to Backend Server (http://localhost:5000). Make sure npm start is running, or click 1-Click Instant Preview below.';
        errBox.classList.remove('hidden');
    }
};

window.quickInstantDemo = function() {
    const demoUser = { userId: 'demo_local', name: 'Satyansh Kumar Singh', email: 'satyansh@recursy.in' };
    appState.token = 'demo_offline_token';
    appState.user = demoUser;
    const savedLocal = localStorage.getItem('recursy_offline_data');
    appState.data = savedLocal ? normalizeTrackerData(JSON.parse(savedLocal)) : createDefaultSampleData();
    ensureValidSelectedSubject();
    openDashboardUI(demoUser.name);
    renderAll();
    showToast('Instant Demo Workspace Loaded!', 'info');
};

window.handleLogout = function() {
    appState.token = null;
    appState.user = null;
    localStorage.removeItem('recursy_token');
    localStorage.removeItem('recursy_user');
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    showToast('Logged out safely.', 'info');
};

// --- Fetch & Save Data with MongoDB Backend ---
async function fetchUserDataFromBackend() {
    if (!appState.token) return;
    if (appState.token === 'demo_offline_token') {
        const savedLocal = localStorage.getItem('recursy_offline_data');
        appState.data = savedLocal ? normalizeTrackerData(JSON.parse(savedLocal)) : createDefaultSampleData();
        ensureValidSelectedSubject();
        renderAll();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/data`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        if (res.status === 401) return handleLogout();
        const rawData = await res.json();
        appState.data = normalizeTrackerData(rawData);
        ensureValidSelectedSubject();
        renderAll();
    } catch (err) {
        console.error('Error loading from backend:', err);
        showToast('Offline cache loaded (Backend unreachable)', 'warning');
        const savedLocal = localStorage.getItem('recursy_offline_data');
        appState.data = savedLocal ? normalizeTrackerData(JSON.parse(savedLocal)) : createDefaultSampleData();
        ensureValidSelectedSubject();
        renderAll();
    }
}

async function saveWorkspaceToCloud() {
    renderAll();
    localStorage.setItem('recursy_offline_data', JSON.stringify(appState.data));

    if (!appState.token || appState.token === 'demo_offline_token') return;

    const badge = document.getElementById('cloudSyncBadge');
    if (badge) {
        badge.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> Syncing...`;
    }

    try {
        await fetch(`${API_URL}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify(appState.data)
        });
        if (badge) {
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Synced`;
        }
    } catch (err) {
        console.error('Error syncing to MongoDB:', err);
        if (badge) {
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Saved Locally`;
        }
    }
}

function ensureValidSelectedSubject() {
    if (!appState.data.subjects || appState.data.subjects.length === 0) {
        appState.selectedSubjectId = null;
        appState.selectedUnitId = null;
        return;
    }
    const found = appState.data.subjects.find(s => s.id === appState.selectedSubjectId);
    if (!found) {
        appState.selectedSubjectId = appState.data.subjects[0].id;
    }
    const activeSubj = appState.data.subjects.find(s => s.id === appState.selectedSubjectId);
    if (activeSubj && activeSubj.units && activeSubj.units.length > 0) {
        if (!activeSubj.units.find(u => u.id === appState.selectedUnitId)) {
            appState.selectedUnitId = activeSubj.units[0].id;
        }
    } else {
        appState.selectedUnitId = null;
    }
}

// --- Theme Toggle (Dark / Light Mode) ---
window.toggleTheme = function() {
    const htmlEl = document.documentElement;
    if (htmlEl.classList.contains('dark')) {
        htmlEl.classList.remove('dark');
        showToast('Light Mode Activated', 'info');
    } else {
        htmlEl.classList.add('dark');
        showToast('Dark Mode Activated', 'info');
    }
};

// --- Section Navigation Switcher ---
window.switchSection = function(sectionName) {
    appState.activeSection = sectionName;
    const sections = ['dashboard', 'todo', 'subjects', 'weak', 'backend'];
    sections.forEach(s => {
        const el = document.getElementById('section-' + s);
        const navBtn = document.getElementById('nav-' + s);
        if (s === sectionName) {
            el.classList.remove('hidden');
            navBtn.className = 'nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap bg-neonPurple text-white shadow-sm';
        } else {
            el.classList.add('hidden');
            navBtn.className = 'nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-300 hover:text-neonPurple';
        }
    });
    renderAll();
};

// ==================== PROGRESS CALCULATION ENGINE ====================
function calculateTopicStats(topic) {
    const questions = topic.questions || [];
    if (questions.length > 0) {
        const solved = questions.filter(q => q.completed).length;
        const pct = Math.round((solved / questions.length) * 100);
        return { solved, total: questions.length, pct, isDone: pct === 100 || topic.completed };
    }
    return { solved: 0, total: 0, pct: topic.completed ? 100 : 0, isDone: !!topic.completed };
}

function calculateUnitStats(unit) {
    const topics = unit.topics || [];
    if (topics.length === 0) return { pct: 0, totalTopics: 0, completedTopics: 0 };
    let sumPct = 0;
    let completedTopics = 0;
    topics.forEach(t => {
        const st = calculateTopicStats(t);
        sumPct += st.pct;
        if (st.pct === 100) completedTopics++;
    });
    return {
        pct: Math.round(sumPct / topics.length),
        totalTopics: topics.length,
        completedTopics
    };
}

function calculateSubjectStats(subject) {
    const units = subject.units || [];
    let totalUnits = units.length;
    let totalTopics = 0;
    let totalQuestions = 0;
    let solvedQuestions = 0;
    let totalRevisions = 0;
    let topicPctSum = 0;

    units.forEach(u => {
        (u.topics || []).forEach(t => {
            totalTopics++;
            totalRevisions += (t.revisions || 0);
            const st = calculateTopicStats(t);
            topicPctSum += st.pct;
            totalQuestions += st.total;
            solvedQuestions += st.solved;
        });
    });

    const pct = totalTopics > 0 ? Math.round(topicPctSum / totalTopics) : 0;
    return {
        pct,
        totalUnits,
        totalTopics,
        totalQuestions,
        solvedQuestions,
        totalRevisions
    };
}

function calculateOverallMetrics() {
    const subjects = appState.data.subjects || [];
    let totalUnits = 0;
    let totalTopics = 0;
    let totalQuestions = 0;
    let solvedQuestions = 0;
    let totalRevisions = 0;
    let subjPctSum = 0;

    subjects.forEach(s => {
        const st = calculateSubjectStats(s);
        totalUnits += st.totalUnits;
        totalTopics += st.totalTopics;
        totalQuestions += st.totalQuestions;
        solvedQuestions += st.solvedQuestions;
        totalRevisions += st.totalRevisions;
        subjPctSum += st.pct;
    });

    const overallPct = subjects.length > 0 ? Math.round(subjPctSum / subjects.length) : 0;

    const todos = appState.data.todos || [];
    const completedTodos = todos.filter(t => t.completed).length;

    const weakAreas = appState.data.weakAreas || [];
    const weakPct = weakAreas.length > 0
        ? Math.round(weakAreas.reduce((acc, w) => acc + (Number(w.progress) || 0), 0) / weakAreas.length)
        : 0;

    return {
        overallPct,
        subjectsCount: subjects.length,
        totalUnits,
        totalTopics,
        totalQuestions,
        solvedQuestions,
        totalRevisions,
        totalTodos: todos.length,
        completedTodos,
        weakCount: weakAreas.length,
        weakPct
    };
}

// ==================== FEATURE 1: DAILY TO-DO HANDLERS ====================
window.handleAddTodo = async function(e) {
    e.preventDefault();
    const input = document.getElementById('todoInputText');
    const tag = document.getElementById('todoInputTag').value;
    const text = input.value.trim();
    if (!text) return;

    appState.data.todos.unshift({
        id: 'td_' + Date.now(),
        text,
        tag,
        completed: false,
        createdAt: Date.now()
    });
    input.value = '';
    showToast('Task added to your Daily To-Do list!', 'success');
    await saveWorkspaceToCloud();
};

window.toggleTodoComplete = async function(todoId) {
    const item = appState.data.todos.find(t => t.id === todoId);
    if (!item) return;
    item.completed = !item.completed;
    if (item.completed) {
        showToast('Task completed! Marked with a green tick.', 'success');
    }
    await saveWorkspaceToCloud();
};

window.deleteTodoItem = async function(todoId) {
    appState.data.todos = appState.data.todos.filter(t => t.id !== todoId);
    showToast('Task deleted.', 'info');
    await saveWorkspaceToCloud();
};

window.setTodoFilter = function(filter) {
    appState.todoFilter = filter;
    ['all', 'pending', 'completed'].forEach(f => {
        const btn = document.getElementById('todoFilter-' + f);
        if (f === filter) {
            btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white transition';
        } else {
            btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition';
        }
    });
    renderTodoSection();
};

window.clearCompletedTodos = async function() {
    const count = appState.data.todos.filter(t => t.completed).length;
    if (count === 0) {
        showToast('No completed tasks to clear.', 'warning');
        return;
    }
    appState.data.todos = appState.data.todos.filter(t => !t.completed);
    showToast(`Cleared ${count} completed task(s).`, 'info');
    await saveWorkspaceToCloud();
};

// ==================== FEATURE 2: HIERARCHICAL SUBJECT TRACKER HANDLERS ====================
window.handleAddSubject = async function(e) {
    e.preventDefault();
    const input = document.getElementById('newSubjectNameInput');
    const name = input.value.trim();
    if (!name) return;

    const newSubj = {
        id: 'subj_' + Date.now(),
        name,
        createdAt: Date.now(),
        units: [
            {
                id: 'unit_' + Date.now(),
                name: 'Unit 1',
                topics: []
            }
        ]
    };

    appState.data.subjects.push(newSubj);
    appState.selectedSubjectId = newSubj.id;
    appState.selectedUnitId = newSubj.units[0].id;
    input.value = '';
    showToast(`Subject "${name}" added!`, 'success');
    await saveWorkspaceToCloud();
};

window.selectSubject = function(subjectId) {
    appState.selectedSubjectId = subjectId;
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    if (subj && subj.units && subj.units.length > 0) {
        appState.selectedUnitId = subj.units[0].id;
    } else {
        appState.selectedUnitId = null;
    }
    switchSection('subjects');
};

window.deleteSubject = function(subjectId) {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    if (!subj) return;
    askConfirmation(
        'Delete Subject?',
        `Are you sure you want to delete "${subj.name}" along with all its Units, Chapters, and Questions?`,
        async () => {
            appState.data.subjects = appState.data.subjects.filter(s => s.id !== subjectId);
            ensureValidSelectedSubject();
            showToast('Subject deleted.', 'info');
            await saveWorkspaceToCloud();
        }
    );
};

window.handleAddUnit = async function(e, subjectId) {
    e.preventDefault();
    const input = document.getElementById('newUnitNameInput');
    const name = input.value.trim();
    if (!name) return;

    const subj = appState.data.subjects.find(s => s.id === subjectId);
    if (!subj) return;

    const newUnit = {
        id: 'unit_' + Date.now(),
        name,
        topics: []
    };
    subj.units.push(newUnit);
    appState.selectedUnitId = newUnit.id;
    input.value = '';
    showToast(`"${name}" added to ${subj.name}!`, 'success');
    await saveWorkspaceToCloud();
};

window.selectUnitTab = function(unitId) {
    appState.selectedUnitId = unitId;
    renderSubjectsSection();
};

window.deleteUnit = function(subjectId, unitId) {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const unit = subj.units.find(u => u.id === unitId);
    if (!unit) return;

    askConfirmation(
        'Delete Unit?',
        `Are you sure you want to delete "${unit.name}" and all its chapters?`,
        async () => {
            subj.units = subj.units.filter(u => u.id !== unitId);
            ensureValidSelectedSubject();
            showToast('Unit deleted.', 'info');
            await saveWorkspaceToCloud();
        }
    );
};

window.handleAddTopic = async function(e, subjectId, unitId) {
    e.preventDefault();
    const input = document.getElementById('newTopicNameInput');
    const name = input.value.trim();
    if (!name) return;

    const subj = appState.data.subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const unit = subj.units.find(u => u.id === unitId);
    if (!unit) return;

    unit.topics.push({
        id: 'top_' + Date.now(),
        name,
        revisions: 0,
        completed: false,
        isWeak: false,
        questions: []
    });
    input.value = '';
    showToast(`Chapter/Topic "${name}" added!`, 'success');
    await saveWorkspaceToCloud();
};

window.toggleTopicQuestionsCollapse = function(topicId) {
    appState.collapsedTopics[topicId] = !appState.collapsedTopics[topicId];
    renderSubjectsSection();
};

window.incrementRevision = async function(subjectId, unitId, topicId, delta) {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.revisions = Math.max(0, (topic.revisions || 0) + delta);
    if (delta > 0) {
        showToast(`Revision +1! (${topic.name}: Revised ${topic.revisions} times)`, 'success');
    }
    await saveWorkspaceToCloud();
};

window.toggleTopicCompleted = async function(subjectId, unitId, topicId) {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.completed = !topic.completed;
    if (topic.questions && topic.questions.length > 0) {
        topic.questions.forEach(q => q.completed = topic.completed);
    }
    await saveWorkspaceToCloud();
};

window.toggleTopicWeakMark = async function(subjectId, unitId, topicId) {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.isWeak = !topic.isWeak;
    if (topic.isWeak) {
        const exists = appState.data.weakAreas.some(w => w.topicName === topic.name && w.subjectName === subj.name);
        if (!exists) {
            appState.data.weakAreas.push({
                id: 'wk_' + Date.now(),
                subjectName: subj.name,
                topicName: topic.name,
                actionPlan: 'Revise core concepts and solve all practice questions for this chapter',
                progress: 15
            });
        }
        showToast(`"${topic.name}" flagged in Weak Areas!`, 'warning');
    } else {
        showToast(`"${topic.name}" unmarked as Weak Area.`, 'info');
    }
    await saveWorkspaceToCloud();
};

window.deleteTopic = async function(subjectId, unitId, topicId) {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    if (!unit) return;
    unit.topics = unit.topics.filter(t => t.id !== topicId);
    showToast('Chapter/Topic removed.', 'info');
    await saveWorkspaceToCloud();
};

window.handleAddQuestion = async function(e, subjectId, unitId, topicId) {
    e.preventDefault();
    const input = document.getElementById(`qInput_${topicId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.questions.push({
        id: 'q_' + Date.now(),
        text,
        completed: false
    });
    input.value = '';
    showToast('Practice question added!', 'success');
    await saveWorkspaceToCloud();
};

window.toggleQuestionSolved = async function(subjectId, unitId, topicId, questionId) {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    const q = topic?.questions.find(item => item.id === questionId);
    if (!q) return;

    q.completed = !q.completed;
    const allSolved = topic.questions.length > 0 && topic.questions.every(item => item.completed);
    topic.completed = allSolved;

    if (q.completed) {
        showToast('Question marked as solved! (Green Ticked)', 'success');
    }
    await saveWorkspaceToCloud();
};

window.deleteQuestion = async function(subjectId, unitId, topicId, questionId) {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.questions = topic.questions.filter(q => q.id !== questionId);
    await saveWorkspaceToCloud();
};

// ==================== FEATURE 3: WEAK AREAS HANDLERS ====================
window.handleAddWeakArea = async function(e) {
    e.preventDefault();
    const subjectName = document.getElementById('weakSubjectSelect').value || 'General';
    const topicInput = document.getElementById('weakTopicInput');
    const actionInput = document.getElementById('weakActionInput');

    const topicName = topicInput.value.trim();
    const actionPlan = actionInput.value.trim() || 'Practice 30 mins daily and solve past exam questions';
    if (!topicName) return;

    appState.data.weakAreas.unshift({
        id: 'wk_' + Date.now(),
        subjectName,
        topicName,
        actionPlan,
        progress: 0
    });

    topicInput.value = '';
    actionInput.value = '';
    showToast('Weak area added to your recovery tracker!', 'warning');
    await saveWorkspaceToCloud();
};

window.updateWeakProgress = async function(weakId, newProgress) {
    const item = appState.data.weakAreas.find(w => w.id === weakId);
    if (!item) return;
    item.progress = Math.min(100, Math.max(0, Number(newProgress)));
    if (item.progress === 100) {
        showToast(`Awesome! You mastered "${item.topicName}" (100%)!`, 'success');
    }
    await saveWorkspaceToCloud();
};

window.deleteWeakArea = async function(weakId) {
    appState.data.weakAreas = appState.data.weakAreas.filter(w => w.id !== weakId);
    showToast('Weak area removed.', 'info');
    await saveWorkspaceToCloud();
};

// ==================== UI RENDER FUNCTIONS ====================
function renderAll() {
    const metrics = calculateOverallMetrics();

    const pendingTodos = metrics.totalTodos - metrics.completedTodos;
    document.getElementById('navTodoBadge').textContent = pendingTodos;
    document.getElementById('navWeakBadge').textContent = metrics.weakCount;

    renderDashboardSection(metrics);
    renderTodoSection();
    renderSubjectsSection();
    renderWeakSection(metrics);
}

function renderDashboardSection(metrics) {
    document.getElementById('dashOverallPct').textContent = `${metrics.overallPct}%`;
    document.getElementById('dashOverallRemaining').textContent = `${100 - metrics.overallPct}% remaining`;
    document.getElementById('dashOverallBar').style.width = `${metrics.overallPct}%`;

    document.getElementById('dashWeakPct').textContent = `${metrics.weakPct}%`;
    document.getElementById('dashWeakCountText').textContent = `${metrics.weakCount} weak topics`;
    document.getElementById('dashWeakBar').style.width = `${metrics.weakPct}%`;

    document.getElementById('statTodoCompleted').textContent = `${metrics.completedTodos} / ${metrics.totalTodos}`;
    const todoPct = metrics.totalTodos > 0 ? Math.round((metrics.completedTodos / metrics.totalTodos) * 100) : 0;
    document.getElementById('statTodoSub').textContent = `${todoPct}% daily tasks completed`;

    document.getElementById('statSubjectsCount').textContent = `${metrics.subjectsCount} Subjects`;
    document.getElementById('statTopicsSub').textContent = `${metrics.totalUnits} Units • ${metrics.totalTopics} Chapters`;

    document.getElementById('statQuestionsSolved').textContent = `${metrics.solvedQuestions} / ${metrics.totalQuestions}`;
    const qPct = metrics.totalQuestions > 0 ? Math.round((metrics.solvedQuestions / metrics.totalQuestions) * 100) : 0;
    document.getElementById('statQuestionsPct').textContent = `${qPct}% practice questions green-ticked`;

    document.getElementById('statTotalRevisions').textContent = `${metrics.totalRevisions} Times`;

    // Subject Breakdown on Dashboard
    const subjListEl = document.getElementById('dashSubjectList');
    if (appState.data.subjects.length === 0) {
        subjListEl.innerHTML = `<div class="text-center py-8 text-slate-400 text-sm">No subjects added yet. Click "Open Subject Tracker" to add your first subject.</div>`;
    } else {
        subjListEl.innerHTML = appState.data.subjects.map(subj => {
            const st = calculateSubjectStats(subj);
            return `
                <div onclick="selectSubject('${subj.id}')" class="cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 transition">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-neonPurple/15 text-neonPurple flex items-center justify-center font-bold text-sm">
                                <i class="fa-solid fa-book-bookmark"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(subj.name)}</h4>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400">${st.totalUnits} Units • ${st.totalTopics} Topics • ${st.solvedQuestions}/${st.totalQuestions} Questions • 🔄 ${st.totalRevisions} Revisions</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="text-sm font-extrabold text-neonCyan">${st.pct}%</span>
                            <span class="block text-[10px] text-slate-400">${100 - st.pct}% left</span>
                        </div>
                    </div>
                    <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-neonPurple to-neonCyan transition-all duration-300" style="width: ${st.pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Weak Areas Preview on Dashboard
    const weakListEl = document.getElementById('dashWeakList');
    if (appState.data.weakAreas.length === 0) {
        weakListEl.innerHTML = `<div class="text-center py-4 text-xs text-slate-400">No weak areas flagged yet.</div>`;
    } else {
        weakListEl.innerHTML = appState.data.weakAreas.slice(0, 3).map(w => `
            <div class="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div class="flex justify-between items-start text-xs">
                    <div>
                        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">${escapeHtml(w.subjectName)}</span>
                        <h5 class="font-bold text-slate-800 dark:text-slate-200 mt-1">${escapeHtml(w.topicName)}</h5>
                    </div>
                    <span class="font-bold text-amber-500">${w.progress}% Done</span>
                </div>
                <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                    <div class="h-full bg-amber-500" style="width: ${w.progress}%"></div>
                </div>
            </div>
        `).join('');
    }

    // Daily To-Do Preview on Dashboard
    const todoPreviewEl = document.getElementById('dashTodoPreview');
    if (appState.data.todos.length === 0) {
        todoPreviewEl.innerHTML = `<div class="text-center py-4 text-xs text-slate-400">No tasks scheduled for today.</div>`;
    } else {
        todoPreviewEl.innerHTML = appState.data.todos.slice(0, 4).map(td => `
            <div onclick="toggleTodoComplete('${td.id}')" class="cursor-pointer flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs transition">
                <div class="flex items-center gap-2.5 truncate pr-2">
                    <span class="w-5 h-5 rounded-md flex items-center justify-center ${td.completed ? 'bg-emerald-500 text-white' : 'border border-slate-400'}">
                        ${td.completed ? '<i class="fa-solid fa-check text-[10px]"></i>' : ''}
                    </span>
                    <span class="truncate ${td.completed ? 'strikethrough-animated text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}">${escapeHtml(td.text)}</span>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${escapeHtml(td.tag || 'Task')}</span>
            </div>
        `).join('');
    }
}

function renderTodoSection() {
    const todos = appState.data.todos || [];
    const completedCount = todos.filter(t => t.completed).length;
    const pct = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;
    document.getElementById('todoHeaderProgressText').textContent = `${pct}% Completed (${completedCount}/${todos.length})`;

    let filtered = todos;
    if (appState.todoFilter === 'pending') filtered = todos.filter(t => !t.completed);
    if (appState.todoFilter === 'completed') filtered = todos.filter(t => t.completed);

    const container = document.getElementById('todoListContainer');
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <i class="fa-solid fa-clipboard-check text-3xl text-slate-400 mb-2"></i>
                <p class="text-sm text-slate-500 dark:text-slate-400">No tasks found in this filter. Add a new daily task above!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(todo => `
        <div class="flex items-center justify-between gap-3 p-4 rounded-2xl border transition ${
            todo.completed
                ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
        }">
            <div class="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer" onclick="toggleTodoComplete('${todo.id}')">
                <button type="button" class="w-7 h-7 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                    todo.completed
                        ? 'bg-emerald-500 text-white neon-glow-green'
                        : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                }">
                    ${todo.completed ? '<i class="fa-solid fa-check text-sm"></i>' : ''}
                </button>
                <div class="min-w-0 flex-1">
                    <p class="text-sm sm:text-base font-medium break-words transition ${
                        todo.completed ? 'strikethrough-animated text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                    }">
                        ${escapeHtml(todo.text)}
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
                <span class="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                    todo.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }">
                    ${todo.completed ? '✓ Completed' : escapeHtml(todo.tag || 'Daily')}
                </span>
                <button onclick="deleteTodoItem('${todo.id}')" class="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition flex items-center justify-center" title="Delete Task">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderSubjectsSection() {
    const grid = document.getElementById('subjectsGridContainer');
    const workspace = document.getElementById('activeSubjectWorkspace');
    const subjects = appState.data.subjects || [];

    if (subjects.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <p class="text-sm text-slate-500">No subjects added yet. Enter a subject like "Calculus for Engineers" above and click Add Subject!</p>
            </div>
        `;
        workspace.innerHTML = `<p class="text-center text-sm text-slate-400">Select or add a subject above to view its Units, Chapters, and Questions.</p>`;
        return;
    }

    // Render Subject Cards Grid
    grid.innerHTML = subjects.map((subj, idx) => {
        const st = calculateSubjectStats(subj);
        const isSelected = subj.id === appState.selectedSubjectId;
        return `
            <div onclick="selectSubject('${subj.id}')" class="cursor-pointer p-5 rounded-2xl border-2 transition relative ${
                isSelected
                    ? 'border-neonPurple bg-neonPurple/10 dark:bg-neonPurple/15 neon-glow-purple'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-neonPurple/40'
            }">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neonPurple/20 text-neonPurple">Subject ${idx + 1}</span>
                        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5">${escapeHtml(subj.name)}</h3>
                    </div>
                    <button onclick="event.stopPropagation(); deleteSubject('${subj.id}')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition" title="Delete Subject">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>

                <div class="grid grid-cols-3 gap-2 my-4 text-center">
                    <div class="p-2 rounded-xl bg-white/70 dark:bg-slate-900/70">
                        <p class="text-xs font-bold text-slate-800 dark:text-slate-200">${st.totalUnits}</p>
                        <p class="text-[10px] text-slate-400">Units</p>
                    </div>
                    <div class="p-2 rounded-xl bg-white/70 dark:bg-slate-900/70">
                        <p class="text-xs font-bold text-neonCyan">${st.solvedQuestions}/${st.totalQuestions}</p>
                        <p class="text-[10px] text-slate-400">Questions</p>
                    </div>
                    <div class="p-2 rounded-xl bg-white/70 dark:bg-slate-900/70">
                        <p class="text-xs font-bold text-electricYellow">🔄 ${st.totalRevisions}</p>
                        <p class="text-[10px] text-slate-400">Revisions</p>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="text-slate-500 dark:text-slate-400">Completion</span>
                        <span class="text-neonCyan">${st.pct}% Complete</span>
                    </div>
                    <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-neonPurple to-neonCyan transition-all duration-300" style="width: ${st.pct}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Render Active Subject Window
    const activeSubj = subjects.find(s => s.id === appState.selectedSubjectId) || subjects[0];
    const subjStats = calculateSubjectStats(activeSubj);
    const activeUnit = (activeSubj.units || []).find(u => u.id === appState.selectedUnitId) || (activeSubj.units || [])[0] || null;

    workspace.innerHTML = `
        <!-- Subject Window Header -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-darkBorder">
            <div>
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-lg bg-neonPurple text-white text-xs font-bold">ACTIVE SUBJECT WINDOW</span>
                    <span class="text-xs text-slate-500 dark:text-slate-400">Overall: <strong class="text-neonCyan">${subjStats.pct}% Completed</strong> • 🔄 ${subjStats.totalRevisions} Total Revisions</span>
                </div>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">${escapeHtml(activeSubj.name)}</h2>
            </div>

            <!-- Add Unit Form inside Subject (Inline Input - No Browser Prompt!) -->
            <form onsubmit="handleAddUnit(event, '${activeSubj.id}')" class="flex gap-2">
                <input type="text" id="newUnitNameInput" required placeholder="Add new unit (e.g., Unit 2)" class="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-neonCyan">
                <button type="submit" class="px-4 py-2.5 rounded-xl bg-neonCyan hover:bg-cyan-500 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 whitespace-nowrap shadow-md">
                    <i class="fa-solid fa-plus"></i>
                    <span>Add Unit</span>
                </button>
            </form>
        </div>

        <!-- Units Tabs Bar -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2">
            ${(activeSubj.units || []).map(u => {
                const uStats = calculateUnitStats(u);
                const isUnitActive = activeUnit && u.id === activeUnit.id;
                return `
                    <div class="flex items-center rounded-xl transition ${
                        isUnitActive
                            ? 'bg-gradient-to-r from-neonPurple to-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }">
                        <button onclick="selectUnitTab('${u.id}')" class="px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-folder-open"></i>
                            <span>${escapeHtml(u.name)}</span>
                            <span class="px-1.5 py-0.5 rounded text-[10px] ${isUnitActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'}">${uStats.pct}%</span>
                        </button>
                        <button onclick="deleteUnit('${activeSubj.id}', '${u.id}')" class="pr-3 pl-1 py-2.5 text-xs opacity-70 hover:opacity-100 hover:text-rose-300" title="Delete Unit">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Active Unit Chapters/Topics Workspace -->
        ${!activeUnit ? `
            <div class="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <p class="text-sm text-slate-400">No units in this subject yet. Use "Add Unit" above to create Unit 1!</p>
            </div>
        ` : `
            <div class="space-y-6">
                <!-- Add Chapter/Topic Form inside Active Unit (Inline Input - No Browser Prompt!) -->
                <div class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div>
                        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <i class="fa-solid fa-bookmark text-neonCyan"></i>
                            <span>${escapeHtml(activeUnit.name)} — Chapters & Topics</span>
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Add chapters/topics below, list practice questions inside each topic, and increment revisions (+1)</p>
                    </div>
                    <form onsubmit="handleAddTopic(event, '${activeSubj.id}', '${activeUnit.id}')" class="flex gap-2 min-w-[280px] sm:min-w-[360px]">
                        <input type="text" id="newTopicNameInput" required placeholder="Add new chapter or topic..." class="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-neonPurple">
                        <button type="submit" class="px-4 py-2 rounded-xl bg-neonPurple hover:bg-purple-600 text-white font-semibold text-xs sm:text-sm transition whitespace-nowrap">
                            + Add Topic
                        </button>
                    </form>
                </div>

                <!-- Topics List -->
                <div class="space-y-4">
                    ${(activeUnit.topics || []).length === 0 ? `
                        <div class="text-center py-10 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-400">
                            No chapters/topics added to this unit yet. Add your first topic above!
                        </div>
                    ` : (activeUnit.topics || []).map((topic, tIdx) => {
                        const tStats = calculateTopicStats(topic);
                        const isCollapsed = !!appState.collapsedTopics[topic.id];
                        return `
                            <div class="rounded-2xl border transition p-5 ${
                                tStats.isDone
                                    ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/10'
                                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                            }">
                                <!-- Topic Header Row -->
                                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-700/80">
                                    <div class="flex items-start gap-3">
                                        <button onclick="toggleTopicCompleted('${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                                            tStats.isDone
                                                ? 'bg-emerald-500 text-white neon-glow-green'
                                                : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                                        }" title="Mark Entire Topic Completed">
                                            ${tStats.isDone ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                                        </button>
                                        <div>
                                            <div class="flex flex-wrap items-center gap-2">
                                                <span class="text-xs font-bold text-neonPurple">Topic ${tIdx + 1}</span>
                                                <h4 class="text-base sm:text-lg font-bold ${tStats.isDone ? 'strikethrough-animated text-slate-400' : 'text-slate-900 dark:text-white'}">
                                                    ${escapeHtml(topic.name)}
                                                </h4>
                                                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                    tStats.pct === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neonCyan/15 text-neonCyan'
                                                }">${tStats.pct}% Done</span>
                                            </div>
                                            <div class="flex items-center gap-3 mt-1">
                                                <p class="text-xs text-slate-500 dark:text-slate-400">
                                                    Questions Solved: <strong>${tStats.solved} / ${tStats.total}</strong>
                                                </p>
                                                <button onclick="toggleTopicQuestionsCollapse('${topic.id}')" class="text-xs font-semibold text-neonCyan hover:underline flex items-center gap-1">
                                                    <i class="fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[10px]"></i>
                                                    <span>${isCollapsed ? 'Show Questions' : 'Hide Questions'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Topic Controls: Revision Counter (+1), Weak Area Toggle, Delete -->
                                    <div class="flex flex-wrap items-center gap-2.5">
                                        <!-- Revision Counter Box -->
                                        <div class="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <i class="fa-solid fa-rotate text-electricYellow text-xs"></i>
                                            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Revised:</span>
                                            <span class="px-2 py-0.5 rounded-lg bg-electricYellow/20 text-amber-600 dark:text-electricYellow font-extrabold text-sm">${topic.revisions || 0}</span>
                                            <button onclick="incrementRevision('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', 1)" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow" title="Increment Revision Count (+1)">
                                                +1 Revise
                                            </button>
                                            ${(topic.revisions || 0) > 0 ? `
                                                <button onclick="incrementRevision('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', -1)" class="px-1.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs transition" title="Decrease revision count (-1)">
                                                    -1
                                                </button>
                                            ` : ''}
                                        </div>

                                        <!-- Weak Area Toggle -->
                                        <button onclick="toggleTopicWeakMark('${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                                            topic.isWeak
                                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
                                        }">
                                            <i class="fa-solid fa-bolt-lightning"></i>
                                            <span>${topic.isWeak ? 'Weak Area (Flagged)' : 'Mark as Weak Area'}</span>
                                        </button>

                                        <!-- Delete Topic -->
                                        <button onclick="deleteTopic('${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition" title="Delete Topic">
                                            <i class="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                </div>

                                <!-- Expandable/Collapsible Questions List inside Topic -->
                                <div class="${isCollapsed ? 'hidden' : 'mt-4 space-y-2'}">
                                    ${(topic.questions || []).map(q => `
                                        <div class="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition ${
                                            q.completed
                                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                                : 'bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800'
                                        }">
                                            <div onclick="toggleQuestionSolved('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', '${q.id}')" class="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                                                <span class="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                                                    q.completed
                                                        ? 'bg-emerald-500 text-white neon-glow-green'
                                                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                                                }">
                                                    ${q.completed ? '<i class="fa-solid fa-check text-[10px]"></i>' : ''}
                                                </span>
                                                <span class="text-xs sm:text-sm break-words ${
                                                    q.completed ? 'strikethrough-animated text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'
                                                }">${escapeHtml(q.text)}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                ${q.completed ? '<span class="text-[10px] font-bold text-emerald-500">✓ Solved</span>' : ''}
                                                <button onclick="deleteQuestion('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', '${q.id}')" class="text-slate-400 hover:text-rose-500 p-1 transition" title="Delete Question">
                                                    <i class="fa-solid fa-xmark text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}

                                    <!-- Add Question Input inside Topic (Inline Form - No Browser Prompt!) -->
                                    <form onsubmit="handleAddQuestion(event, '${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="flex gap-2 pt-2">
                                        <input type="text" id="qInput_${topic.id}" required placeholder="Add practice question to this topic (e.g., Q1: Leibnitz Theorem Proof or Exercise 1.2 Q5)..." class="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-emerald-500">
                                        <button type="submit" class="px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-emerald-600 text-white text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5">
                                            <i class="fa-solid fa-plus"></i>
                                            <span>Add Question</span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `}
    `;
}

function renderWeakSection(metrics) {
    document.getElementById('weakSectionOverallPct').textContent = `${metrics.weakPct}%`;
    document.getElementById('weakSectionOverallBar').style.width = `${metrics.weakPct}%`;

    const selectEl = document.getElementById('weakSubjectSelect');
    const subjects = appState.data.subjects || [];
    selectEl.innerHTML = subjects.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('') + `<option value="General">Other / General</option>`;

    const listEl = document.getElementById('weakAreasListContainer');
    const weakAreas = appState.data.weakAreas || [];

    if (weakAreas.length === 0) {
        listEl.innerHTML = `
            <div class="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <i class="fa-solid fa-shield-heart text-3xl text-emerald-500 mb-2"></i>
                <p class="text-sm text-slate-500 dark:text-slate-400">No weak areas listed right now! Add one above or click "Mark as Weak Area" on any topic inside your subjects.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = weakAreas.map(w => `
        <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-4">
            <div>
                <div class="flex items-start justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        ${escapeHtml(w.subjectName)}
                    </span>
                    <button onclick="deleteWeakArea('${w.id}')" class="text-slate-400 hover:text-rose-500 transition" title="Remove Weak Area">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2 ${w.progress === 100 ? 'strikethrough-animated text-emerald-400' : ''}">
                    ${escapeHtml(w.topicName)}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <i class="fa-solid fa-bullseye text-neonCyan mr-1"></i> ${escapeHtml(w.actionPlan)}
                </p>
            </div>

            <div class="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700/70">
                <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-slate-500 dark:text-slate-400">Improvement Progress:</span>
                    <span class="${w.progress === 100 ? 'text-emerald-500' : 'text-amber-500'} text-sm">${w.progress}%</span>
                </div>

                <input type="range" min="0" max="100" step="5" value="${w.progress}"
                    onchange="updateWeakProgress('${w.id}', this.value)"
                    class="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg">

                <div class="flex items-center justify-between gap-1 pt-1">
                    <button onclick="updateWeakProgress('${w.id}', ${Math.min(100, (Number(w.progress) || 0) + 25)})" class="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-500 text-xs font-bold transition">
                        +25% Progress
                    </button>
                    <button onclick="updateWeakProgress('${w.id}', 100)" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1">
                        <i class="fa-solid fa-check"></i> Mark Mastered (100%)
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
