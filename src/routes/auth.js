import express from 'express';
import { prisma } from '../config/index.js';
import bcrypt from 'bcrypt';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Authentication!');
});

// User Registration 

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, dateOfBirth, country } = req.body;

    // Validate input
    const validatedEmail = validateEmail(email);
    const validatedPassword = validatePassword(password);
    const validatedDisplayName = validateDisplayName(displayName);
    const dob = validateDateOfBirth(dateOfBirth);

    const existingUser = await prisma.account.findFirst({
      where: { email: validatedEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(validatedPassword, 10);

    //creates a database transaction to ensure that both the user and account are created atomically
    //  (either both succeed, or neither does).
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          user_name: validatedDisplayName,
          dob,
          country
        }
      });

      const account = await tx.account.create({
        data: {
          user_id: user.user_id,
          email: validatedEmail,
          pass: hashedPassword,
          role: 'user'
        }
      });

      return { user, account };
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.user.user_id
    });
    //Error Handling
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});

// User Login

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate input
    const validatedEmail = validateEmail(email);
    const validatedPassword = validatePassword(password);

    const account = await prisma.account.findFirst({
      where: { email: validatedEmail },
      include: {
        user: true,
        board: true
      }
    });

    if (!account) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(validatedPassword, account.pass);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const age = account.user.dob ? calculateAge(account.user.dob) : 0;
    const isBoardAdmin = account.board.length > 0;

    const userData = {
      userId: account.user_id,
      email: account.email,
      role: account.role,
      displayName: account.user.user_name,
      age,
      country: account.user.country || '',
      dateJoined: account.user.created_at || new Date(),
      isBoardAdmin
    };

    //authenticating
    const token = generateToken(userData);

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });

    // Error Handling
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});

//Master User Login 

router.post('/master/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate input
    const validatedEmail = validateEmail(email);
    const validatedPassword = validatePassword(password);

    // Check if the email matches the master email
    if (validatedEmail !== process.env.MASTER_EMAIL) {
      return res.status(401).json({ error: 'Invalid master credentials' });
    }

    const account = await prisma.account.findFirst({
      where: { 
        email: validatedEmail,
        role: 'admin'  // Master user has admin role
      },
      include: {
        user: true
      }
    });

    if (!account) {
      return res.status(401).json({ error: 'Invalid master credentials' });
    }

    const isValidPassword = await bcrypt.compare(validatedPassword, account.pass);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid master credentials' });
    }

    const userData = {
      userId: account.user_id,
      email: account.email,
      role: 'admin',  // Return admin role
      displayName: account.user.user_name
    };

    const token = generateToken(userData);

    res.json({
      message: 'Master login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Master login error:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});


export default router;