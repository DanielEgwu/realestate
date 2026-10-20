const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array()
    });
  }

  next();
};

const validatePropertySubmission = [
  body('title')
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 200 }),

  body('location')
    .notEmpty()
    .trim(),

  body('askingPrice')
    .isFloat({ min: 0 }),

  body('propertyType')
    .notEmpty()
    .trim(),

  body('size')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 5000 }),

  body('keyFeatures')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 3000 }),

  body('documentationStatus')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }),

  body('documentationDetails')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 3000 }),

  body('submitterName')
    .notEmpty()
    .trim(),

  body('submitterPhone')
    .notEmpty()
    .trim(),

  body('submitterEmail')
    .isEmail()
    .normalizeEmail(),

  body('submitterRole')
    .optional({ values: 'falsy' })
    .trim(),

  body('companyName')
    .optional({ values: 'falsy' })
    .trim(),

  body('expectedCommission')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 }),

  body('referralArrangement')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 3000 })
];

const validateBuyerRegistration = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ max: 200 }),

  body('phone')
    .notEmpty()
    .trim()
    .isLength({ max: 50 }),

  body('email')
    .isEmail()
    .normalizeEmail(),

  body('preferredLocations')
    .optional({ values: 'falsy' }),

  body('budget')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }),

  body('purchasePurpose')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 }),

  body('timeline')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }),

  body('financingStatus')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }),

  body('preferredPropertyType')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
];

module.exports = {
  validatePropertySubmission,
  validateBuyerRegistration,
  handleValidationErrors
};
