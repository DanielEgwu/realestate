const express = require('express');
const router = express.Router();
const pool = require('../config');
const { body, validationResult } = require('express-validator');

// Contact form / enquiry
router.post('/', [
  body('name').notEmpty().trim(),
  body('email').isEmail(),
  body('message').notEmpty().trim().isLength({ min: 10 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, phone, subject, message, enquiryType } = req.body;
    
    const result = await pool.query(
      `INSERT INTO enquiries (name, email, phone, subject, message, enquiry_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, status, created_at`,
      [name, email, phone, subject, message, enquiryType, 'new']
    );
    
    res.status(201).json({
      message: 'Thank you for your enquiry. Our team will contact you shortly.',
      enquiry: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit enquiry' });
  }
});

module.exports = router;
