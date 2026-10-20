const express = require('express');
const router = express.Router();
const pool = require('../config');
const { body, validationResult } = require('express-validator');

// Submit investment opportunity (confidential)
router.post('/', [
  body('title').notEmpty().trim(),
  body('location').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('opportunityType').notEmpty(),
  body('submitterName').notEmpty().trim(),
  body('submitterEmail').isEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      title,
      location,
      description,
      opportunityType,
      expectedReturn,
      investmentAmount,
      submitterName,
      submitterEmail,
      submitterPhone
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO investment_opportunities
       (title, location, description, opportunity_type, expected_return, investment_amount,
        submitter_name, submitter_email, submitter_phone, status, confidential)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, title, status, created_at`,
      [title, location, description, opportunityType, expectedReturn, investmentAmount,
       submitterName, submitterEmail, submitterPhone, 'new', true]
    );
    
    res.status(201).json({
      message: 'Investment opportunity submitted confidentially. Our team will review it.',
      opportunity: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit investment opportunity' });
  }
});

module.exports = router;
