// ============================================================================
// RECURSY PRO — FULL-STACK FRONTEND ENGINE (MONGODB ATLAS + JWT + VERCEL READY)
// ============================================================================
const API_URL = "https://recursy-api.vercel.app/api";

let appState = {
  authMode: "login", // 'login' or 'register'
  token: null,
  user: null, // { userId, name, email }
  activeSection: "dashboard",
  todoFilter: "all",
  activeResourceType: "link", // 'link' | 'image' | 'video' | 'document'
  activeResourceCategory: "ALL",
  weeklyFilter: "all",

  selectedSubjectId: null,
  selectedUnitId: null,
  collapsedTopics: {},
  data: {
    todos: [],
    subjects: [],
    weakAreas: [],
    resources: [],
    weeklyTasks: [],
  },
};

// --- Default Starter Data ("Calculus for Engineers" & "DSA") ---
function createDefaultSampleData() {
  const subj1Id = "subj_calculus";
  const unit1Id = "unit_calc_1";
  const unit2Id = "unit_calc_2";
  const subj2Id = "subj_dsa";
  const unitDsa1Id = "unit_dsa_1";

  return {
    todos: [
      {
        id: "td_1",
        text: "Revise all formulas for Calculus for Engineers - Unit 1",
        tag: "Revision",
        completed: true,
        createdAt: Date.now() - 3600000,
      },
      {
        id: "td_2",
        text: "Solve 5 practice problems on Partial Derivatives & Euler Theorem",
        tag: "Practice",
        completed: false,
        createdAt: Date.now() - 1800000,
      },
      {
        id: "td_3",
        text: "Complete Double Integration change of order exercise",
        tag: "Exam Prep",
        completed: false,
        createdAt: Date.now(),
      },
    ],
    subjects: [
      {
        id: subj1Id,
        name: "Calculus for Engineers",
        createdAt: Date.now(),
        units: [
          {
            id: unit1Id,
            name: "Unit 1: Differential Calculus",
            topics: [
              {
                id: "top_101",
                name: "Limits, Continuity & Taylor Series",
                revisions: 2,
                completed: true,
                isWeak: false,
                questions: [
                  {
                    id: "q_1",
                    text: "Q1: Leibnitz Theorem Proof & Maclaurin Series expansion of sin(x)",
                    completed: true,
                  },
                  {
                    id: "q_2",
                    text: "Q2: Test continuity and differentiability of f(x) = |x|/x at x = 0",
                    completed: true,
                  },
                  {
                    id: "q_3",
                    text: "Q3: Verify Rolle’s Theorem & Mean Value Theorem for polynomials",
                    completed: true,
                  },
                ],
              },
              {
                id: "top_102",
                name: "Partial Derivatives & Euler’s Theorem",
                revisions: 1,
                completed: false,
                isWeak: true,
                questions: [
                  {
                    id: "q_4",
                    text: "Q1: Verify Euler’s Theorem for u = sin⁻¹(x/y) + tan⁻¹(y/x)",
                    completed: true,
                  },
                  {
                    id: "q_5",
                    text: "Q2: Find Jacobian J(u,v / x,y) for polar transformation",
                    completed: false,
                  },
                  {
                    id: "q_6",
                    text: "Q3: Maxima and Minima of functions of two variables (Lagrange Multipliers)",
                    completed: false,
                  },
                ],
              },
            ],
          },
          {
            id: unit2Id,
            name: "Unit 2: Integral & Vector Calculus",
            topics: [
              {
                id: "top_201",
                name: "Double & Triple Integrals (Change of Order)",
                revisions: 0,
                completed: false,
                isWeak: true,
                questions: [
                  {
                    id: "q_7",
                    text: "Q1: Evaluate Double Integral by changing the order of integration",
                    completed: false,
                  },
                  {
                    id: "q_8",
                    text: "Q2: Find the volume of an ellipsoid using Triple Integration",
                    completed: false,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: subj2Id,
        name: "Data Structures & Algorithms",
        createdAt: Date.now() + 100,
        units: [
          {
            id: unitDsa1Id,
            name: "Unit 1: Arrays, Linked Lists & Stacks",
            topics: [
              {
                id: "top_301",
                name: "Singly & Doubly Linked List Operations",
                revisions: 3,
                completed: true,
                isWeak: false,
                questions: [
                  {
                    id: "q_9",
                    text: "Q1: Reverse a Linked List iteratively and recursively",
                    completed: true,
                  },
                  {
                    id: "q_10",
                    text: "Q2: Detect cycle in a Linked List (Floyd Cycle Detection)",
                    completed: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    weakAreas: [
      {
        id: "wk_1",
        subjectName: "Calculus for Engineers",
        topicName: "Maxima & Minima (Lagrange Method)",
        actionPlan:
          "Review lecture notes + solve 10 past exam questions (PYQs)",
        progress: 40,
      },
      {
        id: "wk_2",
        subjectName: "Calculus for Engineers",
        topicName: "Double Integration (Change of Order)",
        actionPlan: "Practice 5 boundary-sketching integration limit problems",
        progress: 25,
      },
    ],
    weeklyTasks: [
      {
        id: "wkt_1",
        text: "Finish Calculus Unit 1 & Unit 2 Complete Revision",
        targetDate: new Date(Date.now() + 86400000 * 2)
          .toISOString()
          .split("T")[0],
        tag: "📚 Syllabus Goal",
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: "wkt_2",
        text: "Solve 15 Linked List & Stack Problems on LeetCode/GFG",
        targetDate: new Date(Date.now() + 86400000 * 4)
          .toISOString()
          .split("T")[0],
        tag: "💻 Coding / DSA",
        completed: true,
        createdAt: Date.now(),
      },
    ],
  };
}

// --- Normalize Legacy Data Structures if any ---
function normalizeTrackerData(raw) {
  const todos = Array.isArray(raw.todos) ? raw.todos : [];
  const subjects = (Array.isArray(raw.subjects) ? raw.subjects : []).map(
    (s) => ({
      id: s.id || "subj_" + Date.now() + Math.random(),
      name: s.name || "Untitled Subject",
      units: (Array.isArray(s.units) ? s.units : []).map((u) => ({
        id: u.id || "unit_" + Date.now() + Math.random(),
        name: u.name || "Unit 1",
        topics: (Array.isArray(u.topics || u.chapters)
          ? u.topics || u.chapters
          : []
        ).map((t) => ({
          id: t.id || "top_" + Date.now() + Math.random(),
          name: t.name || "Untitled Topic",
          revisions: Number(t.revisions) || 0,
          completed: !!t.completed,
          isWeak: !!t.isWeak,
          questions: (Array.isArray(t.questions) ? t.questions : []).map(
            (q) => ({
              id: q.id || "q_" + Date.now() + Math.random(),
              text: q.text || "Question",
              completed: !!q.completed,
            }),
          ),
        })),
      })),
    }),
  );
  const weakAreas = (Array.isArray(raw.weakAreas) ? raw.weakAreas : []).map(
    (w) => ({
      id: w.id || "wk_" + Date.now() + Math.random(),
      subjectName: w.subjectName || "General",
      topicName: w.topicName || w.topic || "Weak Topic",
      actionPlan: w.actionPlan || "Review notes and solve practice problems",
      progress: Number(w.progress) || 0,
    }),
  );
  const weeklyTasks = (
    Array.isArray(raw.weeklyTasks) ? raw.weeklyTasks : []
  ).map((wt) => ({
    id: wt.id || "wkt_" + Date.now() + Math.random(),
    text: wt.text || "Weekly Target",
    targetDate: wt.targetDate || new Date().toISOString().split("T")[0],
    tag: wt.tag || "🎯 Core Target",
    completed: !!wt.completed,
    createdAt: wt.createdAt || Date.now(),
  }));
  const resources = (Array.isArray(raw.resources) ? raw.resources : []).map(
    (r) => ({
      id: r.id || "res_" + Date.now() + Math.random(),
      type: r.type || "link", // link, image, video, document
      category: (r.category || "General").trim(),
      tag: (r.tag || "Untitled Resource").trim(),
      url: r.url || "",
      fileName: r.fileName || "",
      mimeType: r.mimeType || "",
      sizeBytes: Number(r.sizeBytes) || 0,
      createdAt: r.createdAt || Date.now(),
    }),
  );
  return { todos, subjects, weakAreas, weeklyTasks, resources };
}

// --- Toast Notification Helper (Unified 3-Color Palette) ---
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  const colors = {
    success: "bg-neonPurple text-black border-neonPurple",
    info: "bg-neonCyan text-black border-neonCyan",
    warning: "bg-electricYellow text-black border-electricYellow",
    error: "bg-electricYellow text-black border-electricYellow",
  };
  const icons = {
    success: "fa-circle-check",
    info: "fa-circle-info",
    warning: "fa-bolt",
    error: "fa-circle-exclamation",
  };
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold transform transition-all duration-300 ${colors[type] || colors.success}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.success} text-base"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

// --- Custom Confirmation Modal Helper ---
function askConfirmation(title, message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const cancelBtn = document.getElementById("confirmCancelBtn");
  const okBtn = document.getElementById("confirmOkBtn");

  const cleanup = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
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
window.addEventListener("DOMContentLoaded", async () => {
  const savedToken = localStorage.getItem("recursy_token");
  const savedUser = localStorage.getItem("recursy_user");
  if (savedToken && savedUser) {
    appState.token = savedToken;
    appState.user = JSON.parse(savedUser);
    openDashboardUI(appState.user.name);
    await fetchUserDataFromBackend();
  }
});

function openDashboardUI(userName) {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appContainer").classList.remove("hidden");
  document.getElementById("headerUserName").textContent = userName;
  document.getElementById("BannerUserName").textContent = userName;
}

// --- Auth UI Handlers ---
window.switchAuthTab = function (mode) {
  appState.authMode = mode;
  const loginBtn = document.getElementById("tabLoginBtn");
  const regBtn = document.getElementById("tabRegisterBtn");
  const nameWrap = document.getElementById("nameFieldWrapper");
  const heading = document.getElementById("authHeading");
  const subheading = document.getElementById("authSubheading");
  const submitText = document.getElementById("authSubmitText");
  const errBox = document.getElementById("authErrorMsg");
  errBox.classList.add("hidden");

  if (mode === "register") {
    regBtn.className =
      "py-2 text-sm font-bold rounded-lg bg-white dark:bg-darkCard text-neonPurple shadow-sm transition";
    loginBtn.className =
      "py-2 text-sm font-semibold rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition";
    nameWrap.classList.remove("hidden");
    heading.textContent = "Create Recursy Account";
    subheading.textContent =
      "Register with your name, email, and password to start tracking";
    submitText.textContent = "Sign Up & Open Dashboard";
  } else {
    loginBtn.className =
      "py-2 text-sm font-bold rounded-lg bg-white dark:bg-darkCard text-neonPurple shadow-sm transition";
    regBtn.className =
      "py-2 text-sm font-semibold rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition";
    nameWrap.classList.add("hidden");
    heading.textContent = "Sign In to Recursy";
    subheading.textContent =
      "Enter your email and password to access your study dashboard";
    submitText.textContent = "Login to Dashboard";
  }
};

window.handleAuthSubmit = async function (e) {
  e.preventDefault();
  const nameInput = document.getElementById("authName").value.trim();
  const emailInput = document
    .getElementById("authEmail")
    .value.trim()
    .toLowerCase();
  const passwordInput = document.getElementById("authPassword").value;
  const errBox = document.getElementById("authErrorMsg");
  errBox.classList.add("hidden");

  const endpoint = appState.authMode === "register" ? "/signup" : "/login";
  const payload =
    appState.authMode === "register"
      ? {
          name: nameInput || emailInput.split("@")[0],
          email: emailInput,
          password: passwordInput,
        }
      : { email: emailInput, password: passwordInput };

  try {
    const res = await fetch(API_URL + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Authentication failed");

    appState.token = data.token;
    appState.user = data.user;

    localStorage.setItem("recursy_token", data.token);
    localStorage.setItem("recursy_user", JSON.stringify(data.user));

    openDashboardUI(data.user.name);
    showToast(`Welcome, ${data.user.name}! Connected to MongoDB.`, "success");
    await fetchUserDataFromBackend();
  } catch (err) {
    errBox.textContent =
      err.message ||
      "Could not connect to Backend Server (http://localhost:5000). Make sure npm start is running, or click 1-Click Instant Preview below.";
    errBox.classList.remove("hidden");
  }
};

window.quickInstantDemo = function () {
  const demoUser = {
    userId: "demo_local",
    name: "Satyansh Kumar Singh",
    email: "satyansh@recursy.in",
  };
  appState.token = "demo_offline_token";
  appState.user = demoUser;
  const savedLocal = localStorage.getItem("recursy_offline_data");
  appState.data = savedLocal
    ? normalizeTrackerData(JSON.parse(savedLocal))
    : createDefaultSampleData();
  ensureValidSelectedSubject();
  openDashboardUI(demoUser.name);
  renderAll();
  showToast("Instant Demo Workspace Loaded!", "info");
};

window.handleLogout = function () {
  appState.token = null;
  appState.user = null;
  localStorage.removeItem("recursy_token");
  localStorage.removeItem("recursy_user");
  document.getElementById("appContainer").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  showToast("Logged out safely.", "info");
};

// --- Fetch & Save Data with Strict MongoDB Verification & Anti-Data-Loss Protection ---
let syncTimeout = null;

async function fetchUserDataFromBackend() {
  if (!appState.token) return;

  const userKey = `recursy_backup_${appState.user?.userId || "default"}`;
  const savedLocalRaw =
    localStorage.getItem(userKey) ||
    localStorage.getItem("recursy_offline_data");
  const localParsed = savedLocalRaw ? JSON.parse(savedLocalRaw) : null;

  try {
    const res = await fetch(`${API_URL}/data`, {
      headers: { Authorization: `Bearer ${appState.token}` },
    });
    if (res.status === 401) return handleLogout();
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const rawData = await res.json();
    // Backend kabhi { tracker: {...} } bhejta hai ya seedha object
    const serverPayload = rawData.tracker || rawData;
    const serverTime = serverPayload.updatedAt
      ? new Date(serverPayload.updatedAt).getTime()
      : 0;
    const localTime = localParsed?.updatedAt || 0;

    // PROTECTION: Agar local backup server se naya hai (matlab pichla cloud sync fail hua tha)
    if (localParsed && localTime > serverTime + 2000) {
      appState.data = normalizeTrackerData(localParsed);
      ensureValidSelectedSubject();
      renderAll();
      showToast(
        "Restored unsynced local changes & syncing to Cloud now...",
        "info",
      );
      await saveWorkspaceToCloud(); // Turant cloud par push karo
      return;
    }

    appState.data = normalizeTrackerData(serverPayload);
    appState.data.updatedAt = serverTime || Date.now();
    localStorage.setItem(userKey, JSON.stringify(appState.data));
    ensureValidSelectedSubject();
    renderAll();
  } catch (err) {
    console.error("Error loading from backend:", err);
    showToast("Offline backup loaded (Cloud unreachable)", "warning");
    appState.data = localParsed
      ? normalizeTrackerData(localParsed)
      : createDefaultSampleData();
    ensureValidSelectedSubject();
    renderAll();
  }
}

async function saveWorkspaceToCloud() {
  // Har change par exact timestamp lagao taaki purana data kabhi naye ko overwrite na kare
  appState.data.updatedAt = Date.now();
  renderAll();

  const userKey = `recursy_backup_${appState.user?.userId || "default"}`;
  localStorage.setItem(userKey, JSON.stringify(appState.data));
  localStorage.setItem("recursy_offline_data", JSON.stringify(appState.data));

  if (!appState.token || appState.token === "demo_offline_token") return;

  const badge = document.getElementById("cloudSyncBadge");
  if (badge) {
    badge.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> Syncing...`;
  }

  // Debounce (300ms): Agar 5 units jaldi-jaldi banaye toh saari requests aapas me na takrayein
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`${API_URL}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appState.token}`,
        },
        body: JSON.stringify(appState.data),
      });

      if (res.status === 401) {
        showToast("Session expired! Please log in again.", "error");
        return handleLogout();
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      // Server se confirm hone ke baad local timestamp ko server ke timestamp se match karo
      const result = await res.json();
      if (result.tracker && result.tracker.updatedAt) {
        appState.data.updatedAt = new Date(result.tracker.updatedAt).getTime();
        localStorage.setItem(userKey, JSON.stringify(appState.data));
      }

      if (badge) {
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-neonPurple animate-pulse"></span> Cloud Synced`;
      }
    } catch (err) {
      console.error("Error syncing to MongoDB:", err);
      showToast(
        `Cloud Sync Failed: ${err.message}. Safe in Local Backup!`,
        "warning",
      );
      if (badge) {
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-electricYellow"></span> Unsynced (Local Safe)`;
      }
    }
  }, 300);
}
function ensureValidSelectedSubject() {
  if (!appState.data.subjects || appState.data.subjects.length === 0) {
    appState.selectedSubjectId = null;
    appState.selectedUnitId = null;
    return;
  }
  const found = appState.data.subjects.find(
    (s) => s.id === appState.selectedSubjectId,
  );
  if (!found) {
    appState.selectedSubjectId = appState.data.subjects[0].id;
  }
  const activeSubj = appState.data.subjects.find(
    (s) => s.id === appState.selectedSubjectId,
  );
  if (activeSubj && activeSubj.units && activeSubj.units.length > 0) {
    if (!activeSubj.units.find((u) => u.id === appState.selectedUnitId)) {
      appState.selectedUnitId = activeSubj.units[0].id;
    }
  } else {
    appState.selectedUnitId = null;
  }
}

// --- Theme Toggle (Dark / Light Mode) ---
window.toggleTheme = function () {
  const htmlEl = document.documentElement;
  if (htmlEl.classList.contains("dark")) {
    htmlEl.classList.remove("dark");
    showToast("Light Mode Activated", "info");
  } else {
    htmlEl.classList.add("dark");
    showToast("Dark Mode Activated", "info");
  }
};

// --- Section Navigation Switcher ---
window.switchSection = function (sectionName) {
  appState.activeSection = sectionName;
  const sections = [
    "dashboard",
    "todo",
    "subjects",
    "weekly",
    "weak",
    "resources",
  ];
  sections.forEach((s) => {
    const el = document.getElementById("section-" + s);
    const navBtn = document.getElementById("nav-" + s);
    if (s === sectionName) {
      el.classList.remove("hidden");
      navBtn.className =
        "nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap bg-neonPurple text-black shadow-sm";
    } else {
      el.classList.add("hidden");
      navBtn.className =
        "nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-300 hover:text-neonPurple";
    }
  });
  renderAll();
};

// ==================== PROGRESS CALCULATION ENGINE ====================
function calculateTopicStats(topic) {
  const questions = topic.questions || [];
  if (questions.length > 0) {
    const solved = questions.filter((q) => q.completed).length;
    const pct = Math.round((solved / questions.length) * 100);
    return {
      solved,
      total: questions.length,
      pct,
      isDone: pct === 100 || topic.completed,
    };
  }
  return {
    solved: 0,
    total: 0,
    pct: topic.completed ? 100 : 0,
    isDone: !!topic.completed,
  };
}

function calculateUnitStats(unit) {
  const topics = unit.topics || [];
  if (topics.length === 0)
    return { pct: 0, totalTopics: 0, completedTopics: 0 };
  let sumPct = 0;
  let completedTopics = 0;
  topics.forEach((t) => {
    const st = calculateTopicStats(t);
    sumPct += st.pct;
    if (st.pct === 100) completedTopics++;
  });
  return {
    pct: Math.round(sumPct / topics.length),
    totalTopics: topics.length,
    completedTopics,
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

  units.forEach((u) => {
    (u.topics || []).forEach((t) => {
      totalTopics++;
      totalRevisions += t.revisions || 0;
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
    totalRevisions,
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

  subjects.forEach((s) => {
    const st = calculateSubjectStats(s);
    totalUnits += st.totalUnits;
    totalTopics += st.totalTopics;
    totalQuestions += st.totalQuestions;
    solvedQuestions += st.solvedQuestions;
    totalRevisions += st.totalRevisions;
    subjPctSum += st.pct;
  });

  const overallPct =
    subjects.length > 0 ? Math.round(subjPctSum / subjects.length) : 0;

  const todos = appState.data.todos || [];
  const completedTodos = todos.filter((t) => t.completed).length;

  const weakAreas = appState.data.weakAreas || [];
  const weakPct =
    weakAreas.length > 0
      ? Math.round(
          weakAreas.reduce((acc, w) => acc + (Number(w.progress) || 0), 0) /
            weakAreas.length,
        )
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
    weakPct,
  };
}

// ==================== FEATURE 1: DAILY TO-DO HANDLERS ====================
window.handleAddTodo = async function (e) {
  e.preventDefault();
  const input = document.getElementById("todoInputText");
  const tag = document.getElementById("todoInputTag").value;
  const text = input.value.trim();
  if (!text) return;

  appState.data.todos.unshift({
    id: "td_" + Date.now(),
    text,
    tag,
    completed: false,
    createdAt: Date.now(),
  });
  input.value = "";
  showToast("Task added to your Daily To-Do list!", "success");
  await saveWorkspaceToCloud();
};

window.toggleTodoComplete = async function (todoId) {
  const item = appState.data.todos.find((t) => t.id === todoId);
  if (!item) return;
  item.completed = !item.completed;
  if (item.completed) {
    showToast("Task completed! Marked with a green tick.", "success");
  }
  await saveWorkspaceToCloud();
};

window.deleteTodoItem = async function (todoId) {
  appState.data.todos = appState.data.todos.filter((t) => t.id !== todoId);
  showToast("Task deleted.", "info");
  await saveWorkspaceToCloud();
};

window.setTodoFilter = function (filter) {
  appState.todoFilter = filter;
  ["all", "pending", "completed"].forEach((f) => {
    const btn = document.getElementById("todoFilter-" + f);
    if (f === filter) {
      btn.className =
        "px-3 py-1.5 rounded-lg text-xs font-bold bg-neonPurple text-black transition";
    } else {
      btn.className =
        "px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-300 transition";
    }
  });
  renderTodoSection();
};

window.clearCompletedTodos = async function () {
  const count = appState.data.todos.filter((t) => t.completed).length;
  if (count === 0) {
    showToast("No completed tasks to clear.", "warning");
    return;
  }
  appState.data.todos = appState.data.todos.filter((t) => !t.completed);
  showToast(`Cleared ${count} completed task(s).`, "info");
  await saveWorkspaceToCloud();
};

// ==================== FEATURE 2: HIERARCHICAL SUBJECT TRACKER HANDLERS ====================
window.handleAddSubject = async function (e) {
  e.preventDefault();
  const input = document.getElementById("newSubjectNameInput");
  const name = input.value.trim();
  if (!name) return;

  const newSubj = {
    id: "subj_" + Date.now(),
    name,
    createdAt: Date.now(),
    units: [
      {
        id: "unit_" + Date.now(),
        name: "Unit 1",
        topics: [],
      },
    ],
  };

  appState.data.subjects.push(newSubj);
  appState.selectedSubjectId = newSubj.id;
  appState.selectedUnitId = newSubj.units[0].id;
  input.value = "";
  showToast(`Subject "${name}" added!`, "success");
  await saveWorkspaceToCloud();
};

window.selectSubject = function (subjectId) {
  appState.selectedSubjectId = subjectId;
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  if (subj && subj.units && subj.units.length > 0) {
    appState.selectedUnitId = subj.units[0].id;
  } else {
    appState.selectedUnitId = null;
  }
  switchSection("subjects");
};

window.deleteSubject = function (subjectId) {
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  if (!subj) return;
  askConfirmation(
    "Delete Subject?",
    `Are you sure you want to delete "${subj.name}" along with all its Units, Chapters, and Questions?`,
    async () => {
      appState.data.subjects = appState.data.subjects.filter(
        (s) => s.id !== subjectId,
      );
      ensureValidSelectedSubject();
      showToast("Subject deleted.", "info");
      await saveWorkspaceToCloud();
    },
  );
};

window.handleAddUnit = async function (e, subjectId) {
  e.preventDefault();
  const input = document.getElementById("newUnitNameInput");
  const name = input.value.trim();
  if (!name) return;

  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  if (!subj) return;

  const newUnit = {
    id: "unit_" + Date.now(),
    name,
    topics: [],
  };
  subj.units.push(newUnit);
  appState.selectedUnitId = newUnit.id;
  input.value = "";
  showToast(`"${name}" added to ${subj.name}!`, "success");
  await saveWorkspaceToCloud();
};

window.selectUnitTab = function (unitId) {
  appState.selectedUnitId = unitId;
  renderSubjectsSection();
};

window.deleteUnit = function (subjectId, unitId) {
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  if (!subj) return;
  const unit = subj.units.find((u) => u.id === unitId);
  if (!unit) return;

  askConfirmation(
    "Delete Unit?",
    `Are you sure you want to delete "${unit.name}" and all its chapters?`,
    async () => {
      subj.units = subj.units.filter((u) => u.id !== unitId);
      ensureValidSelectedSubject();
      showToast("Unit deleted.", "info");
      await saveWorkspaceToCloud();
    },
  );
};

window.handleAddTopic = async function (e, subjectId, unitId) {
  e.preventDefault();
  const input = document.getElementById("newTopicNameInput");
  const name = input.value.trim();
  if (!name) return;

  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  if (!subj) return;
  const unit = subj.units.find((u) => u.id === unitId);
  if (!unit) return;

  unit.topics.push({
    id: "top_" + Date.now(),
    name,
    revisions: 0,
    completed: false,
    isWeak: false,
    questions: [],
  });
  input.value = "";
  showToast(`Chapter/Topic "${name}" added!`, "success");
  await saveWorkspaceToCloud();
};

window.toggleTopicQuestionsCollapse = function (topicId) {
  appState.collapsedTopics[topicId] = !appState.collapsedTopics[topicId];
  renderSubjectsSection();
};

window.incrementRevision = async function (subjectId, unitId, topicId, delta) {
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  const unit = subj?.units.find((u) => u.id === unitId);
  const topic = unit?.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.revisions = Math.max(0, (topic.revisions || 0) + delta);
  if (delta > 0) {
    showToast(
      `Revision +1! (${topic.name}: Revised ${topic.revisions} times)`,
      "success",
    );
  }
  await saveWorkspaceToCloud();
};

window.toggleTopicCompleted = async function (subjectId, unitId, topicId) {
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  const unit = subj?.units.find((u) => u.id === unitId);
  const topic = unit?.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.completed = !topic.completed;
  if (topic.questions && topic.questions.length > 0) {
    topic.questions.forEach((q) => (q.completed = topic.completed));
  }
  await saveWorkspaceToCloud();
};

window.toggleTopicWeakMark = async function (subjectId, unitId, topicId) {
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  const unit = subj?.units.find((u) => u.id === unitId);
  const topic = unit?.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.isWeak = !topic.isWeak;
  if (topic.isWeak) {
    const exists = appState.data.weakAreas.some(
      (w) => w.topicName === topic.name && w.subjectName === subj.name,
    );
    if (!exists) {
      appState.data.weakAreas.push({
        id: "wk_" + Date.now(),
        subjectName: subj.name,
        topicName: topic.name,
        actionPlan:
          "Revise core concepts and solve all practice questions for this chapter",
        progress: 15,
      });
    }
    showToast(`"${topic.name}" flagged in Weak Areas!`, "warning");
  } else {
    showToast(`"${topic.name}" unmarked as Weak Area.`, "info");
  }
  await saveWorkspaceToCloud();
};

window.deleteTopic = async function (subjectId, unitId, topicId) {
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  const unit = subj?.units.find((u) => u.id === unitId);
  if (!unit) return;
  unit.topics = unit.topics.filter((t) => t.id !== topicId);
  showToast("Chapter/Topic removed.", "info");
  await saveWorkspaceToCloud();
};

window.handleAddQuestion = async function (e, subjectId, unitId, topicId) {
  e.preventDefault();
  const input = document.getElementById(`qInput_${topicId}`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  const unit = subj?.units.find((u) => u.id === unitId);
  const topic = unit?.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.questions.push({
    id: "q_" + Date.now(),
    text,
    completed: false,
  });
  input.value = "";
  showToast("Practice question added!", "success");
  await saveWorkspaceToCloud();
};

window.toggleQuestionSolved = async function (
  subjectId,
  unitId,
  topicId,
  questionId,
) {
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  const unit = subj?.units.find((u) => u.id === unitId);
  const topic = unit?.topics.find((t) => t.id === topicId);
  const q = topic?.questions.find((item) => item.id === questionId);
  if (!q) return;

  q.completed = !q.completed;
  const allSolved =
    topic.questions.length > 0 &&
    topic.questions.every((item) => item.completed);
  topic.completed = allSolved;

  if (q.completed) {
    showToast("Question marked as solved! (Green Ticked)", "success");
  }
  await saveWorkspaceToCloud();
};

window.deleteQuestion = async function (
  subjectId,
  unitId,
  topicId,
  questionId,
) {
  const subj = appState.data.subjects.find((s) => s.id === subjectId);
  const unit = subj?.units.find((u) => u.id === unitId);
  const topic = unit?.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.questions = topic.questions.filter((q) => q.id !== questionId);
  await saveWorkspaceToCloud();
};

// ==================== FEATURE 3: WEAK AREAS HANDLERS ====================
window.handleAddWeakArea = async function (e) {
  e.preventDefault();
  const subjectName =
    document.getElementById("weakSubjectSelect").value || "General";
  const topicInput = document.getElementById("weakTopicInput");
  const actionInput = document.getElementById("weakActionInput");

  const topicName = topicInput.value.trim();
  const actionPlan =
    actionInput.value.trim() ||
    "Practice 30 mins daily and solve past exam questions";
  if (!topicName) return;

  appState.data.weakAreas.unshift({
    id: "wk_" + Date.now(),
    subjectName,
    topicName,
    actionPlan,
    progress: 0,
  });

  topicInput.value = "";
  actionInput.value = "";
  showToast("Weak area added to your recovery tracker!", "warning");
  await saveWorkspaceToCloud();
};

window.updateWeakProgress = async function (weakId, newProgress) {
  const item = appState.data.weakAreas.find((w) => w.id === weakId);
  if (!item) return;
  item.progress = Math.min(100, Math.max(0, Number(newProgress)));
  if (item.progress === 100) {
    showToast(`Awesome! You mastered "${item.topicName}" (100%)!`, "success");
  }
  await saveWorkspaceToCloud();
};

window.deleteWeakArea = async function (weakId) {
  appState.data.weakAreas = appState.data.weakAreas.filter(
    (w) => w.id !== weakId,
  );
  showToast("Weak area removed.", "info");
  await saveWorkspaceToCloud();
};

// ==================== UI RENDER FUNCTIONS ====================
function renderAll() {
  const metrics = calculateOverallMetrics();

  const pendingTodos = metrics.totalTodos - metrics.completedTodos;
  document.getElementById("navTodoBadge").textContent = pendingTodos;
  document.getElementById("navWeakBadge").textContent = metrics.weakCount;

  renderDashboardSection(metrics);
  renderTodoSection();
  renderSubjectsSection();
  const weeklyTasks = appState.data.weeklyTasks || [];
  const pendingWeekly = weeklyTasks.filter((t) => !t.completed).length;
  const navWeeklyBadge = document.getElementById("navWeeklyBadge");
  if (navWeeklyBadge) navWeeklyBadge.textContent = pendingWeekly;
  renderWeeklySection();
  renderWeakSection(metrics);
  const totalRes = (appState.data.resources || []).length;
  const navResBadge = document.getElementById("navResourcesBadge");
  if (navResBadge) navResBadge.textContent = totalRes;
  renderResourcesSection();
}

function renderDashboardSection(metrics) {
  document.getElementById("dashOverallPct").textContent =
    `${metrics.overallPct}%`;
  document.getElementById("dashOverallRemaining").textContent =
    `${100 - metrics.overallPct}% remaining`;
  document.getElementById("dashOverallBar").style.width =
    `${metrics.overallPct}%`;

  document.getElementById("dashWeakPct").textContent = `${metrics.weakPct}%`;
  document.getElementById("dashWeakCountText").textContent =
    `${metrics.weakCount} weak topics`;
  document.getElementById("dashWeakBar").style.width = `${metrics.weakPct}%`;

  document.getElementById("statTodoCompleted").textContent =
    `${metrics.completedTodos} / ${metrics.totalTodos}`;
  const todoPct =
    metrics.totalTodos > 0
      ? Math.round((metrics.completedTodos / metrics.totalTodos) * 100)
      : 0;
  document.getElementById("statTodoSub").textContent =
    `${todoPct}% daily tasks completed`;

  document.getElementById("statSubjectsCount").textContent =
    `${metrics.subjectsCount} Subjects`;
  document.getElementById("statTopicsSub").textContent =
    `${metrics.totalUnits} Units • ${metrics.totalTopics} Chapters`;

  document.getElementById("statQuestionsSolved").textContent =
    `${metrics.solvedQuestions} / ${metrics.totalQuestions}`;
  const qPct =
    metrics.totalQuestions > 0
      ? Math.round((metrics.solvedQuestions / metrics.totalQuestions) * 100)
      : 0;
  document.getElementById("statQuestionsPct").textContent =
    `${qPct}% practice questions green-ticked`;

  document.getElementById("statTotalRevisions").textContent =
    `${metrics.totalRevisions} Times`;

  // Subject Breakdown on Dashboard
  const subjListEl = document.getElementById("dashSubjectList");
  if (appState.data.subjects.length === 0) {
    subjListEl.innerHTML = `<div class="text-center py-8 text-slate-400 text-sm">No subjects added yet. Click "Open Subject Tracker" to add your first subject.</div>`;
  } else {
    subjListEl.innerHTML = appState.data.subjects
      .map((subj) => {
        const st = calculateSubjectStats(subj);
        return `
                <div onclick="selectSubject('${subj.id}')" class="cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-darkBorder hover:border-neonPurple/40 transition">
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
                            <span class="text-sm font-extrabold text-neonPurple">${st.pct}%</span>
                            <span class="block text-[10px] text-slate-400">${100 - st.pct}% left</span>
                        </div>
                    </div>
                    <div class="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-neonPurple to-neonCyan transition-all duration-300" style="width: ${st.pct}%"></div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // Weak Areas Preview on Dashboard
  const weakListEl = document.getElementById("dashWeakList");
  if (appState.data.weakAreas.length === 0) {
    weakListEl.innerHTML = `<div class="text-center py-4 text-xs text-slate-400">No weak areas flagged yet.</div>`;
  } else {
    weakListEl.innerHTML = appState.data.weakAreas
      .slice(0, 3)
      .map(
        (w) => `
            <div class="p-3 rounded-xl bg-electricYellow/5 border border-electricYellow/25">
                <div class="flex justify-between items-start text-xs">
                    <div>
                        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-electricYellow/20 text-electricYellow">${escapeHtml(w.subjectName)}</span>
                        <h5 class="font-bold text-slate-800 dark:text-slate-200 mt-1">${escapeHtml(w.topicName)}</h5>
                    </div>
                    <span class="font-bold text-electricYellow">${w.progress}% Done</span>
                </div>
                <div class="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-2">
                    <div class="h-full bg-electricYellow" style="width: ${w.progress}%"></div>
                </div>
            </div>
        `,
      )
      .join("");
  }

  // Daily To-Do Preview on Dashboard
  const todoPreviewEl = document.getElementById("dashTodoPreview");
  if (appState.data.todos.length === 0) {
    todoPreviewEl.innerHTML = `<div class="text-center py-4 text-xs text-slate-400">No tasks scheduled for today.</div>`;
  } else {
    todoPreviewEl.innerHTML = appState.data.todos
      .slice(0, 4)
      .map(
        (td) => `
            <div onclick="toggleTodoComplete('${td.id}')" class="cursor-pointer flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/90 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-darkBorder text-xs transition">
                <div class="flex items-center gap-2.5 truncate pr-2">
                    <span class="w-5 h-5 rounded-md flex items-center justify-center ${td.completed ? "bg-neonPurple text-black" : "border border-slate-500"}">
                        ${td.completed ? '<i class="fa-solid fa-check text-[10px]"></i>' : ""}
                    </span>
                    <span class="truncate ${td.completed ? "strikethrough-animated text-slate-400" : "text-slate-800 dark:text-slate-200 font-medium"}">${escapeHtml(td.text)}</span>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 text-neonCyan">${escapeHtml(td.tag || "Task")}</span>
            </div>
        `,
      )
      .join("");
  }
}

function renderTodoSection() {
  const todos = appState.data.todos || [];
  const completedCount = todos.filter((t) => t.completed).length;
  const pct =
    todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;
  document.getElementById("todoHeaderProgressText").textContent =
    `${pct}% Completed (${completedCount}/${todos.length})`;

  let filtered = todos;
  if (appState.todoFilter === "pending")
    filtered = todos.filter((t) => !t.completed);
  if (appState.todoFilter === "completed")
    filtered = todos.filter((t) => t.completed);

  const container = document.getElementById("todoListContainer");
  if (filtered.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12 bg-slate-50 dark:bg-neutral-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-darkBorder">
                <i class="fa-solid fa-clipboard-check text-3xl text-slate-400 mb-2"></i>
                <p class="text-sm text-slate-500 dark:text-slate-400">No tasks found in this filter. Add a new daily task above!</p>
            </div>
        `;
    return;
  }

  container.innerHTML = filtered
    .map(
      (todo) => `
        <div class="flex items-center justify-between gap-3 p-4 rounded-2xl border transition ${
          todo.completed
            ? "bg-neonPurple/5 border-neonPurple/30"
            : "bg-slate-50 dark:bg-neutral-900/90 border-slate-200 dark:border-darkBorder hover:border-neonPurple/50"
        }">
            <div class="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer" onclick="toggleTodoComplete('${todo.id}')">
                <button type="button" class="w-7 h-7 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                  todo.completed
                    ? "bg-neonPurple text-black neon-glow-green"
                    : "bg-white dark:bg-black border-2 border-slate-300 dark:border-neutral-700 hover:border-neonPurple"
                }">
                    ${todo.completed ? '<i class="fa-solid fa-check text-sm font-bold"></i>' : ""}
                </button>
                <div class="min-w-0 flex-1">
                    <p class="text-sm sm:text-base font-medium break-words transition ${
                      todo.completed
                        ? "strikethrough-animated text-slate-400 dark:text-slate-500"
                        : "text-slate-900 dark:text-slate-100"
                    }">
                        ${escapeHtml(todo.text)}
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
                <span class="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                  todo.completed
                    ? "bg-neonPurple/20 text-neonPurple"
                    : "bg-slate-200 dark:bg-neutral-800 text-neonCyan"
                }">
                    ${todo.completed ? "✓ Completed" : escapeHtml(todo.tag || "Daily")}
                </span>
                <button onclick="deleteTodoItem('${todo.id}')" class="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-electricYellow text-slate-400 hover:text-black transition flex items-center justify-center" title="Delete Task">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function renderSubjectsSection() {
  const grid = document.getElementById("subjectsGridContainer");
  const workspace = document.getElementById("activeSubjectWorkspace");
  const subjects = appState.data.subjects || [];

  if (subjects.length === 0) {
    grid.innerHTML = `
            <div class="col-span-full text-center py-10 bg-slate-50 dark:bg-neutral-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-darkBorder">
                <p class="text-sm text-slate-500">No subjects added yet. Enter a subject like "Calculus for Engineers" above and click Add Subject!</p>
            </div>
        `;
    workspace.innerHTML = `<p class="text-center text-sm text-slate-400">Select or add a subject above to view its Units, Chapters, and Questions.</p>`;
    return;
  }

  // Render Subject Cards Grid
  grid.innerHTML = subjects
    .map((subj, idx) => {
      const st = calculateSubjectStats(subj);
      const isSelected = subj.id === appState.selectedSubjectId;
      return `
            <div onclick="selectSubject('${subj.id}')" class="cursor-pointer p-5 rounded-2xl border-2 transition relative ${
              isSelected
                ? "border-neonPurple bg-neonPurple/10 neon-glow-purple"
                : "border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-neutral-900/80 hover:border-neonPurple/40"
            }">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neonPurple/20 text-neonPurple">Subject ${idx + 1}</span>
                        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5">${escapeHtml(subj.name)}</h3>
                    </div>
                    <button onclick="event.stopPropagation(); deleteSubject('${subj.id}')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-electricYellow hover:bg-electricYellow/10 flex items-center justify-center transition" title="Delete Subject">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>

                <div class="grid grid-cols-3 gap-2 my-4 text-center">
                    <div class="p-2 rounded-xl bg-white/70 dark:bg-black/60 border border-transparent dark:border-darkBorder">
                        <p class="text-xs font-bold text-slate-800 dark:text-slate-200">${st.totalUnits}</p>
                        <p class="text-[10px] text-slate-400">Units</p>
                    </div>
                    <div class="p-2 rounded-xl bg-white/70 dark:bg-black/60 border border-transparent dark:border-darkBorder">
                        <p class="text-xs font-bold text-neonCyan">${st.solvedQuestions}/${st.totalQuestions}</p>
                        <p class="text-[10px] text-slate-400">Questions</p>
                    </div>
                    <div class="p-2 rounded-xl bg-white/70 dark:bg-black/60 border border-transparent dark:border-darkBorder">
                        <p class="text-xs font-bold text-electricYellow">🔄 ${st.totalRevisions}</p>
                        <p class="text-[10px] text-slate-400">Revisions</p>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="text-slate-500 dark:text-slate-400">Completion</span>
                        <span class="text-neonPurple">${st.pct}% Complete</span>
                    </div>
                    <div class="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-neonPurple to-neonCyan transition-all duration-300" style="width: ${st.pct}%"></div>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");

  // Render Active Subject Window
  const activeSubj =
    subjects.find((s) => s.id === appState.selectedSubjectId) || subjects[0];
  const subjStats = calculateSubjectStats(activeSubj);
  const activeUnit =
    (activeSubj.units || []).find((u) => u.id === appState.selectedUnitId) ||
    (activeSubj.units || [])[0] ||
    null;

  workspace.innerHTML = `
        <!-- Subject Window Header -->
               <!-- Subject Window Header -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-darkBorder">
            <div>
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-1 rounded-lg bg-neonPurple text-black text-xs font-bold">ACTIVE SUBJECT WINDOW</span>
                    <span class="text-xs text-slate-500 dark:text-slate-400">Overall: <strong class="text-neonCyan">${subjStats.pct}% Completed</strong> • 🔄 ${subjStats.totalRevisions} Total Revisions</span>
                </div>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">${escapeHtml(activeSubj.name)}</h2>
            </div>

            <!-- Add Unit Form -->
            <form onsubmit="handleAddUnit(event, '${activeSubj.id}')" class="flex gap-2">
                <input type="text" id="newUnitNameInput" required placeholder="Add new unit (e.g., Unit 2)" class="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonCyan">
                <button type="submit" class="px-4 py-2.5 rounded-xl bg-neonCyan hover:opacity-90 text-black font-bold text-xs sm:text-sm transition flex items-center gap-1.5 whitespace-nowrap shadow-md">
                    <i class="fa-solid fa-plus"></i>
                    <span>Add Unit</span>
                </button>
            </form>
        </div>

        <!-- Units Tabs Bar -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2">
            ${(activeSubj.units || [])
              .map((u) => {
                const uStats = calculateUnitStats(u);
                const isUnitActive = activeUnit && u.id === activeUnit.id;
                return `
                    <div class="flex items-center rounded-xl transition ${
                      isUnitActive
                        ? "bg-neonPurple text-black font-bold shadow-md"
                        : "bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 border border-transparent dark:border-darkBorder hover:border-neonPurple/40"
                    }">
                        <button onclick="selectUnitTab('${u.id}')" class="px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-folder-open"></i>
                            <span>${escapeHtml(u.name)}</span>
                            <span class="px-1.5 py-0.5 rounded text-[10px] ${isUnitActive ? "bg-black/20 text-black" : "bg-slate-200 dark:bg-neutral-800 text-neonCyan"}">${uStats.pct}%</span>
                        </button>
                        <button onclick="deleteUnit('${activeSubj.id}', '${u.id}')" class="pr-3 pl-1 py-2.5 text-xs opacity-70 hover:opacity-100" title="Delete Unit">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                `;
              })
              .join("")}
        </div>

        <!-- Active Unit Chapters/Topics Workspace -->
        ${
          !activeUnit
            ? `
            <div class="text-center py-10 bg-slate-50 dark:bg-neutral-900/40 rounded-2xl">
                <p class="text-sm text-slate-400">No units in this subject yet. Use "Add Unit" above to create Unit 1!</p>
            </div>
        `
            : `
            <div class="space-y-6">
                <!-- Add Chapter/Topic Form (VERTICAL: input ऊपर, button नीचे) -->
                                <!-- Add Chapter/Topic Form -->
                <div class="bg-slate-50 dark:bg-neutral-900/90 p-4 rounded-2xl border border-slate-200 dark:border-darkBorder flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div>
                        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <i class="fa-solid fa-bookmark text-neonCyan"></i>
                            <span>${escapeHtml(activeUnit.name)} — Chapters & Topics</span>
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Add chapters/topics below, list practice questions inside each topic, and increment revisions (+1)</p>
                    </div>
                    <form onsubmit="handleAddTopic(event, '${activeSubj.id}', '${activeUnit.id}')" class="flex gap-2 min-w-[280px] sm:min-w-[360px]">
                        <input type="text" id="newTopicNameInput" required placeholder="Add new chapter or topic..." class="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonPurple">
                        <button type="submit" class="px-4 py-2 rounded-xl bg-neonPurple hover:opacity-90 text-black font-bold text-xs sm:text-sm transition whitespace-nowrap">
                            + Add Topic
                        </button>
                    </form>
                </div>
                <!-- Topics List -->
                <div class="space-y-4">
                    ${
                      (activeUnit.topics || []).length === 0
                        ? `
                        <div class="text-center py-10 border border-dashed border-slate-300 dark:border-darkBorder rounded-2xl text-sm text-slate-400">
                            No chapters/topics added to this unit yet. Add your first topic above!
                        </div>
                    `
                        : (activeUnit.topics || [])
                            .map((topic, tIdx) => {
                              const tStats = calculateTopicStats(topic);
                              const isCollapsed =
                                !!appState.collapsedTopics[topic.id];
                              return `
                            <div class="rounded-2xl border transition p-5 ${
                              tStats.isDone
                                ? "bg-neonPurple/5 border-neonPurple/30"
                                : "bg-slate-50/70 dark:bg-neutral-900/60 border-slate-200 dark:border-darkBorder"
                            }">
                                <!-- Topic Header Row -->
                                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-darkBorder">
                                    <div class="flex items-start gap-3">
                                        <button onclick="toggleTopicCompleted('${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                                          tStats.isDone
                                            ? "bg-neonPurple text-black neon-glow-green"
                                            : "bg-white dark:bg-black border-2 border-slate-300 dark:border-neutral-700 hover:border-neonPurple"
                                        }" title="Mark Entire Topic Completed">
                                            ${tStats.isDone ? '<i class="fa-solid fa-check text-xs font-bold"></i>' : ""}
                                        </button>
                                        <div>
                                            <div class="flex flex-wrap items-center gap-2">
                                                <span class="text-xs font-bold text-neonPurple">Topic ${tIdx + 1}</span>
                                                <h4 class="text-base sm:text-lg font-bold ${tStats.isDone ? "strikethrough-animated text-slate-400" : "text-slate-900 dark:text-white"}">
                                                    ${escapeHtml(topic.name)}
                                                </h4>
                                                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                  tStats.pct === 100
                                                    ? "bg-neonPurple/20 text-neonPurple"
                                                    : "bg-neonCyan/15 text-neonCyan"
                                                }">${tStats.pct}% Done</span>
                                            </div>
                                            <div class="flex items-center gap-3 mt-1">
                                                <p class="text-xs text-slate-500 dark:text-slate-400">
                                                    Questions Solved: <strong>${tStats.solved} / ${tStats.total}</strong>
                                                </p>
                                                <button onclick="toggleTopicQuestionsCollapse('${topic.id}')" class="text-xs font-semibold text-neonCyan hover:underline flex items-center gap-1">
                                                    <i class="fa-solid ${isCollapsed ? "fa-chevron-down" : "fa-chevron-up"} text-[10px]"></i>
                                                    <span>${isCollapsed ? "Show Questions" : "Hide Questions"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Topic Controls: Revision Counter (+1), Weak Area Toggle, Delete -->
                                    <div class="flex flex-wrap items-center gap-2.5">
                                        <!-- Revision Counter Box -->
                                        <div class="flex items-center gap-1.5 bg-white dark:bg-black px-3 py-1.5 rounded-xl border border-slate-200 dark:border-darkBorder shadow-sm">
                                            <i class="fa-solid fa-rotate text-electricYellow text-xs"></i>
                                            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Revised:</span>
                                            <span class="px-2 py-0.5 rounded-lg bg-electricYellow/20 text-electricYellow font-extrabold text-sm">${topic.revisions || 0}</span>
                                            <button onclick="incrementRevision('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', 1)" class="px-2.5 py-1 rounded-lg bg-neonPurple hover:opacity-90 text-black font-bold text-xs transition shadow" title="Increment Revision Count (+1)">
                                                +1 Revise
                                            </button>
                                            ${
                                              (topic.revisions || 0) > 0
                                                ? `
                                                <button onclick="incrementRevision('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', -1)" class="px-1.5 py-1 rounded-lg bg-slate-200 dark:bg-neutral-800 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs transition" title="Decrease revision count (-1)">
                                                    -1
                                                </button>
                                            `
                                                : ""
                                            }
                                        </div>

                                        <!-- Weak Area Toggle -->
                                        <button onclick="toggleTopicWeakMark('${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                                          topic.isWeak
                                            ? "bg-electricYellow text-black border-electricYellow shadow-md"
                                            : "bg-white dark:bg-black text-slate-600 dark:text-slate-300 border-slate-200 dark:border-darkBorder hover:border-electricYellow"
                                        }">
                                            <i class="fa-solid fa-bolt-lightning"></i>
                                            <span>${topic.isWeak ? "Weak Area (Flagged)" : "Mark as Weak Area"}</span>
                                        </button>

                                        <!-- Delete Topic -->
                                        <button onclick="deleteTopic('${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-electricYellow text-slate-400 hover:text-black flex items-center justify-center transition" title="Delete Topic">
                                            <i class="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                </div>

                                <!-- Expandable/Collapsible Questions List inside Topic -->
                                <div class="${isCollapsed ? "hidden" : "mt-4 space-y-2"}">
                                    ${(topic.questions || [])
                                      .map(
                                        (q) => `
                                        <div class="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition ${
                                          q.completed
                                            ? "bg-neonPurple/10 border border-neonPurple/30"
                                            : "bg-white dark:bg-black/80 border border-slate-200/80 dark:border-darkBorder"
                                        }">
                                            <div onclick="toggleQuestionSolved('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', '${q.id}')" class="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                                                <span class="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                                                  q.completed
                                                    ? "bg-neonPurple text-black neon-glow-green"
                                                    : "border-2 border-slate-300 dark:border-neutral-700 hover:border-neonPurple"
                                                }">
                                                    ${q.completed ? '<i class="fa-solid fa-check text-[10px] font-bold"></i>' : ""}
                                                </span>
                                                <span class="text-xs sm:text-sm break-words ${
                                                  q.completed
                                                    ? "strikethrough-animated text-slate-400"
                                                    : "text-slate-800 dark:text-slate-200 font-medium"
                                                }">${escapeHtml(q.text)}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                ${q.completed ? '<span class="text-[10px] font-bold text-neonPurple">✓ Solved</span>' : ""}
                                                <button onclick="deleteQuestion('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', '${q.id}')" class="text-slate-400 hover:text-electricYellow p-1 transition" title="Delete Question">
                                                    <i class="fa-solid fa-xmark text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `,
                                      )
                                      .join("")}

                                    <!-- Add Question Input inside Topic -->
                                    <form onsubmit="handleAddQuestion(event, '${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="flex gap-2 pt-2">
                                        <input type="text" id="qInput_${topic.id}" required placeholder="Add practice question to this topic (e.g., Q1: Leibnitz Theorem Proof or Exercise 1.2 Q5)..." class="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-darkBorder text-xs sm:text-sm focus:outline-none focus:border-neonPurple">
                                        <button type="submit" class="px-3.5 py-2 rounded-xl bg-neonCyan hover:opacity-90 text-black text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5">
                                            <i class="fa-solid fa-plus"></i>
                                            <span>Add Question</span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        `;
                            })
                            .join("")
                    }
                </div>
            </div>
        `
        }
    `;
}

function renderWeakSection(metrics) {
  document.getElementById("weakSectionOverallPct").textContent =
    `${metrics.weakPct}%`;
  document.getElementById("weakSectionOverallBar").style.width =
    `${metrics.weakPct}%`;

  const selectEl = document.getElementById("weakSubjectSelect");
  const subjects = appState.data.subjects || [];
  selectEl.innerHTML =
    subjects
      .map(
        (s) =>
          `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`,
      )
      .join("") + `<option value="General">Other / General</option>`;

  const listEl = document.getElementById("weakAreasListContainer");
  const weakAreas = appState.data.weakAreas || [];

  if (weakAreas.length === 0) {
    listEl.innerHTML = `
            <div class="col-span-full text-center py-12 bg-slate-50 dark:bg-neutral-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-darkBorder">
                <i class="fa-solid fa-shield-heart text-3xl text-neonPurple mb-2"></i>
                <p class="text-sm text-slate-500 dark:text-slate-400">No weak areas listed right now! Add one above or click "Mark as Weak Area" on any topic inside your subjects.</p>
            </div>
        `;
    return;
  }

  listEl.innerHTML = weakAreas
    .map(
      (w) => `
        <div class="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-darkBorder flex flex-col justify-between gap-4">
            <div>
                <div class="flex items-start justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-electricYellow/20 text-electricYellow border border-electricYellow/30">
                        ${escapeHtml(w.subjectName)}
                    </span>
                    <button onclick="deleteWeakArea('${w.id}')" class="text-slate-400 hover:text-electricYellow transition" title="Remove Weak Area">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2 ${w.progress === 100 ? "strikethrough-animated text-neonPurple" : ""}">
                    ${escapeHtml(w.topicName)}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <i class="fa-solid fa-bullseye text-neonCyan mr-1"></i> ${escapeHtml(w.actionPlan)}
                </p>
            </div>

            <div class="space-y-2 pt-3 border-t border-slate-200 dark:border-darkBorder">
                <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-slate-500 dark:text-slate-400">Improvement Progress:</span>
                    <span class="${w.progress === 100 ? "text-neonPurple" : "text-electricYellow"} text-sm">${w.progress}%</span>
                </div>

                <input type="range" min="0" max="100" step="5" value="${w.progress}"
                    onchange="updateWeakProgress('${w.id}', this.value)"
                    class="w-full accent-neonPurple cursor-pointer h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg">

                <div class="flex items-center justify-between gap-1 pt-1">
                    <button onclick="updateWeakProgress('${w.id}', ${Math.min(100, (Number(w.progress) || 0) + 25)})" class="px-2.5 py-1 rounded-lg bg-electricYellow/15 hover:bg-electricYellow/30 text-electricYellow text-xs font-bold transition">
                        +25% Progress
                    </button>
                    <button onclick="updateWeakProgress('${w.id}', 100)" class="px-3 py-1 rounded-lg bg-neonPurple hover:opacity-90 text-black text-xs font-bold transition flex items-center gap-1">
                        <i class="fa-solid fa-check"></i> Mark Mastered (100%)
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==================== WEEKLY PLANNER HANDLERS & RENDERER ====================
function getCurrentWeekRangeText() {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(new Date().setDate(diffToMon));
  const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
  const opts = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} – ${sunday.toLocaleDateString("en-US", opts)}`;
}

function formatTargetDateBadge(dateStr, isCompleted) {
  if (!dateStr)
    return { label: "No Date", badgeClass: "bg-neutral-800 text-slate-300" };
  const todayStr = new Date().toISOString().split("T")[0];
  const d = new Date(dateStr + "T00:00:00");
  const formatted = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (isCompleted) {
    return {
      label: `📅 ${formatted}`,
      badgeClass: "bg-neonPurple/15 text-neonPurple",
    };
  }
  if (dateStr === todayStr) {
    return {
      label: `🔥 Today (${formatted})`,
      badgeClass: "bg-neonCyan/20 text-neonCyan border border-neonCyan/40",
    };
  }
  if (dateStr < todayStr) {
    return {
      label: `⚠️ Overdue (${formatted})`,
      badgeClass:
        "bg-electricYellow/20 text-electricYellow border border-electricYellow/40",
    };
  }
  return {
    label: `📅 Target: ${formatted}`,
    badgeClass: "bg-neutral-800 text-slate-300 border border-darkBorder",
  };
}

window.handleAddWeeklyTask = async function (e) {
  e.preventDefault();
  const textInput = document.getElementById("weeklyTaskInput");
  const dateInput = document.getElementById("weeklyDateInput");
  const tagInput = document.getElementById("weeklyTagInput");

  const text = textInput.value.trim();
  const targetDate = dateInput.value || new Date().toISOString().split("T")[0];
  const tag = tagInput.value || "🎯 Core Target";
  if (!text) return;

  if (!Array.isArray(appState.data.weeklyTasks)) {
    appState.data.weeklyTasks = [];
  }

  appState.data.weeklyTasks.push({
    id: "wkt_" + Date.now(),
    text,
    targetDate,
    tag,
    completed: false,
    createdAt: Date.now(),
  });

  // Sort by targetDate ascending
  appState.data.weeklyTasks.sort((a, b) =>
    a.targetDate > b.targetDate ? 1 : -1,
  );

  textInput.value = "";
  showToast("Weekly target scheduled!", "success");
  await saveWorkspaceToCloud();
};

window.toggleWeeklyTaskComplete = async function (taskId) {
  const item = (appState.data.weeklyTasks || []).find((t) => t.id === taskId);
  if (!item) return;
  item.completed = !item.completed;
  if (item.completed) {
    showToast("Weekly target achieved! Marked with green tick.", "success");
  }
  await saveWorkspaceToCloud();
};

window.deleteWeeklyTask = async function (taskId) {
  appState.data.weeklyTasks = (appState.data.weeklyTasks || []).filter(
    (t) => t.id !== taskId,
  );
  showToast("Weekly target removed.", "info");
  await saveWorkspaceToCloud();
};

window.setWeeklyFilter = function (filter) {
  appState.weeklyFilter = filter;
  ["all", "pending", "completed"].forEach((f) => {
    const btn = document.getElementById("weeklyFilter-" + f);
    if (!btn) return;
    if (f === filter) {
      btn.className =
        "px-3 py-1.5 rounded-lg text-xs font-bold bg-neonPurple text-black transition";
    } else {
      btn.className =
        "px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-300 transition";
    }
  });
  renderWeeklySection();
};

window.clearCompletedWeeklyTasks = async function () {
  const list = appState.data.weeklyTasks || [];
  const count = list.filter((t) => t.completed).length;
  if (count === 0) {
    showToast("No completed weekly targets to clear.", "warning");
    return;
  }
  appState.data.weeklyTasks = list.filter((t) => !t.completed);
  showToast(`Cleared ${count} completed weekly target(s).`, "info");
  await saveWorkspaceToCloud();
};

function renderWeeklySection() {
  const rangeBadge = document.getElementById("weeklyDateRangeBadge");
  if (rangeBadge)
    rangeBadge.textContent = `🗓️ Week: ${getCurrentWeekRangeText()}`;

  const dateInput = document.getElementById("weeklyDateInput");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  const tasks = appState.data.weeklyTasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const pct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const pctEl = document.getElementById("weeklyHeaderPct");
  const barEl = document.getElementById("weeklyHeaderBar");
  const subEl = document.getElementById("weeklyHeaderSub");
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (barEl) barEl.style.width = `${pct}%`;
  if (subEl)
    subEl.textContent = `${completedCount} / ${tasks.length} weekly targets completed`;

  let filtered = tasks;
  if (appState.weeklyFilter === "pending")
    filtered = tasks.filter((t) => !t.completed);
  if (appState.weeklyFilter === "completed")
    filtered = tasks.filter((t) => t.completed);

  const container = document.getElementById("weeklyListContainer");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-slate-50 dark:bg-neutral-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-darkBorder">
        <i class="fa-solid fa-calendar-plus text-3xl text-neonCyan mb-2"></i>
        <p class="text-sm text-slate-500 dark:text-slate-400">No weekly targets in this view. Schedule your goals with a target date above!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((item) => {
      const dateBadge = formatTargetDateBadge(item.targetDate, item.completed);
      return `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition ${
          item.completed
            ? "bg-neonPurple/5 border-neonPurple/30"
            : "bg-slate-50 dark:bg-neutral-900/90 border-slate-200 dark:border-darkBorder hover:border-neonPurple/50"
        }">
          <div class="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 cursor-pointer" onclick="toggleWeeklyTaskComplete('${item.id}')">
            <button type="button" class="mt-0.5 sm:mt-0 w-7 h-7 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
              item.completed
                ? "bg-neonPurple text-black neon-glow-green"
                : "bg-white dark:bg-black border-2 border-slate-300 dark:border-neutral-700 hover:border-neonPurple"
            }">
              ${item.completed ? '<i class="fa-solid fa-check text-sm font-bold"></i>' : ""}
            </button>
            <div class="min-w-0 flex-1">
              <p class="text-sm sm:text-base font-medium break-words transition ${
                item.completed
                  ? "strikethrough-animated text-slate-400 dark:text-slate-500"
                  : "text-slate-900 dark:text-slate-100"
              }">
                ${escapeHtml(item.text)}
              </p>
              <div class="flex flex-wrap items-center gap-2 mt-1.5">
                <span class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${dateBadge.badgeClass}">
                  ${dateBadge.label}
                </span>
                <span class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 dark:bg-neutral-800 text-neonCyan">
                  ${escapeHtml(item.tag)}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 flex-shrink-0">
            ${item.completed ? '<span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-neonPurple/20 text-neonPurple">✓ Achieved</span>' : ""}
            <button onclick="deleteWeeklyTask('${item.id}')" class="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-electricYellow text-slate-400 hover:text-black transition flex items-center justify-center" title="Delete Target">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}
// ==================== FEATURE 5: MY RESOURCES VAULT ENGINE (CLOUD SYNC + CATEGORY SELECTOR) ====================
const IDB_NAME = "RecursyResourcesVaultDB";
const IDB_STORE = "files_store";

function openVaultDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveFileToVaultDB(id, fileBlob) {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const userId = appState.user?.userId || "guest";
    tx.objectStore(IDB_STORE).put({ id: `${userId}_${id}`, blob: fileBlob });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function getFileFromVaultDB(id) {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const userId = appState.user?.userId || "guest";
    const req = tx.objectStore(IDB_STORE).get(`${userId}_${id}`);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFileFromVaultDB(id) {
  const db = await openVaultDB();
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const userId = appState.user?.userId || "guest";
    tx.objectStore(IDB_STORE).delete(`${userId}_${id}`);
    tx.oncomplete = () => resolve(true);
  });
}

// Helper: Convert File to Base64 DataURL so it syncs to MongoDB Cloud across all devices
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Strict File Type Validators
function validateResourceFile(file, type) {
  if (!file) return { valid: false, error: "Please select a file to upload!" };
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();

  if (type === "image") {
    const isImg =
      mime.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(name);
    if (!isImg)
      return {
        valid: false,
        error:
          "Strict Filter: Only Image files (.jpg, .png, .webp, etc.) are allowed in Image Resources!",
      };
    const MAX_IMG = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_IMG) {
      return {
        valid: false,
        error: `Image exceeds 2 MB limit! Selected file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
      };
    }
  } else if (type === "video") {
    const isVid =
      mime.startsWith("video/") || /\.(mp4|mkv|webm|mov|avi|m4v)$/.test(name);
    if (!isVid)
      return {
        valid: false,
        error:
          "Strict Filter: Only Video files (.mp4, .mkv, .webm, .mov) are allowed in Video Resources!",
      };
    const usedVideoBytes = (appState.data.resources || [])
      .filter((r) => r.type === "video")
      .reduce((sum, r) => sum + (Number(r.sizeBytes) || 0), 0);
    const MAX_VID_TOTAL = 500 * 1024 * 1024; // 500 MB Total
    if (usedVideoBytes + file.size > MAX_VID_TOTAL) {
      const leftMB = Math.max(
        0,
        (MAX_VID_TOTAL - usedVideoBytes) / (1024 * 1024),
      ).toFixed(1);
      return {
        valid: false,
        error: `Video Storage Limit (500 MB) Reached! You only have ${leftMB} MB remaining.`,
      };
    }
  } else if (type === "document") {
    const isDoc =
      mime === "application/pdf" ||
      mime.includes("word") ||
      mime.includes("presentation") ||
      mime.includes("spreadsheet") ||
      mime.startsWith("text/") ||
      /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv|md)$/.test(name);
    if (!isDoc) {
      return {
        valid: false,
        error:
          "Strict Filter: Only Document files (.pdf, .doc, .ppt, .txt, .xls) are allowed in Document Resources!",
      };
    }
    const MAX_DOC = 10 * 1024 * 1024; // 10 MB per doc for smooth cloud sync
    if (file.size > MAX_DOC) {
      return {
        valid: false,
        error: `Document exceeds 10 MB cloud sync limit! Selected file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
      };
    }
  }
  return { valid: true };
}

window.switchResourceType = function (type) {
  appState.activeResourceType = type;
  appState.activeResourceCategory = "ALL";
  renderResourcesSection();
};

window.selectResourceCategory = function (cat) {
  appState.activeResourceCategory = cat;
  renderResourcesSection();
};

// Toggle between selecting an existing category or typing a new one
window.handleCategoryDropdownChange = function (selectEl) {
  const customInput = document.getElementById("resCategoryCustomInput");
  if (!customInput) return;
  if (selectEl.value === "__NEW__") {
    customInput.classList.remove("hidden");
    customInput.required = true;
    customInput.focus();
  } else {
    customInput.classList.add("hidden");
    customInput.required = false;
  }
};

window.handleAddResource = async function (e) {
  e.preventDefault();
  if (!appState.token) {
    showToast("Authentication required! Please log in first.", "error");
    return;
  }

  const type = appState.activeResourceType;
  const selectEl = document.getElementById("resCategorySelect");
  const customInput = document.getElementById("resCategoryCustomInput");
  const tagInput = document.getElementById("resTagInput");

  let category = "";
  if (selectEl && selectEl.value !== "__NEW__") {
    category = selectEl.value.trim();
  } else if (customInput) {
    category = customInput.value.trim();
  }
  if (!category) category = "General";

  const tag = (tagInput.value || "").trim();
  if (!tag) return;

  if (!Array.isArray(appState.data.resources)) appState.data.resources = [];
  const newId = "res_" + Date.now();

  if (type === "link") {
    const urlInput = document.getElementById("resUrlInput");
    let rawUrl = (urlInput.value || "").trim();
    if (!rawUrl) return;
    if (!/^https?:\/\//i.test(rawUrl)) rawUrl = "https://" + rawUrl;

    appState.data.resources.unshift({
      id: newId,
      type: "link",
      category,
      tag,
      url: rawUrl,
      fileName: "",
      mimeType: "text/uri-list",
      sizeBytes: 0,
      fileData: "",
      createdAt: Date.now(),
    });
    showToast(`Link "${tag}" saved in "${category}"!`, "success");
    appState.activeResourceCategory = category;
    await saveWorkspaceToCloud();
  } else {
    const fileInput = document.getElementById("resFileInput");
    const file = fileInput?.files?.[0];
    const check = validateResourceFile(file, type);
    if (!check.valid) {
      showToast(check.error, "error");
      return;
    }

    // Submit button ko loading state mein badlein aur percentage dikhayein
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading 0%`;
    }

    try {
      // 1. Save in local IndexedDB Vault
      await saveFileToVaultDB(newId, file);

      // 2. Read file with Progress Percentage for Cloud Sync Base64
      const cloudFileData = await new Promise((resolve, reject) => {
        if (file.size > 10 * 1024 * 1024) {
          // Agar file 10MB se badi hai toh base64 skip karein (local vault handle karega)
          resolve("");
          return;
        }
        const reader = new FileReader();
        reader.onprogress = (event) => {
          if (event.lengthComputable && submitBtn) {
            const percent = Math.round((event.loaded / event.total) * 100);
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading ${percent}%`;
          }
        };
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      appState.data.resources.unshift({
        id: newId,
        type,
        category,
        tag,
        url: "",
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        fileData: cloudFileData,
        createdAt: Date.now(),
      });

      showToast(
        `${type.toUpperCase()} "${tag}" uploaded successfully!`,
        "success",
      );
      appState.activeResourceCategory = category;
      await saveWorkspaceToCloud();
    } catch (err) {
      console.error(err);
      showToast("Failed to process file for upload.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    }
  }
};

window.openResourceItem = async function (resId) {
  const item = (appState.data.resources || []).find((r) => r.id === resId);
  if (!item) return;

  if (item.type === "link") {
    window.open(item.url, "_blank", "noopener,noreferrer");
    return;
  }

  // First check Cloud-Synced Base64 Data (works on ALL devices: mobile, laptop, tablet)
  let previewUrl = item.fileData || "";

  // Fallback to local IndexedDB Vault if it's a huge video (>10MB)
  if (!previewUrl) {
    const blob = await getFileFromVaultDB(item.id);
    if (blob) {
      previewUrl = URL.createObjectURL(blob);
    }
  }

  if (!previewUrl) {
    showToast(
      "Large video (>10MB) is stored in local device vault, or re-upload to sync.",
      "warning",
    );
    return;
  }

  const modal = document.getElementById("resourcePreviewModal");
  const body = document.getElementById("previewModalBody");
  document.getElementById("previewModalCategory").textContent =
    `${item.type.toUpperCase()} • ${item.category}`;
  document.getElementById("previewModalTitle").textContent =
    `${item.tag} (${item.fileName})`;

  if (item.type === "image") {
    body.innerHTML = `
      <div class="space-y-3 text-center">
        <img src="${previewUrl}" alt="${escapeHtml(item.tag)}" class="max-h-[60vh] mx-auto rounded-xl object-contain" />
        <a href="${previewUrl}" download="${escapeHtml(item.fileName || "image.png")}" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neonPurple text-black font-bold text-xs">
          <i class="fa-solid fa-download"></i> Download Image
        </a>
      </div>`;
  } else if (item.type === "video") {
    body.innerHTML = `<video src="${previewUrl}" controls autoplay class="max-h-[65vh] w-full rounded-xl bg-black"></video>`;
  } else {
    body.innerHTML = `
      <div class="w-full space-y-3 text-center py-4">
        <iframe src="${previewUrl}" class="w-full h-[55vh] rounded-xl border border-darkBorder bg-white"></iframe>
        <a href="${previewUrl}" download="${escapeHtml(item.fileName || "document.pdf")}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neonPurple text-black font-bold text-xs">
          <i class="fa-solid fa-download"></i> Download ${escapeHtml(item.fileName)}
        </a>
      </div>
    `;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.closeResourcePreview = function () {
  const modal = document.getElementById("resourcePreviewModal");
  const body = document.getElementById("previewModalBody");
  body.innerHTML = "";
  modal.classList.add("hidden");
  modal.classList.remove("flex");
};

window.deleteResourceItem = function (resId) {
  const item = (appState.data.resources || []).find((r) => r.id === resId);
  if (!item) return;
  askConfirmation(
    "Delete Resource?",
    `Remove "${item.tag}" from ${item.category}?`,
    async () => {
      if (item.type !== "link") await deleteFileFromVaultDB(resId);
      appState.data.resources = (appState.data.resources || []).filter(
        (r) => r.id !== resId,
      );
      showToast("Resource deleted from Cloud.", "info");
      await saveWorkspaceToCloud();
    },
  );
};

function formatBytesMB(bytes) {
  if (!bytes) return "0 KB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) return `${mb.toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function renderResourcesSection() {
  const workspace = document.getElementById("resourcesActiveWorkspace");
  if (!workspace) return;

  const allRes = appState.data.resources || [];
  const activeType = appState.activeResourceType || "link";

  const counts = {
    link: allRes.filter((r) => r.type === "link").length,
    image: allRes.filter((r) => r.type === "image").length,
    video: allRes.filter((r) => r.type === "video").length,
    document: allRes.filter((r) => r.type === "document").length,
  };

  document.getElementById("resCount-link").textContent = `${counts.link} Links`;
  document.getElementById("resCount-image").textContent =
    `${counts.image} Images (Max 2MB)`;
  document.getElementById("resCount-video").textContent =
    `${counts.video} Videos (Max 500MB)`;
  document.getElementById("resCount-document").textContent =
    `${counts.document} Docs`;

  const usedVideoBytes = allRes
    .filter((r) => r.type === "video")
    .reduce((acc, r) => acc + (Number(r.sizeBytes) || 0), 0);
  const usedVideoMB = (usedVideoBytes / (1024 * 1024)).toFixed(1);
  const videoPct = Math.min(
    100,
    Math.round((usedVideoBytes / (500 * 1024 * 1024)) * 100),
  );

  document.getElementById("videoStorageText").textContent =
    `${usedVideoMB} MB / 500 MB (${videoPct}%)`;
  document.getElementById("videoStorageBar").style.width = `${videoPct}%`;

  ["link", "image", "video", "document"].forEach((t) => {
    const btn = document.getElementById("resTab-" + t);
    if (!btn) return;
    if (t === activeType) {
      btn.className =
        "p-4 rounded-2xl border-2 text-left transition flex items-center gap-3 border-neonPurple bg-neonPurple/10 neon-glow-purple";
    } else {
      btn.className =
        "p-4 rounded-2xl border-2 text-left transition flex items-center gap-3 border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-neutral-900/60 hover:border-neonPurple/40";
    }
  });

  const typeItems = allRes.filter((r) => r.type === activeType);
  // Collect all unique categories created so far in this resource type
  const categories = [...new Set(typeItems.map((r) => r.category))];
  if (
    appState.activeResourceCategory !== "ALL" &&
    !categories.includes(appState.activeResourceCategory)
  ) {
    appState.activeResourceCategory = "ALL";
  }

  const defaultSelectedCat =
    appState.activeResourceCategory !== "ALL"
      ? appState.activeResourceCategory
      : categories[0] || "__NEW__";

  const showNewCatInputByDefault =
    categories.length === 0 || defaultSelectedCat === "__NEW__";

  const filteredItems =
    appState.activeResourceCategory === "ALL"
      ? typeItems
      : typeItems.filter((r) => r.category === appState.activeResourceCategory);

  const acceptAttr =
    activeType === "image"
      ? "image/*"
      : activeType === "video"
        ? "video/*"
        : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.md";

  const typeLabels = {
    link: {
      title: "Link Resources",
      hint: "Select an existing category or create a new one, enter Tag, and paste Link",
      icon: "fa-link",
    },
    image: {
      title: "Image Resources (Strictly Images • Max 2 MB • Cloud Synced)",
      hint: "Upload whiteboard photos, handwritten notes, diagrams",
      icon: "fa-image",
    },
    video: {
      title: "Video Resources (Strictly Videos • Max 500 MB Vault)",
      hint: "Upload lecture clips or recorded explanations",
      icon: "fa-film",
    },
    document: {
      title: "Document Resources (Strictly PDF / DOC / PPT • Cloud Synced)",
      hint: "Upload syllabus PDFs, assignments, or cheatsheets",
      icon: "fa-file-pdf",
    },
  }[activeType];

  workspace.innerHTML = `
    <!-- Add Resource Form with Smart Category Dropdown -->
    <form onsubmit="handleAddResource(event)" class="bg-slate-50 dark:bg-neutral-900/80 p-5 rounded-2xl border border-slate-200 dark:border-darkBorder space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <i class="fa-solid ${typeLabels.icon} text-neonPurple"></i>
          <span>Add to ${typeLabels.title}</span>
        </h3>
        <span class="text-[11px] text-slate-400">${typeLabels.hint}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
        <!-- 1. Smart Category Selector Dropdown + New Category Input -->
        <div class="md:col-span-3 space-y-2">
          <label class="block text-[11px] font-semibold text-slate-400">1. Select or Create Category</label>
          <select
            id="resCategorySelect"
            onchange="handleCategoryDropdownChange(this)"
            class="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonPurple"
          >
            ${categories
              .map(
                (c) =>
                  `<option value="${escapeHtml(c)}" ${c === defaultSelectedCat ? "selected" : ""}>📂 ${escapeHtml(c)}</option>`,
              )
              .join("")}
            <option value="__NEW__" ${showNewCatInputByDefault ? "selected" : ""}>➕ Create New Category...</option>
          </select>

          <input
            type="text"
            id="resCategoryCustomInput"
            ${showNewCatInputByDefault ? "required" : ""}
            placeholder="Type new category (e.g., AI, DSA)"
            class="${showNewCatInputByDefault ? "" : "hidden"} w-full px-3.5 py-2 rounded-xl bg-white dark:bg-black border border-neonCyan/60 text-sm focus:outline-none focus:border-neonCyan"
          />
        </div>

        <!-- 2. Resource Tag / Name -->
        <div class="md:col-span-4">
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">2. Resource Tag / Title (e.g., Love Babbar)</label>
          <input type="text" id="resTagInput" required placeholder="e.g., Love Babbar Supreme Playlist" class="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonCyan" />
        </div>

        <!-- 3. URL or File Input -->
        <div class="md:col-span-3">
          ${
            activeType === "link"
              ? `
              <label class="block text-[11px] font-semibold text-slate-400 mb-1">3. Paste URL / Link</label>
              <input type="url" id="resUrlInput" required placeholder="https://youtube.com/playlist?list=..." class="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonPurple" />
            `
              : `
              <label class="block text-[11px] font-semibold text-slate-400 mb-1">3. Select ${activeType.toUpperCase()} File</label>
              <input type="file" id="resFileInput" accept="${acceptAttr}" required class="w-full px-3 py-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-darkBorder text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-neonPurple file:text-black file:font-bold cursor-pointer" />
            `
          }
        </div>

        <!-- 4. Submit Button -->
        <div class="md:col-span-2 flex items-end">
          <button type="submit" class="w-full py-2.5 px-4 rounded-xl bg-neonPurple hover:opacity-90 text-black font-bold text-sm shadow-lg transition flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <span>Save</span>
          </button>
        </div>
      </div>
    </form>

    <!-- Category Folder Filter Pills (ALL, AI, DSA, Calculus...) -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2">
      <button onclick="selectResourceCategory('ALL')" class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
        appState.activeResourceCategory === "ALL"
          ? "bg-neonPurple text-black shadow-md"
          : "bg-slate-100 dark:bg-neutral-900 text-slate-400 hover:text-white border border-transparent dark:border-darkBorder"
      }">
        <i class="fa-solid fa-layer-group"></i>
        <span>All Categories (${typeItems.length})</span>
      </button>
      ${categories
        .map((cat) => {
          const catCount = typeItems.filter((i) => i.category === cat).length;
          const isActive = appState.activeResourceCategory === cat;
          return `
            <button onclick="selectResourceCategory('${escapeHtml(cat)}')" class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              isActive
                ? "bg-neonCyan text-black shadow-md"
                : "bg-slate-100 dark:bg-neutral-900 text-slate-300 hover:border-neonCyan/50 border border-transparent dark:border-darkBorder"
            }">
              <i class="fa-solid fa-folder"></i>
              <span>${escapeHtml(cat)}</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] ${isActive ? "bg-black/20 text-black" : "bg-neutral-800 text-neonCyan"}">${catCount}</span>
            </button>
          `;
        })
        .join("")}
    </div>

    <!-- Resources Cards Grid -->
    ${
      filteredItems.length === 0
        ? `
        <div class="text-center py-12 bg-slate-50 dark:bg-neutral-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-darkBorder">
          <i class="fa-solid ${typeLabels.icon} text-3xl text-slate-500 mb-2"></i>
          <p class="text-sm text-slate-400">No ${activeType} resources saved in this category yet. Add your first resource above!</p>
        </div>
      `
        : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filteredItems
            .map(
              (item) => `
            <div onclick="openResourceItem('${item.id}')" class="cursor-pointer group p-5 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 border border-slate-200 dark:border-darkBorder hover:border-neonPurple transition flex flex-col justify-between gap-4">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-neonCyan/15 text-neonCyan border border-neonCyan/30 flex items-center gap-1.5">
                    <i class="fa-solid fa-folder-open text-[10px]"></i>
                    ${escapeHtml(item.category)}
                  </span>
                  <div class="flex items-center gap-1">
                    ${
                      item.type === "link" || item.fileData
                        ? '<span class="text-[10px] px-2 py-0.5 rounded bg-neonPurple/15 text-neonPurple font-bold" title="Synced on Server"><i class="fa-solid fa-cloud"></i> Cloud</span>'
                        : '<span class="text-[10px] px-2 py-0.5 rounded bg-electricYellow/15 text-electricYellow font-bold" title="Saved on this device">Local</span>'
                    }
                    <button onclick="event.stopPropagation(); deleteResourceItem('${item.id}')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-electricYellow hover:bg-electricYellow/10 flex items-center justify-center transition" title="Delete Resource">
                      <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>

                <!-- Tag / Title Highlight -->
                <h4 class="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-neonPurple transition flex items-center gap-2">
                  <i class="fa-solid fa-tag text-neonPurple text-xs"></i>
                  <span>${escapeHtml(item.tag)}</span>
                </h4>

                <p class="text-xs text-slate-400 mt-1.5 truncate">
                  ${item.type === "link" ? escapeHtml(item.url) : `<i class="fa-regular fa-file mr-1"></i> ${escapeHtml(item.fileName)} (${formatBytesMB(item.sizeBytes)})`}
                </p>
              </div>

              <div class="pt-3 border-t border-slate-200 dark:border-darkBorder flex items-center justify-between text-xs font-bold">
                <span class="text-neonPurple flex items-center gap-1.5">
                  ${
                    item.type === "link"
                      ? '<i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Link directly'
                      : '<i class="fa-solid fa-eye"></i> Preview / Download'
                  }
                </span>
                <span class="text-[10px] text-slate-500">${new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      `
    }
  `;
}
