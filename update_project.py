import os

# Define file contents
server_js_content = r'''require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const TrackerData = require("./models/TrackerData");
const authMiddleware = require("./middleware/auth");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/recursy_tracker_db";
const JWT_SECRET = process.env.JWT_SECRET || "recursy_default_secret";

const resetCodes = {};

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(MONGO_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("Recursy MongoDB Connected Successfully!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

function getDefaultStarterData() {
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
    ],
    subjects: [
      {
        id: "subj_calculus",
        name: "Calculus for Engineers",
        createdAt: Date.now(),
        units: [
          {
            id: "unit_calc_1",
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
                    text: "Q1: Leibnitz Theorem Proof & Maclaurin Series",
                    completed: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    weakAreas: [],
    weeklyTasks: [],
    resources: [],
  };
}

app.get("/", (req, res) => {
  res.json({ status: "Recursy Backend API is Live & Running!" });
});

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required!" });
    }
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ error: "Account already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });
    await user.save();

    const starter = getDefaultStarterData();
    const tracker = new TrackerData({
      userId: user._id,
      todos: starter.todos,
      subjects: starter.subjects,
      weakAreas: starter.weakAreas,
      weeklyTasks: starter.weeklyTasks,
      resources: starter.resources,
    });
    await tracker.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ success: true, token, user: { userId: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required!" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ error: "Invalid Email or Password!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Email or Password!" });

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ success: true, token, user: { userId: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required!" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: "User not found!" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes[email.toLowerCase().trim()] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    console.log(`Password reset code for ${email}: ${code}`);
    res.json({ success: true, message: "Reset code generated!", debugCode: code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: "All fields required!" });

    const cleanEmail = email.toLowerCase().trim();
    const record = resetCodes[cleanEmail];

    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: "Invalid or expired reset code!" });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ error: "User not found!" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    delete resetCodes[cleanEmail];
    res.json({ success: true, message: "Password reset successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/data", authMiddleware, async (req, res) => {
  try {
    let tracker = await TrackerData.findOne({ userId: req.user.userId });
    if (!tracker) {
      const starter = getDefaultStarterData();
      tracker = new TrackerData({ userId: req.user.userId, ...starter });
      await tracker.save();
    }
    res.json(tracker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/data", authMiddleware, async (req, res) => {
  try {
    const { todos, subjects, weakAreas, weeklyTasks, resources } = req.body;
    const tracker = await TrackerData.findOneAndUpdate(
      { userId: req.user.userId },
      { todos, subjects, weakAreas, weeklyTasks, resources, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json({ success: true, tracker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

module.exports = app;
'''

