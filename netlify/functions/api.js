// netlify/functions/api.js

require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Environment Variables ---
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

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


// --- API Routes ---
const usersRouter = express.Router();
const subjectsRouter = express.Router();

// --- User Routes ---
usersRouter.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    if (!JWT_SECRET) {
        console.error("JWT_SECRET is not defined.");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        res.status(201).json({ message: 'User registered successfully.' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user.' });
    }
});

usersRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    if (!JWT_SECRET) {
        console.error("JWT_SECRET is not defined.");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ message: 'Login successful.', token, username: user.username });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in.' });
    }
});


// --- Subject Routes ---
subjectsRouter.get('/', protect, async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({ where: { userId: req.user.id } });
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


app.use('/api/users', usersRouter);
app.use('/api/subjects', subjectsRouter);


// --- Netlify Function Handler ---
// This wrapper makes the express app compatible with serverless environments.
exports.handler = serverless(app);
