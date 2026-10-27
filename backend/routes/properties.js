const express = require('express');
const router = express.Router();
const pool = require('../config');

// =====================================================
// GET ALL PUBLISHED PROPERTIES
// =====================================================

router.get('/', async (req, res) => {
  try {
    const {
      type,
      location,
      minPrice,
      maxPrice,
      search
    } = req.query;

    // Safe pagination
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const parsedOffset = Number.parseInt(req.query.offset, 10);

    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 10;

    const offset = Number.isInteger(parsedOffset)
      ? Math.max(parsedOffset, 0)
      : 0;

    // Build property query
    let query = `
      SELECT properties.*,
        (
          SELECT image_url
          FROM property_images
          WHERE property_id = properties.id
          ORDER BY display_order ASC, created_at ASC
          LIMIT 1
        ) AS image_url
      FROM properties
      WHERE status = $1
    `;

    const params = ['published'];
    let paramCount = 2;

    // Property type
    if (type) {
      query += ` AND property_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    // Location
    if (location) {
      query += ` AND location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
      paramCount++;
    }

    // Minimum price
    if (minPrice) {
      query += ` AND price >= $${paramCount}`;
      params.push(minPrice);
      paramCount++;
    }

    // Maximum price
    if (maxPrice) {
      query += ` AND price <= $${paramCount}`;
      params.push(maxPrice);
      paramCount++;
    }

    // Search
    if (search) {
      query += `
        AND (
          title ILIKE $${paramCount}
          OR description ILIKE $${paramCount}
          OR location ILIKE $${paramCount}
        )
      `;

      params.push(`%${search}%`);
      paramCount++;
    }

    // Pagination
    query += `
      ORDER BY created_at DESC
      LIMIT $${paramCount}
      OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    // Get properties
    const result = await pool.query(query, params);

    // Build matching count query
    let countQuery = `
      SELECT COUNT(*)
      FROM properties
      WHERE status = $1
    `;

    const countParams = ['published'];
    let countParamCount = 2;

    if (type) {
      countQuery += ` AND property_type = $${countParamCount}`;
      countParams.push(type);
      countParamCount++;
    }

    if (location) {
      countQuery += ` AND location ILIKE $${countParamCount}`;
      countParams.push(`%${location}%`);
      countParamCount++;
    }

    if (minPrice) {
      countQuery += ` AND price >= $${countParamCount}`;
      countParams.push(minPrice);
      countParamCount++;
    }

    if (maxPrice) {
      countQuery += ` AND price <= $${countParamCount}`;
      countParams.push(maxPrice);
      countParamCount++;
    }

    if (search) {
      countQuery += `
        AND (
          title ILIKE $${countParamCount}
          OR description ILIKE $${countParamCount}
          OR location ILIKE $${countParamCount}
        )
      `;

      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await pool.query(
      countQuery,
      countParams
    );

    res.json({
      properties: result.rows,
      total: parseInt(
        countResult.rows[0].count,
        10
      ),
      limit,
      offset
    });

  } catch (err) {
    console.error('Properties error:', err);

    res.status(500).json({
      error: 'Failed to fetch properties'
    });
  }
});


// =====================================================
// GET FEATURED PROPERTIES
// IMPORTANT: Keep this BEFORE /:id
// =====================================================

router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT properties.*,
        (
          SELECT image_url
          FROM property_images
          WHERE property_id = properties.id
          ORDER BY display_order ASC, created_at ASC
          LIMIT 1
        ) AS image_url
      FROM properties
      WHERE status = $1
        AND featured = $2
      ORDER BY created_at DESC
      LIMIT 6
      `,
      ['published', true]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(
      'Featured properties error:',
      err
    );

    res.status(500).json({
      error: 'Failed to fetch featured properties'
    });
  }
});


// =====================================================
// GET SINGLE PROPERTY
// IMPORTANT: Keep this AFTER /featured
// =====================================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM properties
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Property not found'
      });
    }

    const property = result.rows[0];

    // Get property images
    const imagesResult = await pool.query(
      `
      SELECT *
      FROM property_images
      WHERE property_id = $1
      ORDER BY display_order ASC, created_at ASC
      `,
      [id]
    );

    // Get property videos
    const videosResult = await pool.query(
      `
      SELECT *
      FROM property_videos
      WHERE property_id = $1
      ORDER BY created_at ASC
      `,
      [id]
    );

    property.images = imagesResult.rows;
    property.videos = videosResult.rows;

    res.json(property);

  } catch (err) {
    console.error(
      'Get property error:',
      err
    );

    res.status(500).json({
      error: 'Failed to fetch property'
    });
  }
});


module.exports = router;