index_html_content = r'''<!doctype html>
<html lang="en" class="dark">
  <head>
    <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"></script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recursy — Personal Academic & Progress Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23050505' stroke='%2300ff66' stroke-width='6'/><path d='M50 22L15 40l35 18 28-14.4V65h7V40L50 22zm0 43.2L27.6 53.6 50 42l22.4 11.6L50 65.2zM25 60.8v11.7C25 79.4 36.2 85 50 85s25-5.6 25-12.5V60.8L50 73.6 25 60.8z' fill='%2300ff66'/></svg>"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>
    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            fontFamily: { sans: ["Inter", "sans-serif"], display: ["Poppins", "sans-serif"] },
            colors: { neonPurple: "#00ff66", neonCyan: "#00e5ff", electricYellow: "#ff9900", darkBg: "#050505", darkCard: "#0c0e12", darkBorder: "#1a1f26" }
          }
        }
      };
    </script>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body class="bg-slate-50 text-slate-900 dark:bg-darkBg dark:text-slate-100 min-h-screen flex flex-col selection:bg-neonPurple selection:text-black">
    <div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"></div>

    <div id="confirmModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div class="flex items-center gap-3 text-electricYellow mb-3">
          <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
          <h3 id="confirmTitle" class="text-lg font-bold text-slate-900 dark:text-white">Confirm Deletion</h3>
        </div>
        <p id="confirmMessage" class="text-sm text-slate-600 dark:text-slate-300 mb-6">Are you sure?</p>
        <div class="flex justify-end gap-3">
          <button id="confirmCancelBtn" class="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-neutral-800 text-slate-300">Cancel</button>
          <button id="confirmOkBtn" class="px-4 py-2 rounded-xl text-sm font-bold bg-electricYellow text-black">Delete</button>
        </div>
      </div>
    </div>

    <!-- Edit Item Modal -->
    <div id="editItemModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-darkBorder pb-3">
          <h3 id="editModalTitle" class="text-lg font-bold text-slate-900 dark:text-white">Edit Item</h3>
          <button onclick="closeEditModal()" class="w-8 h-8 rounded-xl bg-neutral-800 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="editItemForm" onsubmit="handleEditItemSubmit(event)" class="space-y-4">
          <div>
            <label id="editLabelName" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Name / Text</label>
            <input type="text" id="editInputName" required class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonPurple" />
          </div>
          <div id="editExtraFieldWrapper" class="hidden">
            <label id="editLabelExtra" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Category / Tag</label>
            <input type="text" id="editInputExtra" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonPurple" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" onclick="closeEditModal()" class="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-neutral-800 text-slate-300">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-sm font-bold bg-neonPurple text-black shadow-lg">Save Changes</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div id="forgotPasswordModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-darkBorder pb-3">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h3>
          <button onclick="closeForgotPasswordModal()" class="w-8 h-8 rounded-xl bg-neutral-800 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="forgotStep1" class="space-y-4">
          <p class="text-xs text-slate-400">Enter your registered email address to receive a verification code.</p>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <input type="email" id="forgotEmailInput" required placeholder="satyansh@recursy.in" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonPurple" />
          </div>
          <div id="forgotStep1Error" class="hidden text-xs text-electricYellow bg-electricYellow/10 p-2.5 rounded-xl"></div>
          <button type="button" onclick="handleSendResetCode()" class="w-full py-2.5 rounded-xl bg-neonPurple text-black font-bold text-sm shadow-lg">Send Reset Code</button>
        </div>
        <div id="forgotStep2" class="space-y-4 hidden">
          <p id="forgotCodeSentMsg" class="text-xs text-neonCyan font-medium"></p>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">6-Digit Verification Code</label>
            <input type="text" id="forgotCodeInput" required placeholder="123456" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonPurple" />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
            <input type="password" id="forgotNewPasswordInput" required placeholder="••••••••" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm focus:outline-none focus:border-neonPurple" />
          </div>
          <div id="forgotStep2Error" class="hidden text-xs text-electricYellow bg-electricYellow/10 p-2.5 rounded-xl"></div>
          <button type="button" onclick="handleConfirmResetPassword()" class="w-full py-2.5 rounded-xl bg-neonPurple text-black font-bold text-sm shadow-lg">Update Password & Login</button>
        </div>
      </div>
    </div>

    <!-- Auth Screen -->
    <div id="authScreen" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-100 dark:bg-darkBg p-4 overflow-y-auto">
      <div class="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-darkCard rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-darkBorder my-8">
        <div class="lg:col-span-6 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-8 text-white flex flex-col justify-between relative overflow-hidden border-r border-darkBorder">
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-neonPurple to-neonCyan flex items-center justify-center text-black font-bold text-xl shadow-lg"><i class="fa-solid fa-graduation-cap"></i></div>
              <span class="font-display font-bold text-2xl tracking-tight">Recursy <span class="text-neonPurple">Pro</span></span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-bold leading-tight mb-4">Your Personal Academic & Syllabus Progress Ecosystem</h1>
          </div>
        </div>
        <div class="lg:col-span-6 p-8 flex flex-col justify-center">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 id="authHeading" class="text-2xl font-bold text-slate-900 dark:text-white">Sign In to Recursy</h2>
              <p id="authSubheading" class="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter your email and password</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-neutral-900 rounded-xl mb-6">
            <button id="tabLoginBtn" onclick="switchAuthTab('login')" class="py-2 text-sm font-semibold rounded-lg bg-white dark:bg-darkCard text-neonPurple shadow-sm">Login</button>
            <button id="tabRegisterBtn" onclick="switchAuthTab('register')" class="py-2 text-sm font-semibold rounded-lg text-slate-400">Sign Up</button>
          </div>
          <form id="authForm" onsubmit="handleAuthSubmit(event)" class="space-y-4">
            <div id="nameFieldWrapper" class="hidden">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
              <input type="text" id="authName" placeholder="Satyansh Kumar Singh" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
              <input type="email" id="authEmail" required placeholder="satyansh@recursy.in" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                <button type="button" onclick="openForgotPasswordModal()" class="text-xs text-neonCyan hover:underline">Forgot Password?</button>
              </div>
              <input type="password" id="authPassword" required placeholder="••••••••" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-darkBorder text-sm" />
            </div>
            <div id="authErrorMsg" class="hidden text-xs text-electricYellow bg-electricYellow/10 p-3 rounded-xl"></div>
            <button type="submit" id="authSubmitBtn" class="w-full py-3 rounded-xl bg-neonPurple hover:opacity-90 text-black font-bold text-sm shadow-lg"><span id="authSubmitText">Login to Dashboard</span></button>
          </form>
        </div>
      </div>
    </div>

    <!-- Main Layout -->
    <div id="appContainer" class="hidden flex-1 flex flex-col min-h-screen">
      <header class="sticky top-0 z-30 bg-white/90 dark:bg-darkCard/90 backdrop-blur-md border-b border-slate-200 dark:border-darkBorder px-4 lg:px-8 py-3">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-neonPurple to-neonCyan flex items-center justify-center text-black font-bold text-lg"><i class="fa-solid fa-graduation-cap"></i></div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-display font-bold text-lg text-slate-900 dark:text-white">Recursy <span class="text-neonPurple">Pro</span></span>
                <span id="cloudSyncBadge" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neonPurple/10 text-neonPurple"><span class="w-1.5 h-1.5 rounded-full bg-neonPurple animate-pulse"></span> Cloud Synced</span>
              </div>
              <p class="text-[11px] text-slate-400">Welcome back, <strong id="headerUserName" class="text-slate-200">Satyansh</strong>!</p>
            </div>
          </div>
          <nav class="flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-neutral-900 p-1 rounded-2xl">
            <button onclick="switchSection('dashboard')" id="nav-dashboard" class="nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-neonPurple text-black">Dashboard</button>
            <button onclick="switchSection('todo')" id="nav-todo" class="nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-300">Daily To-Do <span id="navTodoBadge" class="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-neonCyan">0</span></button>
            <button onclick="switchSection('subjects')" id="nav-subjects" class="nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-300">Subjects</button>
            <button onclick="switchSection('weekly')" id="nav-weekly" class="nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-300">Weekly Planner</button>
            <button onclick="switchSection('resources')" id="nav-resources" class="nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-300">Resources</button>
            <button onclick="switchSection('weak')" id="nav-weak" class="nav-tab px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-300">Weak Areas <span id="navWeakBadge" class="px-1.5 py-0.2 rounded-full text-[10px] bg-electricYellow/20 text-electricYellow">0</span></button>
          </nav>
          <div class="flex items-center gap-2">
            <button onclick="toggleTheme()" class="px-3 py-2 rounded-xl bg-neutral-900 text-slate-300 text-xs font-semibold"><i class="fa-solid fa-moon"></i> Theme</button>
            <button onclick="handleLogout()" class="px-3 py-2 rounded-xl bg-neutral-900 text-electricYellow text-xs font-semibold"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </div>
      </header>

      <main class="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        <!-- Dashboard -->
        <section id="section-dashboard" class="space-y-6">
          <div class="relative rounded-3xl bg-neutral-950 text-white p-6 sm:p-8 border border-neonPurple/25">
            <h1 class="text-2xl sm:text-3xl font-bold font-display">Welcome back, <span id="BannerUserName" class="text-neonPurple">Satyansh</span>!</h1>
            <p class="text-xs sm:text-sm text-slate-300 mt-2">Track real-time progress across all your subjects, units, chapters, and questions.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div onclick="switchSection('todo')" class="cursor-pointer bg-darkCard p-5 rounded-2xl border border-darkBorder">
              <p class="text-xs text-slate-400">Daily To-Do Tasks</p>
              <h3 id="statTodoCompleted" class="text-2xl font-bold mt-1">0 / 0</h3>
            </div>
            <div onclick="switchSection('subjects')" class="cursor-pointer bg-darkCard p-5 rounded-2xl border border-darkBorder">
              <p class="text-xs text-slate-400">Active Subjects</p>
              <h3 id="statSubjectsCount" class="text-2xl font-bold mt-1">0 Subjects</h3>
            </div>
            <div onclick="switchSection('subjects')" class="cursor-pointer bg-darkCard p-5 rounded-2xl border border-darkBorder">
              <p class="text-xs text-slate-400">Questions Solved</p>
              <h3 id="statQuestionsSolved" class="text-2xl font-bold mt-1">0 / 0</h3>
            </div>
            <div onclick="switchSection('subjects')" class="cursor-pointer bg-darkCard p-5 rounded-2xl border border-darkBorder">
              <p class="text-xs text-slate-400">Total Revisions (+1)</p>
              <h3 id="statTotalRevisions" class="text-2xl font-bold mt-1">0 Times</h3>
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-7 bg-darkCard rounded-2xl border border-darkBorder p-5 sm:p-6">
              <h2 class="text-lg font-bold mb-4">Subject Progress Breakdown</h2>
              <div id="dashSubjectList" class="space-y-4"></div>
            </div>
            <div class="lg:col-span-5 space-y-6">
              <div class="bg-darkCard rounded-2xl border border-darkBorder p-5 sm:p-6">
                <h2 class="text-lg font-bold mb-4">Priority Weak Areas</h2>
                <div id="dashWeakList" class="space-y-3"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- To-Do -->
        <section id="section-todo" class="hidden space-y-6">
          <div class="bg-darkCard rounded-3xl border border-darkBorder p-6 sm:p-8">
            <h1 class="text-2xl font-bold mb-4">Daily To-Do List</h1>
            <form onsubmit="handleAddTodo(event)" class="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input type="text" id="todoInputText" required placeholder="Task text..." class="sm:col-span-7 px-4 py-3 rounded-xl bg-neutral-900 border border-darkBorder text-sm" />
              <select id="todoInputTag" class="sm:col-span-3 px-4 py-3 rounded-xl bg-neutral-900 border border-darkBorder text-sm">
                <option value="Study">Study</option>
                <option value="Revision">Revision</option>
                <option value="Practice">Practice</option>
              </select>
              <button type="submit" class="sm:col-span-2 py-3 rounded-xl bg-neonPurple text-black font-bold text-sm">Add Task</button>
            </form>
            <div id="todoListContainer" class="mt-4 space-y-2.5"></div>
          </div>
        </section>

        <!-- Subjects -->
        <section id="section-subjects" class="hidden space-y-6">
          <div class="bg-darkCard rounded-3xl border border-darkBorder p-6">
            <div class="flex justify-between items-center">
              <h1 class="text-2xl font-bold">Subjects Tracker</h1>
              <form onsubmit="handleAddSubject(event)" class="flex gap-2">
                <input type="text" id="newSubjectNameInput" required placeholder="New Subject" class="px-4 py-2.5 rounded-xl bg-neutral-900 border border-darkBorder text-sm" />
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-neonPurple text-black font-bold text-sm">Add Subject</button>
              </form>
            </div>
            <div id="subjectsGridContainer" class="mt-6"></div>
          </div>
          <div id="activeSubjectWorkspace" class="bg-darkCard rounded-3xl border border-neonPurple/30 p-6 sm:p-8 space-y-6"></div>
        </section>

        <!-- Weekly Planner -->
        <section id="section-weekly" class="hidden space-y-6">
          <div class="bg-darkCard rounded-3xl border border-darkBorder p-6">
            <h1 class="text-2xl font-bold">Weekly Planner</h1>
          </div>
        </section>

        <!-- Resources -->
        <section id="section-resources" class="hidden space-y-6">
          <div class="bg-darkCard rounded-3xl border border-darkBorder p-6">
            <h1 class="text-2xl font-bold">Resources Vault</h1>
          </div>
        </section>

        <!-- Weak Areas -->
        <section id="section-weak" class="hidden space-y-6">
          <div class="bg-darkCard rounded-3xl border border-darkBorder p-6">
            <h1 class="text-2xl font-bold">Weak Areas</h1>
            <form onsubmit="handleAddWeakArea(event)" class="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
              <select id="weakSubjectSelect" class="md:col-span-3 px-3 py-2.5 rounded-xl bg-neutral-900 border border-darkBorder text-sm"></select>
              <input type="text" id="weakTopicInput" required placeholder="Weak Topic" class="md:col-span-4 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-darkBorder text-sm" />
              <input type="text" id="weakActionInput" placeholder="Action Plan" class="md:col-span-3 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-darkBorder text-sm" />
              <button type="submit" class="md:col-span-2 py-2.5 rounded-xl bg-electricYellow text-black font-bold text-sm">Add Weak Area</button>
            </form>
            <div id="weakAreasListContainer" class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"></div>
          </div>
        </section>
      </main>
    </div>
    <script src="app.js"></script>
  </body>
</html>
'''

