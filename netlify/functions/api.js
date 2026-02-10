// netlify/functions/api.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const serverless = require('serverless-http');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

// --- Security Middleware ---
const helmet = require('helmet');
// const xss = require('xss-clean'); // Removed: Incompatible with Netlify/Node 18+
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// --- Environment Variables ---
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (EMAIL_USER) {
    console.log(`✅ Email System Configured for: ${EMAIL_USER}`);
} else {
    console.log("⚠️ Email credentials missing in environment variables.");
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// --- Prisma Client Initialization ---
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// --- Express App Setup ---
const app = express();

// 1. Secure Headers
app.use(helmet({
    contentSecurityPolicy: false, // Netlify handles CSP via _headers usually, avoiding conflicts
}));

// 2. CORS (Strict)
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://chic-choux-ccbf20h.netlify.app' 
        : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// 3. Rate Limiting (DDOS Protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { message: "Too many requests, please try again later." }
});
app.use(limiter);

// 4. Data Sanitization & Pollution Protection
app.use(express.json({ limit: '10kb' })); // Body limit
// app.use(xss()); // REMOVED
app.use(hpp()); // Prevent HTTP Parameter Pollution

// --- Helper Functions ---
const generateRefreshToken = async (userId) => {
    const refreshToken = require('crypto').randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: userId,
            expiresAt: expiresAt
        }
    });
    return refreshToken;
};

// --- Middleware ---
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
      });

      if (!user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};


// --- API Routes ---
const usersRouter = express.Router();
const subjectsRouter = express.Router();
const todosRouter = express.Router();
const cgpaRouter = express.Router();
const historyRouter = express.Router();

