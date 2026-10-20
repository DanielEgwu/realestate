const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config();

const app = express();


// =====================================================
// PATHS
// =====================================================

const frontendDirectory = path.join(
  __dirname,
  '../frontend'
);

const uploadsDirectory = path.join(
  __dirname,
  'uploads/submissions'
);


// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ||
      'http://localhost:3000',

    credentials: true
  })
);


// =====================================================
// RATE LIMITING
// =====================================================

const limiter = rateLimit({
  windowMs:
    parseInt(
      process.env.RATE_LIMIT_WINDOW_MS ||
      '900000',
      10
    ),

  max:
    parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS ||
      '100',
      10
    ),

  standardHeaders: true,
  legacyHeaders: false
});

app.use(
  '/api/',
  limiter
);


// =====================================================
// BODY PARSING
// =====================================================

app.use(
  express.json({
    limit: '2mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb'
  })
);


// =====================================================
// STATIC FRONTEND
// =====================================================

app.use(
  express.static(frontendDirectory)
);


// =====================================================
// PROPERTY SUBMISSION UPLOADS
// =====================================================

app.use(
  '/uploads/submissions',
  express.static(uploadsDirectory)
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });

  }
);


// =====================================================
// API ROUTES
// =====================================================

app.use(
  '/api/auth',
  require('./routes/auth')
);

app.use(
  '/api/properties',
  require('./routes/properties')
);

app.use(
  '/api/submissions',
  require('./routes/submissions')
);

app.use(
  '/api/buyers',
  require('./routes/buyers')
);

app.use(
  '/api/investments',
  require('./routes/investments')
);

app.use(
  '/api/admin',
  require('./routes/admin')
);

app.use(
  '/api/contact',
  require('./routes/contact')
);


// =====================================================
// FRONTEND FALLBACK
// =====================================================

app.get(
  '*',
  (req, res) => {

    // Never return index.html for an API request
    if (
      req.path.startsWith('/api/')
    ) {

      return res.status(404).json({
        error: 'API endpoint not found'
      });

    }

    res.sendFile(
      path.join(
        frontendDirectory,
        'index.html'
      )
    );

  }
);


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {

    console.error(
      'Server error:',
      err
    );

    res.status(
      err.status || 500
    ).json({

      error:
        err.message ||
        'Internal server error'

    });

  }
);


// =====================================================
// START SERVER
// =====================================================

const PORT =
  parseInt(
    process.env.PORT ||
    '3000',
    10
  );


app.listen(
  PORT,
  () => {

    console.log(
      `MERD Landmark Properties server running on port ${PORT}`
    );

    console.log(
      `Environment: ${
        process.env.NODE_ENV ||
        'development'
      }`
    );

  }
);


module.exports = app;