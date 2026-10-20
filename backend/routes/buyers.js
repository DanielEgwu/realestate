const express = require('express');
const router = express.Router();
const pool = require('../config');
const { validateBuyerRegistration, handleValidationErrors } = require('../middleware/validation');

// Register buyer
router.post('/', validateBuyerRegistration, handleValidationErrors, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      preferredLocations,
      budget,
      purchasePurpose,
      timeline,
      financingStatus,
      preferredPropertyType
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO buyers
       (name, phone, email, preferred_locations, budget, purchase_purpose, timeline, financing_status, preferred_property_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, status, created_at`,
      [name, phone, email, preferredLocations, budget, purchasePurpose, timeline, financingStatus, preferredPropertyType, 'new']
    );
    
    res.status(201).json({
      message: 'Registration successful. Our acquisition team will contact you soon.',
      buyer: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register buyer' });
  }
});

module.exports = router;
