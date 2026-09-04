import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// In-memory user store for demo (no MongoDB dependency for showcase)
const users = [
  {
    id: '1',
    name: 'Logistics Manager',
    email: 'admin@sail.co.in',
    password: '$2a$10$rS5W.nq0Xf5x5x5x5x5x5OYl7YFfvqhqwCPl5x5x5x5x5x5x5x5x', // Will be set below
    role: 'admin',
  },
];

// Pre-hash the default password
(async () => {
  users[0].password = await bcrypt.hash('sail2026', 10);
})();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/register (demo)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'viewer' } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: String(users.length + 1), name, email, password: hashedPassword, role };
    users.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, role: newUser.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
