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
app.use(express.json());

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

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'COORDINATOR' && req.user.status === 'ACTIVE') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as active coordinator' });
    }
};


// --- API Routes ---
const usersRouter = express.Router();
const subjectsRouter = express.Router();
const coordinatorRouter = express.Router();

// --- User Routes ---
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

    // Role & Status Logic
    const userRole = role === 'COORDINATOR' ? 'COORDINATOR' : 'STUDENT';
    let userStatus = 'ACTIVE'; 
    
    let userSection = null;
    let userRollNumber = null;

    if (userRole === 'STUDENT') {
        if (!rollNumber) {
            return res.status(400).json({ message: 'Roll Number is required for students.' });
        }
        userRollNumber = parseInt(rollNumber, 10);
        userSection = Math.ceil(userRollNumber / 60);
    } else {
        // COORDINATOR Logic
        try {
            const existingAdminCount = await prisma.user.count({
                where: { 
                    role: 'COORDINATOR',
                    status: 'ACTIVE'
                }
            });
            if (existingAdminCount > 0) userStatus = 'PENDING';
        } catch (err) { userStatus = 'PENDING'; }
    }

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

        if (userRole === 'STUDENT') {
             const existingRoll = await prisma.user.findUnique({
                where: { rollNumber: userRollNumber },
            });
            if (existingRoll) {
                return res.status(409).json({ message: 'Roll Number already registered.' });
            }
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
        if (userStatus === 'PENDING') {
            successMsg = 'Registration submitted. Please wait for an existing Coordinator to approve your access.';
        }

        res.status(201).json({ message: successMsg, status: userStatus });

    } catch (error) {
        console.error('Registration error details:', error);
        res.status(500).json({ message: 'Error registering user.', error: error.message });
    }
});

usersRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (user.status === 'PENDING') return res.status(403).json({ message: 'Access Denied. Pending approval.' });
        if (user.status === 'REJECTED') return res.status(403).json({ message: 'Access Denied. Account rejected.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ 
            message: 'Login successful.', 
            token, 
            username: user.username,
            role: user.role,
            section: user.section,
            email: user.email,
            isEmailVerified: user.isEmailVerified
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Error logging in.', 
            error: error.message,
            stack: error.stack 
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

        // Save to DB
        await prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpires }
        });

        // --- SEND ACTUAL EMAIL ---
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
            console.log(`Message ID: ${info.messageId}`);
            console.log(`Response: ${info.response}`);
        } else {
             console.log("⚠️ EMAIL_USER or EMAIL_PASS not set. Showing OTP in console:");
             console.log(`🔐 OTP: ${otp}`);
        }
        // -----------------------

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
        
        if (!user || user.otp !== otp) {
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

        // Store OTP temporarily in the user record (even though email isn't updated yet)
        // Ideally we'd have a separate 'pendingEmail' field, but for simplicity we'll verify against the OTP
        // and client must send the email again to confirm.
        await prisma.user.update({
            where: { id: req.user.id },
            data: { otp, otpExpires }
        });

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

        if (!user || user.otp !== otp) {
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
        totalClasses,
        attendedClasses,
        canceledClasses,
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
              totalClasses,
              attendedClasses,
              canceledClasses
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

// --- Coordinator Routes ---

// Get pending approvals
coordinatorRouter.get('/pending', protect, admin, async (req, res) => {
    try {
        const pendingUsers = await prisma.user.findMany({
            where: {
                role: 'COORDINATOR',
                status: 'PENDING'
            },
            select: {
                id: true,
                username: true,
                createdAt: true
            }
        });
        res.json(pendingUsers);
    } catch (error) {
        console.error("Get pending error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Review (Approve/Reject)
coordinatorRouter.post('/review', protect, admin, async (req, res) => {
    const { userId, action } = req.body; // action: 'APPROVE' or 'DENY'
    
    if (!userId || !action) return res.status(400).json({ message: "Missing fields" });

    try {
        if (action === 'APPROVE') {
            await prisma.user.update({
                where: { id: userId },
                data: { status: 'ACTIVE' }
            });
            res.json({ message: "User approved successfully" });
        } else if (action === 'DENY') {
            await prisma.user.delete({
                where: { id: userId }
            });
            res.json({ message: "User request denied and removed" });
        } else {
            res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        console.error("Review error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get list of unique sections
coordinatorRouter.get('/sections', protect, admin, async (req, res) => {
    try {
        const result = await prisma.user.groupBy({
            by: ['section'],
            where: {
                role: 'STUDENT',
                section: { not: null }
            },
            orderBy: { section: 'asc' }
        });
        const sections = result.map(r => r.section);
        res.json(sections);
    } catch (error) {
        console.error("Get sections error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get students in a section with calculated attendance
coordinatorRouter.get('/section/:id', protect, admin, async (req, res) => {
    const sectionId = parseInt(req.params.id, 10);
    try {
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                section: sectionId
            },
            include: {
                subjects: true
            },
            orderBy: { rollNumber: 'asc' }
        });

        const studentsWithStats = students.map(student => {
            let totalAttended = 0;
            let totalEffective = 0;

            student.subjects.forEach(sub => {
                totalAttended += sub.attendedClasses;
                totalEffective += (sub.totalClasses - sub.canceledClasses);
            });

            const percentage = totalEffective > 0 
                ? ((totalAttended / totalEffective) * 100).toFixed(2) 
                : 0;

            return {
                id: student.id,
                username: student.username,
                rollNumber: student.rollNumber,
                percentage: parseFloat(percentage),
                subjects: student.subjects.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    attended: sub.attendedClasses,
                    total: sub.totalClasses,
                    canceled: sub.canceledClasses,
                    percentage: (sub.totalClasses - sub.canceledClasses) > 0 
                        ? ((sub.attendedClasses / (sub.totalClasses - sub.canceledClasses)) * 100).toFixed(1)
                        : 0
                }))
            };
        });

        res.json(studentsWithStats);

    } catch (error) {
        console.error("Get section details error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.use('/api/users', usersRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/coordinator', coordinatorRouter);


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