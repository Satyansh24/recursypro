require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  console.warn("Nodemailer not installed yet. Run npm install in backend.");
}

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

// Default Starter Template for New Accounts
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
        id: "subj_calculus",
        name: "Calculus for Engineers",
        createdAt: Date.now(),
        units: [
          {
            id: "unit_calc_1",
            name: "Unit 1: Differential Calculus",
            topics: [
              {
                id: "top_102",
                name: "Partial Derivatives & Euler’s Theorem",
                revisions: 1,
                stars: 3,
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
              {
                id: "top_101",
                name: "Limits, Continuity & Taylor Series",
                revisions: 2,
                stars: 2,
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
            ],
          },
          {
            id: "unit_calc_2",
            name: "Unit 2: Integral & Vector Calculus",
            topics: [
              {
                id: "top_201",
                name: "Double & Triple Integrals (Change of Order)",
                revisions: 0,
                stars: 3,
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
        id: "subj_dsa",
        name: "Data Structures & Algorithms",
        createdAt: Date.now() + 100,
        units: [
          {
            id: "unit_dsa_1",
            name: "Unit 1: Arrays, Linked Lists & Stacks",
            topics: [
              {
                id: "top_301",
                name: "Singly & Doubly Linked List Operations",
                revisions: 3,
                stars: 3,
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
    weeklyTasks: [],
    resources: [],
  };
}

app.get("/", (req, res) => {
  res.json({ status: "Recursy Backend API is Live & Running!" });
});

// --- AUTH ROUTES ---
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "All fields (Name, Email, Password) are required!" });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user)
      return res
        .status(400)
        .json({ error: "Account already exists with this email!" });

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

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      token,
      user: { userId: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required!" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(400).json({ error: "Invalid Email or Password!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid Email or Password!" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      token,
      user: { userId: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FORGOT PASSWORD & OTP ROUTES ---
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ error: "Please enter your registered email address!" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with this email address!" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes
    await user.save();

    let mailSent = false;
    if (nodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Recursy Pro Security" <${process.env.EMAIL_USER}>`,
          to: cleanEmail,
          subject: "Your Recursy Pro Password Reset OTP",
          html: `
            <div style="font-family: Arial, sans-serif; background:#050505; color:#f8fafc; padding:24px; border-radius:16px; border:1px solid #00ff66;">
              <h2 style="color:#00ff66; margin-top:0;">Recursy Pro — Password Reset</h2>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>Use the 6-digit OTP below to verify your request and create a new password:</p>
              <div style="font-size:28px; font-weight:800; letter-spacing:6px; color:#050505; background:#00ff66; display:inline-block; padding:12px 24px; border-radius:12px; margin:16px 0;">
                ${otp}
              </div>
              <p style="font-size:12px; color:#94a3b8;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        });
        mailSent = true;
      } catch (mailErr) {
        console.error("SMTP Email Error:", mailErr);
      }
    }

    res.json({
      success: true,
      mailSent,
      message: mailSent
        ? `6-digit OTP sent to ${cleanEmail}!`
        : `OTP generated! (Set EMAIL_USER & EMAIL_PASS in .env for live email delivery)`,
      devOtp: mailSent ? undefined : otp,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required!" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res
        .status(400)
        .json({ error: "No active OTP request found. Please request a new OTP." });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res
        .status(400)
        .json({ error: "OTP has expired! Please request a new OTP." });
    }

    if (user.resetOtp !== otp.toString().trim()) {
      return res
        .status(400)
        .json({ error: "Invalid OTP! Please check and try again." });
    }

    res.json({
      success: true,
      message: "OTP verified! You can now create your new password.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, OTP, and New Password are required!" });
    }

    if (newPassword.length < 4) {
      return res
        .status(400)
        .json({ error: "Password must be at least 4 characters long!" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res
        .status(400)
        .json({ error: "Invalid or expired password reset session!" });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res
        .status(400)
        .json({ error: "OTP has expired! Please request a new OTP." });
    }

    if (user.resetOtp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Invalid OTP!" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    res.json({
      success: true,
      message:
        "New password created successfully! Please login with your new password.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROTECTED DATA SYNC ROUTES ---
app.get("/api/data", authMiddleware, async (req, res) => {
  try {
    let tracker = await TrackerData.findOne({ userId: req.user.userId });
    if (!tracker) {
      const starter = getDefaultStarterData();
      tracker = new TrackerData({
        userId: req.user.userId,
        todos: starter.todos,
        subjects: starter.subjects,
        weakAreas: starter.weakAreas,
        weeklyTasks: starter.weeklyTasks,
        resources: starter.resources,
      });
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
      {
        todos,
        subjects,
        weakAreas,
        weeklyTasks,
        resources,
        updatedAt: Date.now(),
      },
      { new: true, upsert: true },
    );
    res.json({ success: true, tracker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Recursy Backend running locally at http://localhost:${PORT}`);
  });
}

module.exports = app;