// --- History Routes (AttendanceLog) ---
historyRouter.get('/', protect, async (req, res) => {
    try {
        // Convert BigInt to String for JSON serialization
        const logs = await prisma.attendanceLog.findMany({
            where: { userId: req.user.id },
            orderBy: { timestamp: 'desc' },
            take: 100 
        });
        const serialized = logs.map(log => ({
            ...log,
            timestamp: log.timestamp.toString()
        }));
        res.json(serialized);
    } catch (error) {
        console.error("GET history error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

historyRouter.post('/', protect, async (req, res) => {
    const { subjectId, type, timestamp } = req.body;
    try {
        const log = await prisma.attendanceLog.create({
            data: {
                userId: req.user.id,
                subjectId,
                type,
                timestamp: BigInt(timestamp)
            }
        });
        res.status(201).json({ ...log, timestamp: log.timestamp.toString() });
    } catch (error) {
        console.error("POST history error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- CGPA Routes (AcademicRecord) ---
cgpaRouter.get('/', protect, async (req, res) => {
    try {
        const records = await prisma.academicRecord.findMany({
            where: { userId: req.user.id },
            orderBy: { id: 'asc' }
        });
        res.json(records);
    } catch (error) {
        console.error("GET cgpa error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

cgpaRouter.post('/', protect, async (req, res) => {
    const { records } = req.body; // Expecting array of { name, credits, sgpa }
    if (!Array.isArray(records)) return res.status(400).json({ message: "Invalid data format" });

    try {
        // Transaction: Delete old records, insert new ones (Full Sync)
        await prisma.$transaction([
            prisma.academicRecord.deleteMany({ where: { userId: req.user.id } }),
            prisma.academicRecord.createMany({
                data: records.map(r => ({
                    userId: req.user.id,
                    semester: r.name,
                    credits: r.credits,
                    sgpa: r.sgpa
                }))
            })
        ]);
        res.json({ message: "CGPA data synced" });
    } catch (error) {
        console.error("POST cgpa error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Todo Routes ---
todosRouter.get('/', protect, async (req, res) => {
    console.log(`GET /api/todos - User: ${req.user.id}`);
    try {
        const todos = await prisma.todo.findMany({ 
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(todos);
    } catch (error) {
        console.error("GET /api/todos error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

todosRouter.post('/', protect, async (req, res) => {
    const { text, priority } = req.body;
    console.log(`POST /api/todos - User: ${req.user.id}, Text: ${text}`);
    try {
        const todo = await prisma.todo.create({
            data: {
                text,
                priority: priority || 'MEDIUM',
                userId: req.user.id
            }
        });
        res.status(201).json(todo);
    } catch (error) {
        console.error("POST /api/todos error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

todosRouter.put('/:id', protect, async (req, res) => {
    const { text, completed, priority } = req.body;
    const id = parseInt(req.params.id, 10);
    try {
        const todo = await prisma.todo.findUnique({ where: { id } });
        if (!todo || todo.userId !== req.user.id) return res.status(404).json({ message: 'Todo not found' });

        const updated = await prisma.todo.update({
            where: { id },
            data: { text, completed, priority }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

todosRouter.delete('/:id', protect, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const todo = await prisma.todo.findUnique({ where: { id } });
        if (!todo || todo.userId !== req.user.id) return res.status(404).json({ message: 'Todo not found' });

        await prisma.todo.delete({ where: { id } });
        res.json({ message: 'Todo deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- User Routes ---

usersRouter.post('/google-login', async (req, res) => {
    const { token: idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Token required" });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload['email'];
        const name = payload['name'];

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // New user - return info for frontend to complete registration
            return res.status(200).json({ 
                isNewUser: true,
                email: email,
                name: name,
                message: "Onboarding required" 
            });
        }

        // Existing user - login
        if (user.status === 'PENDING') return res.status(403).json({ message: 'Access Denied. Pending approval.' });

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = await generateRefreshToken(user.id);

        res.json({ 
            isNewUser: false,
            token, 
            refreshToken, 
            username: user.username, 
            role: user.role, 
            email: user.email,
            status: user.status 
        });

    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(400).json({ message: "Invalid Google Token" });
    }
});

usersRouter.post('/google-register', async (req, res) => {
    const { token: idToken, role, rollNumber, username } = req.body;
    if (!idToken || !role || !username) return res.status(400).json({ message: "Missing fields" });

    try {
        const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const email = payload['email'];

        // Final check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: "User already exists" });

        const userRole = 'STUDENT';
        let userStatus = 'ACTIVE';
        let userSection = null;
        let finalRollNumber = null;

        if (!rollNumber) return res.status(400).json({ message: "Roll number required" });
        finalRollNumber = parseInt(rollNumber, 10);
        userSection = Math.ceil(finalRollNumber / 60);

        // Check roll number uniqueness
        const rollCheck = await prisma.user.findUnique({ where: { rollNumber: finalRollNumber } });
        if (rollCheck) return res.status(409).json({ message: "Roll Number already registered." });

        const newUser = await prisma.user.create({
            data: {
                username: username,
                email,
                password: 'GOOGLE_AUTH_EXTERNAL_' + Math.random().toString(36).slice(-8), 
                role: userRole,
                status: userStatus,
                rollNumber: finalRollNumber,
                section: userSection,
                isEmailVerified: true
            }
        });

        const token = jwt.sign({ userId: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = await generateRefreshToken(newUser.id);

        res.status(201).json({ 
            message: "Registration successful", 
            token, 
            refreshToken, 
            username: newUser.username, 
            role: newUser.role,
            email: newUser.email,
            status: userStatus
        });

    } catch (error) {
        console.error("Google Register Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

usersRouter.post('/link-google', protect, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,  
        });
        const payload = ticket.getPayload();
        const googleEmail = payload['email'];

        // Check if this email is already used by ANOTHER user
        const existingUser = await prisma.user.findUnique({
            where: { email: googleEmail }
        });

        if (existingUser && existingUser.id !== req.user.id) {
            return res.status(409).json({ message: "This Google email is already linked to another account." });
        }

        // Update current user
        await prisma.user.update({
            where: { id: req.user.id },
            data: { email: googleEmail, isEmailVerified: true }
        });

        res.json({ message: "Google Account linked successfully!", email: googleEmail });

    } catch (error) {
        console.error("Google Link Error:", error);
        res.status(400).json({ message: "Invalid Google Token" });
    }
});

usersRouter.post('/register', async (req, res) => {
    const { username, password, rollNumber, role, email } = req.body; 

    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, password, and email are required.' });
    }

    const userRole = 'STUDENT';
    let userStatus = 'ACTIVE'; 
    
    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll Number is required.' });
    }
    const userRollNumber = parseInt(rollNumber, 10);
    const userSection = Math.ceil(userRollNumber / 60);

    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Username or Email already exists.' });
        }

        const existingRoll = await prisma.user.findUnique({
            where: { rollNumber: userRollNumber },
        });
        if (existingRoll) {
            return res.status(409).json({ message: 'Roll Number already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                email,
                rollNumber: userRollNumber,
                section: userSection,
                role: userRole,
                status: userStatus
            },
        });

        let successMsg = 'User registered successfully.';

        res.status(201).json({ message: successMsg, status: userStatus });

    } catch (error) {
        console.error('Registration error details:', error);
        res.status(500).json({ message: 'Error registering user.', error: error.message });
    }
});

usersRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[LOGIN] Attempt for: ${username}`);

    try {
        console.log(`[LOGIN] Connecting to DB for ${username}...`);
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            console.log(`[LOGIN] User not found: ${username}`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log(`[LOGIN] User found. Status: ${user.status}. Verifying password...`);
        if (user.status === 'PENDING') return res.status(403).json({ message: 'Access Denied. Pending approval.' });
        if (user.status === 'REJECTED') return res.status(403).json({ message: 'Access Denied. Account rejected.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[LOGIN] Password mismatch for ${username}`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log(`[LOGIN] Success. Generating tokens for ${username}...`);
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = await generateRefreshToken(user.id);

        console.log(`[LOGIN] Tokens generated. Sending response.`);
        res.json({ 
            message: 'Login successful.', 
            token, 
            refreshToken,
            username: user.username,
            role: user.role,
            section: user.section,
            email: user.email,
            isEmailVerified: user.isEmailVerified
        });

    } catch (error) {
        console.error('[LOGIN CRITICAL ERROR]', error);
        res.status(500).json({ 
            message: 'Internal Server Error during login.', 
            error: error.message
        });
    }
});

// --- Forgot Password Routes ---

// 1. Request OTP
usersRouter.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.json({ message: "If an account exists with this email, a verification code has been sent." });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // --- SEND ACTUAL EMAIL FIRST ---
        if (EMAIL_USER && EMAIL_PASS) {
            console.log("Attempting to send email...");
            const info = await transporter.sendMail({
                from: `"Attendance App" <${EMAIL_USER}>`,
                to: email,
                subject: 'Your Verification Code',
                text: `Your password reset code is: ${otp}. It is valid for 10 minutes.`,
                html: `<p>Your password reset code is: <strong>${otp}</strong></p><p>It is valid for 10 minutes.</p>`
            });
            console.log(`📧 Email sent to ${email}`);
        } else {
             console.log("⚠️ EMAIL_USER or EMAIL_PASS not set. Showing OTP in console:");
             console.log(`🔐 OTP: ${otp}`);
        }
        
        // Hash OTP before saving
        const otpHash = await bcrypt.hash(otp, 10);

        // Save to DB
        await prisma.user.update({
            where: { id: user.id },
            data: { otp: otpHash, otpExpires }
        });

        res.json({ message: "Verification code sent to your email." });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ 
            message: "Failed to send email.", 
            error: error.message 
        });
    }
});

// 2. Reset Password
usersRouter.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user || !user.otp) {
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: "Verification code has expired." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpires: null
            }
        });

        res.json({ message: "Password reset successful. Please login." });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// 3. Send Verification OTP (Authenticated User)
usersRouter.post('/send-verification-otp', protect, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        // Check if email is already taken by ANOTHER user
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== req.user.id) {
            return res.status(409).json({ message: "Email is already in use by another account." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Send Email FIRST
        if (EMAIL_USER && EMAIL_PASS) {
            await transporter.sendMail({
                from: `"Attendance App" <${EMAIL_USER}>`,
                to: email,
                subject: 'Verify Your Email',
                html: `<p>Your email verification code is: <strong>${otp}</strong></p>`
            });
        } else {
             console.log(`🔐 OTP for ${email}: ${otp}`);
        }

        // Hash OTP
        const otpHash = await bcrypt.hash(otp, 10);

        // Store Hashed OTP
        await prisma.user.update({
            where: { id: req.user.id },
            data: { otp: otpHash, otpExpires }
        });

        res.json({ message: "Verification code sent." });
    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 4. Verify OTP and Update Email
usersRouter.post('/verify-email-otp', protect, async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });

        if (!user || !user.otp) {
            return res.status(400).json({ message: "Invalid code." });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid code." });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: "Code expired." });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { 
                email: email, 
                isEmailVerified: true,
                otp: null, 
                otpExpires: null 
            }
        });

        res.json({ message: "Email verified and updated successfully!", email });
    } catch (error) {
        console.error("Verify Email error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// --- Subject Routes (Student) ---
subjectsRouter.get('/', protect, async (req, res) => {
  console.log(`GET /api/subjects - User: ${req.user.username} (ID: ${req.user.id})`);
  try {
    console.log("Fetching subjects from Prisma...");
    const subjects = await prisma.subject.findMany({ where: { userId: req.user.id } });
    console.log(`Successfully fetched ${subjects.length} subjects.`);
    res.json(subjects);
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

subjectsRouter.post('/', protect, async (req, res) => {
  const { name, totalClasses, attendedClasses, canceledClasses } = req.body;

  try {
    const subject = await prisma.subject.create({
      data: {
        userId: req.user.id,
        name,
        totalClasses: Math.max(0, parseInt(totalClasses || 0)),
        attendedClasses: Math.max(0, parseInt(attendedClasses || 0)),
        canceledClasses: Math.max(0, parseInt(canceledClasses || 0)),
      }
    });
    res.status(201).json(subject);
  } catch (error) {
    console.error("Create subject error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

subjectsRouter.put('/:id', protect, async (req, res) => {
  const { name, totalClasses, attendedClasses, canceledClasses } = req.body;
  const subjectId = parseInt(req.params.id, 10);

  try {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId }});

    if (subject) {
      if (subject.userId !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      const updatedSubject = await prisma.subject.update({
          where: { id: subjectId },
          data: {
              name,
              totalClasses: Math.max(0, parseInt(totalClasses || 0)),
              attendedClasses: Math.max(0, parseInt(attendedClasses || 0)),
              canceledClasses: Math.max(0, parseInt(canceledClasses || 0)),
          }
      });
      res.json(updatedSubject);
    } else {
      res.status(404).json({ message: 'Subject not found' });
    }
  } catch (error) {
    console.error("Update subject error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

subjectsRouter.delete('/:id', protect, async (req, res) => {
  const subjectId = parseInt(req.params.id, 10);
  try {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId }});

    if (subject) {
      if (subject.userId !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      await prisma.subject.delete({ where: { id: subjectId }});
      res.json({ message: 'Subject removed' });
    } else {
      res.status(404).json({ message: 'Subject not found' });
    }
  } catch (error) {
    console.error("Delete subject error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});




usersRouter.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token is required" });

    try {
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true }
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            if (storedToken) await prisma.refreshToken.delete({ where: { id: storedToken.id } });
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        // Generate new Access Token
        const accessToken = jwt.sign(
            { userId: storedToken.user.id, username: storedToken.user.username },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Optional: Rotate refresh token
        const newRefreshToken = await generateRefreshToken(storedToken.user.id);
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });

        res.json({ accessToken, refreshToken: newRefreshToken });

    } catch (error) {
        console.error("Refresh error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

usersRouter.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        try {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        } catch (e) {}
    }
    res.json({ message: "Logged out successfully" });
});

app.use('/api/users', usersRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/cgpa', cgpaRouter);
app.use('/api/history', historyRouter);


// --- Netlify Function Handler ---
const serverlessHandler = serverless(app);

exports.handler = async (event, context) => {
  console.log("--- API Function Invoked ---");
  console.log("Path:", event.path);
  console.log("Method:", event.httpMethod);
  
  if (!DATABASE_URL) {
    console.error("CRITICAL ERROR: DATABASE_URL is not defined in environment variables.");
  }
  if (!JWT_SECRET) {
    console.error("CRITICAL ERROR: JWT_SECRET is not defined in environment variables.");
  }

  try {
    return await serverlessHandler(event, context);
  } catch (error) {
    console.error("TOP-LEVEL FUNCTION ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
};