const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const pool = require('./config');

require('dotenv').config();

const app = express();


// =====================================================
// PATHS
// =====================================================

const frontendDirectory = path.join(__dirname, '../frontend'); // Keep this ONLY if server.js is inside the backend folder

const uploadsDirectory = path.join(
  __dirname,
  'uploads/submissions'
);

const publicOrigin = 'https://merdlandmarkproperties.com';
const publicPages = [
  '/',
  '/properties.html',
  '/acquisition.html',
  '/investment.html',
  '/submit-property.html',
  '/buyer-registration.html',
  '/about.html',
  '/contact.html'
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function escapeXml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}

function absoluteAssetUrl(value) {
  if (!value) return `${publicOrigin}/images/property-conversation.jpg`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${publicOrigin}/${String(value).replace(/^\/+/, '')}`;
}

function propertyPath(property) {
  return `/property/${encodeURIComponent(property.id)}`;
}

function renderPropertyPage(template, property) {
  const title = `${property.title} in ${property.location} | MERD Landmark Properties`;
  const description = `${property.property_type} property in ${property.location}, Nigeria. ${property.description || 'View details and contact MERD Landmark Properties for acquisition support.'}`.replace(/\s+/g, ' ').slice(0, 300);
  const canonical = `${publicOrigin}${propertyPath(property)}`;
  const image = absoluteAssetUrl(property.images?.[0]?.image_url);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description,
    image,
    category: property.property_type,
    offers: {
      '@type': 'Offer',
      price: String(property.price),
      priceCurrency: 'NGN',
      availability: 'https://schema.org/InStock',
      url: canonical
    }
  };
  const imageMarkup = property.images?.length
    ? `<div class="property-gallery"><div class="gallery-main"><img src="${escapeHtml(property.images[0].image_url)}" alt="${escapeHtml(property.title)}"></div></div>`
    : '';
  const videoMarkup = property.videos?.length
    ? `<div class="mt-lg"><h2>Property Video</h2><video width="100%" controls style="border-radius: 8px;"><source src="${escapeHtml(property.videos[0].video_url)}" type="video/mp4"></video></div>`
    : '';
  const content = `<div class="breadcrumb mb-lg"><a href="/properties.html">Properties</a><span>/</span><span class="active">${escapeHtml(property.title)}</span></div>${imageMarkup}${videoMarkup}<div class="row-2 mt-xl"><div><h1>${escapeHtml(property.title)}</h1><p class="text-secondary mb-lg">${escapeHtml(property.location)}, Nigeria</p><div class="card mb-lg"><div class="card-body"><p class="text-secondary">Price</p><h2 class="text-primary mb-0">₦${Number(property.price).toLocaleString('en-NG')}</h2></div></div><h2>Property Information</h2><ul><li><strong>Type:</strong> ${escapeHtml(property.property_type)}</li>${property.size ? `<li><strong>Size:</strong> ${escapeHtml(property.size)} sqm</li>` : ''}${property.documentation_status ? `<li><strong>Documentation:</strong> ${escapeHtml(property.documentation_status)}</li>` : ''}</ul></div><div class="card"><div class="card-header">Interested in this property?</div><div class="card-body"><p>Our acquisition team can help you evaluate this opportunity and coordinate next steps.</p><a href="/acquisition.html?propertyId=${encodeURIComponent(property.id)}" class="btn btn-primary">Request Information</a><a href="https://wa.me/2348100650205?text=${encodeURIComponent(`I am interested in: ${property.title}`)}" class="btn btn-gold">WhatsApp Us</a></div></div></div><div class="mt-xl"><h2>Description</h2><p>${escapeHtml(property.description || '')}</p></div>`;

  return template
    .replace(/<!-- SEO_TITLE -->/g, escapeHtml(title))
    .replace(/<!-- SEO_DESCRIPTION -->/g, escapeHtml(description))
    .replace(/<!-- SEO_CANONICAL -->/g, escapeHtml(canonical))
    .replace(/<!-- SEO_IMAGE -->/g, escapeHtml(image))
    .replace(/<!-- SEO_STRUCTURED_DATA -->/g, JSON.stringify(structuredData).replace(/</g, '\\u003c'))
    .replace('<!-- PROPERTY_CONTENT -->', content);
}


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

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${publicOrigin}/sitemap.xml\n`);
});

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, updated_at FROM properties WHERE status = $1 ORDER BY id`,
      ['published']
    );
    const staticEntries = publicPages.map((page) => `<url><loc>${escapeXml(publicOrigin + page)}</loc></url>`);
    const propertyEntries = result.rows.map((property) => {
      const updatedAt = property.updated_at ? new Date(property.updated_at) : null;
      const lastmod = updatedAt && !Number.isNaN(updatedAt.getTime())
        ? `<lastmod>${updatedAt.toISOString()}</lastmod>`
        : '';
      return `<url><loc>${escapeXml(publicOrigin + propertyPath(property))}</loc>${lastmod}</url>`;
    });
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticEntries.concat(propertyEntries).join('')}</urlset>`;
    res.status(200).set('Content-Type', 'application/xml; charset=utf-8').send(sitemap);
  } catch (error) {
    console.error('Sitemap generation failed; serving the static sitemap:', error);
    res.status(200)
      .set('Content-Type', 'application/xml; charset=utf-8')
      .send(fs.readFileSync(path.join(frontendDirectory, 'sitemap.xml')));
  }
});

app.get('/property-details.html', (req, res) => {
  if (!/^\d+$/.test(String(req.query.id || ''))) return res.status(404).send('Property not found');
  res.redirect(301, `/property/${encodeURIComponent(req.query.id)}`);
});

app.get('/property/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).send('Property not found');
    const result = await pool.query(
      `SELECT * FROM properties WHERE id = $1 AND status = $2`,
      [req.params.id, 'published']
    );
    if (!result.rows.length) return res.status(404).send('Property not found');
    const property = result.rows[0];
    const [images, videos] = await Promise.all([
      pool.query('SELECT * FROM property_images WHERE property_id = $1 ORDER BY display_order ASC, created_at ASC', [property.id]),
      pool.query('SELECT * FROM property_videos WHERE property_id = $1 ORDER BY created_at ASC', [property.id])
    ]);
    property.images = images.rows;
    property.videos = videos.rows;
    const template = fs.readFileSync(path.join(frontendDirectory, 'property-details.html'), 'utf8');
    res.type('html').send(renderPropertyPage(template, property));
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  if (/^\/admin-[^/]+\.html$/i.test(req.path)) {
    res.set('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

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

    res.status(404).sendFile(
      path.join(frontendDirectory, '404.html')
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
