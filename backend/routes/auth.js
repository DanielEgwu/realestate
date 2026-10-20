const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const pool = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const result = await pool.query(
      'SELECT u.id, u.email, u.password_hash, u.role FROM users u WHERE u.email = $1 AND u.role = $2',
      [email, 'admin']
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', verifyAdmin, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
