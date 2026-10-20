-- ============================================================
-- MERD LANDMARK PROPERTIES LTD
-- PostgreSQL Database Schema
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- ADMINS
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  property_type VARCHAR(100) NOT NULL,
  size DECIMAL(10, 2),
  description TEXT,
  status VARCHAR(50) DEFAULT 'published',
  documentation_status VARCHAR(100),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- PROPERTY IMAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- PROPERTY VIDEOS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_videos (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  video_url VARCHAR(500) NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- PROPERTY SUBMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_submissions (
  id SERIAL PRIMARY KEY,

  -- Property information
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  asking_price DECIMAL(15, 2) NOT NULL,
  property_type VARCHAR(100) NOT NULL,
  size DECIMAL(10, 2),
  description TEXT,
  key_features TEXT,

  -- Documentation
  documentation_status VARCHAR(100),
  documentation_details TEXT,

  -- Submitter information
  submitter_name VARCHAR(255) NOT NULL,
  submitter_phone VARCHAR(20) NOT NULL,
  submitter_email VARCHAR(255) NOT NULL,
  submitter_role VARCHAR(100),
  company_name VARCHAR(255),

  -- Commercial arrangement
  expected_commission DECIMAL(5, 2),
  referral_arrangement TEXT,

  -- Review workflow
  status VARCHAR(50) DEFAULT 'pending',
  review_notes TEXT,
  converted_property_id INT REFERENCES properties(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- SUBMISSION ATTACHMENTS
-- Supports photos, videos and documents
-- ============================================================

CREATE TABLE IF NOT EXISTS submission_attachments (
  id SERIAL PRIMARY KEY,

  submission_id INT
    REFERENCES property_submissions(id)
    ON DELETE CASCADE,

  file_url VARCHAR(1000) NOT NULL,

  file_type VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- BUYERS
-- ============================================================

CREATE TABLE IF NOT EXISTS buyers (
  id SERIAL PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,

  preferred_locations TEXT,
  budget DECIMAL(15, 2),
  purchase_purpose VARCHAR(255),
  timeline VARCHAR(100),
  financing_status VARCHAR(100),
  preferred_property_type VARCHAR(255),

  status VARCHAR(50) DEFAULT 'new',

  internal_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- INVESTMENT OPPORTUNITIES
-- CONFIDENTIAL
-- ============================================================

CREATE TABLE IF NOT EXISTS investment_opportunities (
  id SERIAL PRIMARY KEY,

  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  opportunity_type VARCHAR(100),

  expected_return DECIMAL(5, 2),
  investment_amount DECIMAL(15, 2),

  status VARCHAR(50) DEFAULT 'new',

  confidential BOOLEAN DEFAULT TRUE,

  submitter_name VARCHAR(255),
  submitter_email VARCHAR(255),
  submitter_phone VARCHAR(20),

  internal_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- PROPERTY MATCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS property_matches (
  id SERIAL PRIMARY KEY,

  buyer_id INT
    REFERENCES buyers(id)
    ON DELETE CASCADE,

  property_id INT
    REFERENCES properties(id)
    ON DELETE CASCADE,

  match_score DECIMAL(5, 2),

  status VARCHAR(50) DEFAULT 'potential',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- ENQUIRIES / CONTACT REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),

  subject VARCHAR(255),
  message TEXT NOT NULL,

  enquiry_type VARCHAR(100),

  status VARCHAR(50) DEFAULT 'new',

  internal_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- ACQUISITION REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS acquisition_requests (
  id SERIAL PRIMARY KEY,

  buyer_id INT
    REFERENCES buyers(id)
    ON DELETE SET NULL,

  property_id INT
    REFERENCES properties(id)
    ON DELETE SET NULL,

  request_type VARCHAR(100),

  status VARCHAR(50) DEFAULT 'pending',

  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- INTERNAL NOTES
-- ADMIN USE
-- ============================================================

CREATE TABLE IF NOT EXISTS internal_notes (
  id SERIAL PRIMARY KEY,

  entity_type VARCHAR(100) NOT NULL,

  entity_id INT NOT NULL,

  admin_id INT
    REFERENCES admins(id)
    ON DELETE SET NULL,

  note TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_properties_status
ON properties(status);

CREATE INDEX IF NOT EXISTS idx_properties_type
ON properties(property_type);

CREATE INDEX IF NOT EXISTS idx_properties_location
ON properties(location);

CREATE INDEX IF NOT EXISTS idx_properties_price
ON properties(price);

CREATE INDEX IF NOT EXISTS idx_properties_featured
ON properties(featured);

CREATE INDEX IF NOT EXISTS idx_submissions_status
ON property_submissions(status);

CREATE INDEX IF NOT EXISTS idx_submissions_email
ON property_submissions(submitter_email);

CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission
ON submission_attachments(submission_id);

CREATE INDEX IF NOT EXISTS idx_buyers_email
ON buyers(email);

CREATE INDEX IF NOT EXISTS idx_buyers_status
ON buyers(status);

CREATE INDEX IF NOT EXISTS idx_investments_status
ON investment_opportunities(status);

CREATE INDEX IF NOT EXISTS idx_enquiries_status
ON enquiries(status);

CREATE INDEX IF NOT EXISTS idx_acquisition_requests_status
ON acquisition_requests(status);

CREATE INDEX IF NOT EXISTS idx_acquisition_requests_buyer
ON acquisition_requests(buyer_id);

CREATE INDEX IF NOT EXISTS idx_acquisition_requests_property
ON acquisition_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_property_matches_buyer
ON property_matches(buyer_id);

CREATE INDEX IF NOT EXISTS idx_property_matches_property
ON property_matches(property_id);

CREATE INDEX IF NOT EXISTS idx_internal_notes_entity
ON internal_notes(entity_type, entity_id);


-- ============================================================
-- COMPLETE
-- ============================================================