app_js_content = r'''const API_URL = "https://recursy-api.vercel.app/api";

let appState = {
  authMode: "login",
  token: null,
  user: null,
  activeSection: "dashboard",
  todoFilter: "all",
  activeResourceType: "link",
  activeResourceCategory: "ALL",
  weeklyFilter: "all",
  selectedSubjectId: null,
  selectedUnitId: null,
  collapsedTopics: {},
  data: { todos: [], subjects: [], weakAreas: [], resources: [], weeklyTasks: [] },
};

let currentEditTarget = null;

window.openEditModal = function(type, subjectId, unitId, topicId, itemId) {
  currentEditTarget = { type, subjectId, unitId, topicId, itemId };
  const modal = document.getElementById("editItemModal");
  const titleEl = document.getElementById("editModalTitle");
  const labelName = document.getElementById("editLabelName");
  const inputName = document.getElementById("editInputName");
  const extraWrap = document.getElementById("editExtraFieldWrapper");
  const labelExtra = document.getElementById("editLabelExtra");
  const inputExtra = document.getElementById("editInputExtra");

  if(!modal) return;
  extraWrap.classList.add("hidden");
  inputExtra.required = false;

  if (type === "todo") {
    titleEl.textContent = "Edit To-Do Task";
    labelName.textContent = "Task Text";
    const item = appState.data.todos.find(t => t.id === itemId);
    inputName.value = item ? item.text : "";
    extraWrap.classList.remove("hidden");
    labelExtra.textContent = "Category Tag";
    inputExtra.value = item ? item.tag : "";
  } else if (type === "subject") {
    titleEl.textContent = "Edit Subject Name";
    labelName.textContent = "Subject Name";
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    inputName.value = subj ? subj.name : "";
  } else if (type === "unit") {
    titleEl.textContent = "Edit Unit Name";
    labelName.textContent = "Unit Name";
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    inputName.value = unit ? unit.name : "";
  } else if (type === "topic") {
    titleEl.textContent = "Edit Chapter / Topic";
    labelName.textContent = "Topic Name";
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    inputName.value = topic ? topic.name : "";
  } else if (type === "question") {
    titleEl.textContent = "Edit Practice Question";
    labelName.textContent = "Question Text";
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    const q = topic?.questions.find(item => item.id === itemId);
    inputName.value = q ? q.text : "";
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.closeEditModal = function() {
  const modal = document.getElementById("editItemModal");
  if(modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  currentEditTarget = null;
};

window.handleEditItemSubmit = async function(e) {
  e.preventDefault();
  if (!currentEditTarget) return;

  const { type, subjectId, unitId, topicId, itemId } = currentEditTarget;
  const valName = document.getElementById("editInputName").value.trim();
  const valExtra = document.getElementById("editInputExtra").value.trim();

  if (!valName) return;

  if (type === "todo") {
    const item = appState.data.todos.find(t => t.id === itemId);
    if (item) {
      item.text = valName;
      if (valExtra) item.tag = valExtra;
    }
  } else if (type === "subject") {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    if (subj) subj.name = valName;
  } else if (type === "unit") {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    if (unit) unit.name = valName;
  } else if (type === "topic") {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    if (topic) topic.name = valName;
  } else if (type === "question") {
    const subj = appState.data.subjects.find(s => s.id === subjectId);
    const unit = subj?.units.find(u => u.id === unitId);
    const topic = unit?.topics.find(t => t.id === topicId);
    const q = topic?.questions.find(item => item.id === itemId);
    if (q) q.text = valName;
  }

  closeEditModal();
  showToast("Successfully updated!", "success");
  await saveWorkspaceToCloud();
};

window.openForgotPasswordModal = function() {
  const modal = document.getElementById("forgotPasswordModal");
  document.getElementById("forgotStep1").classList.remove("hidden");
  document.getElementById("forgotStep2").classList.add("hidden");
  document.getElementById("forgotEmailInput").value = "";
  document.getElementById("forgotStep1Error").classList.add("hidden");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.closeForgotPasswordModal = function() {
  const modal = document.getElementById("forgotPasswordModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
};

let resetTargetEmail = "";
window.handleSendResetCode = async function() {
  const emailInput = document.getElementById("forgotEmailInput").value.trim().toLowerCase();
  const errBox = document.getElementById("forgotStep1Error");
  errBox.classList.add("hidden");
  if (!emailInput) return;

  try {
    const res = await fetch(API_URL + "/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to generate code");

    resetTargetEmail = emailInput;
    document.getElementById("forgotStep1").classList.add("hidden");
    document.getElementById("forgotStep2").classList.remove("hidden");
    document.getElementById("forgotCodeSentMsg").textContent = `Code sent to ${emailInput}. (Debug: ${data.debugCode})`;
    showToast("Reset code sent!", "success");
  } catch(err) {
    errBox.textContent = err.message;
    errBox.classList.remove("hidden");
  }
};

window.handleConfirmResetPassword = async function() {
  const code = document.getElementById("forgotCodeInput").value.trim();
  const newPassword = document.getElementById("forgotNewPasswordInput").value;
  const errBox = document.getElementById("forgotStep2Error");
  errBox.classList.add("hidden");

  if (!code || !newPassword) return;

  try {
    const res = await fetch(API_URL + "/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetTargetEmail, code, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Reset failed");

    showToast("Password updated successfully! Please login.", "success");
    closeForgotPasswordModal();
  } catch(err) {
    errBox.textContent = err.message;
    errBox.classList.remove("hidden");
  }
};

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold bg-neonPurple text-black`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function askConfirmation(title, message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.getElementById("confirmCancelBtn").onclick = () => modal.classList.remove("flex") || modal.classList.add("hidden");
  document.getElementById("confirmOkBtn").onclick = () => { modal.classList.remove("flex") || modal.classList.add("hidden"); onConfirm(); };
}

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

window.switchAuthTab = function (mode) {
  appState.authMode = mode;
  const loginBtn = document.getElementById("tabLoginBtn");
  const regBtn = document.getElementById("tabRegisterBtn");
  const nameWrap = document.getElementById("nameFieldWrapper");
  if (mode === "register") {
    regBtn.className = "py-2 text-sm font-semibold rounded-lg bg-white dark:bg-darkCard text-neonPurple shadow-sm";
    loginBtn.className = "py-2 text-sm font-semibold rounded-lg text-slate-400";
    nameWrap.classList.remove("hidden");
  } else {
    loginBtn.className = "py-2 text-sm font-semibold rounded-lg bg-white dark:bg-darkCard text-neonPurple shadow-sm";
    regBtn.className = "py-2 text-sm font-semibold rounded-lg text-slate-400";
    nameWrap.classList.add("hidden");
  }
};

window.handleAuthSubmit = async function (e) {
  e.preventDefault();
  const nameInput = document.getElementById("authName").value.trim();
  const emailInput = document.getElementById("authEmail").value.trim().toLowerCase();
  const passwordInput = document.getElementById("authPassword").value;
  const endpoint = appState.authMode === "register" ? "/signup" : "/login";
  const payload = appState.authMode === "register" ? { name: nameInput || emailInput.split("@")[0], email: emailInput, password: passwordInput } : { email: emailInput, password: passwordInput };

  try {
    const res = await fetch(API_URL + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");

    appState.token = data.token;
    appState.user = data.user;
    localStorage.setItem("recursy_token", data.token);
    localStorage.setItem("recursy_user", JSON.stringify(data.user));
    openDashboardUI(data.user.name);
    await fetchUserDataFromBackend();
  } catch (err) {
    document.getElementById("authErrorMsg").textContent = err.message;
    document.getElementById("authErrorMsg").classList.remove("hidden");
  }
};

window.handleLogout = function () {
  localStorage.clear();
  location.reload();
};

async function fetchUserDataFromBackend() {
  if (!appState.token) return;
  try {
    const res = await fetch(`${API_URL}/data`, { headers: { Authorization: `Bearer ${appState.token}` } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    appState.data = data.tracker || data;
    renderAll();
  } catch (e) {
    console.error(e);
  }
}

async function saveWorkspaceToCloud() {
  renderAll();
  if (!appState.token) return;
  await fetch(`${API_URL}/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${appState.token}` },
    body: JSON.stringify(appState.data),
  });
}

window.switchSection = function (sectionName) {
  appState.activeSection = sectionName;
  ["dashboard", "todo", "subjects", "weekly", "resources", "weak"].forEach((s) => {
    document.getElementById("section-" + s).classList.toggle("hidden", s !== sectionName);
  });
  renderAll();
};

function calculateSubjectStats(subject) {
  const units = subject.units || [];
  let totalTopics = 0, solvedQuestions = 0, totalQuestions = 0, totalRevisions = 0, topicPctSum = 0;
  units.forEach((u) => {
    (u.topics || []).forEach((t) => {
      totalTopics++;
      totalRevisions += t.revisions || 0;
      const q = t.questions || [];
      const solved = q.filter(x => x.completed).length;
      totalQuestions += q.length;
      solvedQuestions += solved;
      topicPctSum += q.length > 0 ? Math.round((solved / q.length) * 100) : (t.completed ? 100 : 0);
    });
  });
  return { pct: totalTopics > 0 ? Math.round(topicPctSum / totalTopics) : 0, totalUnits: units.length, solvedQuestions, totalQuestions, totalRevisions };
}

function calculateOverallMetrics() {
  const subjects = appState.data.subjects || [];
  let totalTopics = 0, solvedQuestions = 0, totalQuestions = 0, totalRevisions = 0, subjPctSum = 0;
  subjects.forEach((s) => {
    const st = calculateSubjectStats(s);
    totalTopics += st.totalUnits;
    solvedQuestions += st.solvedQuestions;
    totalQuestions += st.totalQuestions;
    totalRevisions += st.totalRevisions;
    subjPctSum += st.pct;
  });
  const todos = appState.data.todos || [];
  return {
    overallPct: subjects.length > 0 ? Math.round(subjPctSum / subjects.length) : 0,
    subjectsCount: subjects.length,
    solvedQuestions, totalQuestions, totalRevisions,
    totalTodos: todos.length,
    completedTodos: todos.filter(t => t.completed).length,
    weakCount: (appState.data.weakAreas || []).length,
    weakPct: 50
  };
}

window.handleAddTodo = async function (e) {
  e.preventDefault();
  const text = document.getElementById("todoInputText").value.trim();
  const tag = document.getElementById("todoInputTag").value;
  if (!text) return;
  appState.data.todos.unshift({ id: "td_" + Date.now(), text, tag, completed: false });
  document.getElementById("todoInputText").value = "";
  await saveWorkspaceToCloud();
};

window.toggleTodoComplete = async function (id) {
  const t = appState.data.todos.find(x => x.id === id);
  if (t) t.completed = !t.completed;
  await saveWorkspaceToCloud();
};

window.deleteTodoItem = async function (id) {
  appState.data.todos = appState.data.todos.filter(x => x.id !== id);
  await saveWorkspaceToCloud();
};

window.handleAddSubject = async function (e) {
  e.preventDefault();
  const name = document.getElementById("newSubjectNameInput").value.trim();
  if (!name) return;
  appState.data.subjects.push({ id: "subj_" + Date.now(), name, units: [{ id: "unit_" + Date.now(), name: "Unit 1", topics: [] }] });
  document.getElementById("newSubjectNameInput").value = "";
  await saveWorkspaceToCloud();
};

window.selectSubject = function (id) {
  appState.selectedSubjectId = id;
  switchSection("subjects");
};

window.deleteSubject = async function (id) {
  appState.data.subjects = appState.data.subjects.filter(s => s.id !== id);
  await saveWorkspaceToCloud();
};

window.handleAddUnit = async function (e, subjId) {
  e.preventDefault();
  const name = document.getElementById("newUnitNameInput").value.trim();
  const subj = appState.data.subjects.find(s => s.id === subjId);
  if (subj && name) subj.units.push({ id: "unit_" + Date.now(), name, topics: [] });
  await saveWorkspaceToCloud();
};

window.selectUnitTab = function (id) {
  appState.selectedUnitId = id;
  renderSubjectsSection();
};

window.deleteUnit = async function (subjId, unitId) {
  const subj = appState.data.subjects.find(s => s.id === subjId);
  if (subj) subj.units = subj.units.filter(u => u.id !== unitId);
  await saveWorkspaceToCloud();
};

window.handleAddTopic = async function (e, subjId, unitId) {
  e.preventDefault();
  const name = document.getElementById("newTopicNameInput").value.trim();
  const subj = appState.data.subjects.find(s => s.id === subjId);
  const unit = subj?.units.find(u => u.id === unitId);
  if (unit && name) unit.topics.push({ id: "top_" + Date.now(), name, revisions: 0, questions: [] });
  await saveWorkspaceToCloud();
};

window.incrementRevision = async function (subjId, unitId, topicId, delta) {
  const subj = appState.data.subjects.find(s => s.id === subjId);
  const unit = subj?.units.find(u => u.id === unitId);
  const topic = unit?.topics.find(t => t.id === topicId);
  if (topic) topic.revisions = Math.max(0, (topic.revisions || 0) + delta);
  await saveWorkspaceToCloud();
};

window.deleteTopic = async function (subjId, unitId, topicId) {
  const subj = appState.data.subjects.find(s => s.id === subjId);
  const unit = subj?.units.find(u => u.id === unitId);
  if (unit) unit.topics = unit.topics.filter(t => t.id !== topicId);
  await saveWorkspaceToCloud();
};

window.handleAddQuestion = async function (e, subjId, unitId, topicId) {
  e.preventDefault();
  const text = document.getElementById(`qInput_${topicId}`).value.trim();
  const subj = appState.data.subjects.find(s => s.id === subjId);
  const unit = subj?.units.find(u => u.id === unitId);
  const topic = unit?.topics.find(t => t.id === topicId);
  if (topic && text) topic.questions.push({ id: "q_" + Date.now(), text, completed: false });
  await saveWorkspaceToCloud();
};

window.toggleQuestionSolved = async function (subjId, unitId, topicId, qId) {
  const subj = appState.data.subjects.find(s => s.id === subjId);
  const unit = subj?.units.find(u => u.id === unitId);
  const topic = unit?.topics.find(t => t.id === topicId);
  const q = topic?.questions.find(x => x.id === qId);
  if (q) q.completed = !q.completed;
  await saveWorkspaceToCloud();
};

window.deleteQuestion = async function (subjId, unitId, topicId, qId) {
  const subj = appState.data.subjects.find(s => s.id === subjId);
  const unit = subj?.units.find(u => u.id === unitId);
  const topic = unit?.topics.find(t => t.id === topicId);
  if (topic) topic.questions = topic.questions.filter(x => x.id !== qId);
  await saveWorkspaceToCloud();
};

window.handleAddWeakArea = async function (e) {
  e.preventDefault();
  const subjectName = document.getElementById("weakSubjectSelect").value;
  const topicName = document.getElementById("weakTopicInput").value.trim();
  const actionPlan = document.getElementById("weakActionInput").value.trim();
  if (topicName) appState.data.weakAreas.push({ id: "wk_" + Date.now(), subjectName, topicName, actionPlan, progress: 0 });
  await saveWorkspaceToCloud();
};

window.updateWeakProgress = async function (id, val) {
  const w = appState.data.weakAreas.find(x => x.id === id);
  if (w) w.progress = Number(val);
  await saveWorkspaceToCloud();
};

window.deleteWeakArea = async function (id) {
  appState.data.weakAreas = appState.data.weakAreas.filter(x => x.id !== id);
  await saveWorkspaceToCloud();
};

function renderAll() {
  const metrics = calculateOverallMetrics();
  document.getElementById("navTodoBadge").textContent = metrics.totalTodos - metrics.completedTodos;
  document.getElementById("navWeakBadge").textContent = metrics.weakCount;

  renderDashboard(metrics);
  renderTodoSection();
  renderSubjectsSection();
  renderWeakSection();
}

function renderDashboard(metrics) {
  document.getElementById("statTodoCompleted").textContent = `${metrics.completedTodos} / ${metrics.totalTodos}`;
  document.getElementById("statSubjectsCount").textContent = `${metrics.subjectsCount} Subjects`;
  document.getElementById("statQuestionsSolved").textContent = `${metrics.solvedQuestions} / ${metrics.totalQuestions}`;
  document.getElementById("statTotalRevisions").textContent = `${metrics.totalRevisions} Times`;

  document.getElementById("dashSubjectList").innerHTML = appState.data.subjects.map(s => {
    const st = calculateSubjectStats(s);
    return `<div onclick="selectSubject('${s.id}')" class="cursor-pointer p-3 bg-neutral-900 rounded-xl flex justify-between items-center text-xs"><span>${s.name}</span><strong class="text-neonPurple">${st.pct}%</strong></div>`;
  }).join("");

  document.getElementById("dashWeakList").innerHTML = (appState.data.weakAreas || []).map(w => `
    <div class="p-2.5 bg-neutral-900 rounded-xl flex justify-between items-center text-xs"><span>${w.topicName}</span><strong class="text-electricYellow">${w.progress}%</strong></div>
  `).join("");
}

function renderTodoSection() {
  document.getElementById("todoListContainer").innerHTML = (appState.data.todos || []).map(t => `
    <div class="flex items-center justify-between p-3 bg-neutral-900 rounded-xl text-xs">
      <span class="cursor-pointer ${t.completed ? 'line-through text-slate-500' : 'text-white'}" onclick="toggleTodoComplete('${t.id}')">${t.text}</span>
      <div class="flex gap-2">
        <button onclick="openEditModal('todo', null, null, null, '${t.id}')" class="text-neonCyan"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteTodoItem('${t.id}')" class="text-electricYellow"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join("");
}

function renderSubjectsSection() {
  const grid = document.getElementById("subjectsGridContainer");
  const ws = document.getElementById("activeSubjectWorkspace");
  const subjects = appState.data.subjects || [];

  grid.innerHTML = subjects.map(s => `
    <div class="p-4 bg-neutral-900 rounded-xl border border-darkBorder flex justify-between items-center">
      <span class="cursor-pointer font-bold" onclick="selectSubject('${s.id}')">${s.name}</span>
      <div class="flex gap-2">
        <button onclick="openEditModal('subject', '${s.id}')" class="text-neonCyan text-xs"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteSubject('${s.id}')" class="text-electricYellow text-xs"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join("");

  const activeSubj = subjects.find(s => s.id === appState.selectedSubjectId) || subjects[0];
  if (!activeSubj) { ws.innerHTML = ""; return; }
  const activeUnit = activeSubj.units?.find(u => u.id === appState.selectedUnitId) || activeSubj.units?.[0];

  ws.innerHTML = `
    <div class="flex justify-between items-center border-b border-darkBorder pb-3">
      <h2 class="text-xl font-bold text-white">${activeSubj.name}</h2>
      <form onsubmit="handleAddUnit(event, '${activeSubj.id}')" class="flex gap-2">
        <input type="text" id="newUnitNameInput" required placeholder="New Unit" class="px-3 py-1.5 rounded bg-neutral-900 border border-darkBorder text-xs text-white">
        <button type="submit" class="px-3 py-1.5 rounded bg-neonCyan text-black font-bold text-xs">+ Unit</button>
      </form>
    </div>
    <div class="flex gap-2 overflow-x-auto">
      ${(activeSubj.units || []).map(u => `
        <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-neutral-900 text-xs">
          <span class="cursor-pointer" onclick="selectUnitTab('${u.id}')">${u.name}</span>
          <button onclick="openEditModal('unit', '${activeSubj.id}', '${u.id}')" class="text-neonCyan"><i class="fa-solid fa-pen"></i></button>
          <button onclick="deleteUnit('${activeSubj.id}', '${u.id}')" class="text-electricYellow"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join("")}
    </div>
    ${!activeUnit ? '' : `
      <div class="space-y-3">
        <form onsubmit="handleAddTopic(event, '${activeSubj.id}', '${activeUnit.id}')" class="flex gap-2">
          <input type="text" id="newTopicNameInput" required placeholder="New Topic..." class="flex-1 px-3 py-1.5 rounded bg-neutral-900 border border-darkBorder text-xs text-white">
          <button type="submit" class="px-3 py-1.5 rounded bg-neonPurple text-black font-bold text-xs">+ Topic</button>
        </form>
        <div class="space-y-2">
          ${(activeUnit.topics || []).map(topic => `
            <div class="p-3 bg-neutral-900 rounded-xl space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white">${topic.name}</span>
                  <button onclick="openEditModal('topic', '${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="text-neonCyan"><i class="fa-solid fa-pen"></i></button>
                </div>
                <div class="flex gap-2 items-center">
                  <span>Revisions: ${topic.revisions || 0}</span>
                  <button onclick="incrementRevision('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', 1)" class="px-2 py-1 bg-neonPurple text-black rounded font-bold">+1</button>
                  <button onclick="deleteTopic('${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="text-electricYellow"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>
              <div class="pl-4 space-y-1 border-l border-darkBorder">
                ${(topic.questions || []).map(q => `
                  <div class="flex justify-between items-center bg-black/40 p-1.5 rounded">
                    <span class="${q.completed ? 'line-through text-slate-500' : 'text-slate-200'} cursor-pointer" onclick="toggleQuestionSolved('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', '${q.id}')">${q.text}</span>
                    <div class="flex gap-2">
                      <button onclick="openEditModal('question', '${activeSubj.id}', '${activeUnit.id}', '${topic.id}', '${q.id}')" class="text-neonCyan"><i class="fa-solid fa-pen"></i></button>
                      <button onclick="deleteQuestion('${activeSubj.id}', '${activeUnit.id}', '${topic.id}', '${q.id}')" class="text-electricYellow"><i class="fa-solid fa-trash"></i></button>
                    </div>
                  </div>
                `).join("")}
                <form onsubmit="handleAddQuestion(event, '${activeSubj.id}', '${activeUnit.id}', '${topic.id}')" class="flex gap-2 pt-1">
                  <input type="text" id="qInput_${topic.id}" required placeholder="Add Question..." class="flex-1 px-2 py-1 rounded bg-black border border-darkBorder text-white">
                  <button type="submit" class="px-2 py-1 rounded bg-neonCyan text-black font-bold">+ Q</button>
                </form>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `}
  `;
}

function renderWeakSection() {
  const select = document.getElementById("weakSubjectSelect");
  select.innerHTML = (appState.data.subjects || []).map(s => `<option value="${s.name}">${s.name}</option>`).join("");
  document.getElementById("weakAreasListContainer").innerHTML = (appState.data.weakAreas || []).map(w => `
    <div class="p-3 bg-neutral-900 rounded-xl space-y-2 text-xs">
      <div class="flex justify-between"><strong>${w.topicName}</strong><button onclick="deleteWeakArea('${w.id}')" class="text-electricYellow"><i class="fa-solid fa-trash"></i></button></div>
      <input type="range" min="0" max="100" value="${w.progress}" onchange="updateWeakProgress('${w.id}', this.value)" class="w-full accent-electricYellow">
    </div>
  `).join("");
}
'''

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[SUCCESS] Updated: {path}")

if __name__ == "__main__":
    write_file("backend/server.js", server_js_content)
    write_file("frontend/index.html", index_html_content)
    write_file("frontend/app.js", app_js_content)
    print("\n[INFO] Saari files successfully update ho gayi hain! Ab aap server run kar sakte hain.")