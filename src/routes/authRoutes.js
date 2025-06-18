import express from 'express';
import { prisma } from '../config/index.js';
import bcrypt from 'bcrypt';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken, generateToken , requireRole } from '../middleware/auth.js';
import { validateDisplayName , validateEmail , validatePassword , validateDateOfBirth , calculateAge } from '../validators/authValidator.js';

const router = express.Router();

// Add detailed route logging
router.use((req, res, next) => {
  console.log(`Auth Route: ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Test route
router.get('/', (req, res) => {
  console.log('Root auth route hit');
  res.send('Authentication!');
});

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  console.log('Register route hit');
  try {
    const { email, password, displayName, dateOfBirth, country } = req.body;
    console.log('Registration attempt:', { email, displayName, country });

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

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validatedEmail = validateEmail(email);
    const validatedPassword = validatePassword(password);

    // Check if the user is the master user
    if (validatedEmail === process.env.MASTER_EMAIL) {
      // For master user, compare with plain text password from env
      if (validatedPassword !== process.env.MASTER_PASSWORD) {
        return res.status(401).json({ error: 'Invalid master credentials' });
      }

      // Create master user data without database entry
      const userData = {
        userId: 'master',
        email: validatedEmail,
        role: 'master',
        displayName: 'Master User',
        isBoardAdmin: true
      };

      const token = generateToken(userData);
      return res.json({
        message: 'Master login successful',
        token,
        user: userData
      });
    }

    // For regular users, use database and bcrypt comparison
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

    const token = generateToken(userData);

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message || 'Invalid input data' });
  }
});

/**
 * Get Current User Profile
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { user_id: req.user.userId },
      include: {
        user: true,
        board: true
      }
    });

    if (!account) {
      return res.status(404).json({ error: 'User not found' });
    }

    const age = account.user.dob ? calculateAge(account.user.dob) : 0;
    const isBoardAdmin = account.board.length > 0;

    res.json({
      userId: account.user_id,
      email: account.email,
      role: account.role,
      displayName: account.user.user_name,
      age,
      country: account.user.country || '',
      dateJoined: account.user.created_at || new Date(),
      isBoardAdmin
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Update User Profile
 * PUT /api/auth/me
 */
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { displayName, dateOfBirth, country } = req.body;

    // Validate input
    const validatedDisplayName = displayName ? validateDisplayName(displayName) : undefined;
    const dob = dateOfBirth ? validateDateOfBirth(dateOfBirth) : undefined;

    const account = await prisma.account.findUnique({
      where: { user_id: req.user.userId },
      include: { user: true }
    });

    if (!account) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: account.user_id },
      data: {
        user_name: validatedDisplayName,
        dob,
        country
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: updatedUser.user_id,
        displayName: updatedUser.user_name,
        age: updatedUser.dob ? calculateAge(updatedUser.dob) : 0,
        country: updatedUser.country || ''
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
});


export default router;