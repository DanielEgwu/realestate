const express = require('express');
const router = express.Router();
const pool = require('../config');
const { verifyAdmin } = require('../middleware/auth');


// ======================================================
// DASHBOARD
// ======================================================

router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const [
      properties,
      submissions,
      buyers,
      investments,
      enquiries,
      acquisitions
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM properties WHERE status = 'published'`
      ),

      pool.query(
        `SELECT COUNT(*) FROM property_submissions WHERE status = 'pending'`
      ),

      pool.query(
        `SELECT COUNT(*) FROM buyers`
      ),

      pool.query(
        `SELECT COUNT(*) FROM investment_opportunities
         WHERE status = 'new'`
      ),

      pool.query(
        `SELECT COUNT(*) FROM enquiries
         WHERE status = 'new'`
      ),

      pool.query(
        `SELECT COUNT(*) FROM acquisition_requests
         WHERE status = 'pending'`
      )
    ]);

    res.json({
      publishedProperties: Number(properties.rows[0].count),
      pendingSubmissions: Number(submissions.rows[0].count),
      totalBuyers: Number(buyers.rows[0].count),
      newInvestments: Number(investments.rows[0].count),
      newEnquiries: Number(enquiries.rows[0].count),
      pendingAcquisitions: Number(acquisitions.rows[0].count)
    });

  } catch (err) {
    console.error('Dashboard error:', err);

    res.status(500).json({
      error: 'Failed to fetch dashboard statistics'
    });
  }
});


// ======================================================
// PROPERTY SUBMISSIONS
// ======================================================

router.get('/submissions', verifyAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const result = await pool.query(
      `
      SELECT
        ps.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sa.id,
              'file_url', sa.file_url,
              'file_type', sa.file_type,
              'created_at', sa.created_at
            )
            ORDER BY sa.created_at ASC
          ) FILTER (WHERE sa.id IS NOT NULL),
          '[]'
        ) AS attachments
      FROM property_submissions ps
      LEFT JOIN submission_attachments sa
        ON sa.submission_id = ps.id
      WHERE ps.status = $1
      GROUP BY ps.id
      ORDER BY ps.created_at DESC
      `,
      [status]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Get submissions error:', err);

    res.status(500).json({
      error: 'Failed to fetch submissions'
    });
  }
});


router.patch('/submissions/:id', verifyAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be approved or rejected'
      });
    }

    await client.query('BEGIN');

    const submissionResult = await client.query(
      `
      SELECT *
      FROM property_submissions
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (submissionResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    const submission = submissionResult.rows[0];

// A submission can only be reviewed once while pending.
if (submission.status !== 'pending') {
  await client.query('ROLLBACK');

  return res.status(409).json({
    error: `Submission has already been ${submission.status}`,
    submissionId: submission.id,
    currentStatus: submission.status
  });
}

    // Reject
    if (status === 'rejected') {
      const result = await client.query(
        `
        UPDATE property_submissions
        SET
          status = 'rejected',
          review_notes = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [reviewNotes || null, id]
      );

      await client.query('COMMIT');

      return res.json({
        message: 'Submission rejected',
        submission: result.rows[0]
      });
    }

    // Prevent duplicate conversion
    if (submission.converted_property_id) {
      await client.query('ROLLBACK');

      return res.status(409).json({
        error: 'Submission has already been converted',
        propertyId: submission.converted_property_id
      });
    }

    // Create property
    const propertyResult = await client.query(
      `
      INSERT INTO properties (
        title,
        location,
        price,
        property_type,
        size,
        description,
        status,
        documentation_status,
        featured
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'published',
        $7,
        FALSE
      )
      RETURNING *
      `,
      [
        submission.title,
        submission.location,
        submission.asking_price,
        submission.property_type,
        submission.size || null,
        submission.description || null,
        submission.documentation_status || null
      ]
    );

    const property = propertyResult.rows[0];

    // Get attachments
    const attachmentsResult = await client.query(
      `
      SELECT *
      FROM submission_attachments
      WHERE submission_id = $1
      ORDER BY id ASC
      `,
      [id]
    );

    const attachments = attachmentsResult.rows;

    // Transfer photos
    let displayOrder = 0;

    for (const attachment of attachments) {
      if (attachment.file_type !== 'photo') continue;

      await client.query(
        `
        INSERT INTO property_images (
          property_id,
          image_url,
          caption,
          display_order
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          property.id,
          attachment.file_url,
          null,
          displayOrder
        ]
      );

      displayOrder++;
    }

    // Transfer videos
    for (const attachment of attachments) {
      if (attachment.file_type !== 'video') continue;

      await client.query(
        `
        INSERT INTO property_videos (
          property_id,
          video_url,
          title
        )
        VALUES ($1, $2, $3)
        `,
        [
          property.id,
          attachment.file_url,
          submission.title
        ]
      );
    }

    // Mark submission approved
    const updatedSubmission = await client.query(
      `
      UPDATE property_submissions
      SET
        status = 'approved',
        review_notes = $1,
        converted_property_id = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
      `,
      [
        reviewNotes || null,
        property.id,
        id
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Submission approved and property created successfully',
      submission: updatedSubmission.rows[0],
      property,
      attachmentsTransferred: attachments.length
    });

  } catch (err) {
    await client.query('ROLLBACK');

    console.error('Submission update error:', err);

    res.status(500).json({
      error: 'Failed to update submission'
    });

  } finally {
    client.release();
  }
});


// ======================================================
// PROPERTIES
// ======================================================

router.get('/properties', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT *
      FROM properties
    `;

    const params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);

  } catch (err) {
    console.error('Admin properties error:', err);

    res.status(500).json({
      error: 'Failed to fetch properties'
    });
  }
});


router.get('/properties/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const propertyResult = await pool.query(
      `SELECT * FROM properties WHERE id = $1`,
      [id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Property not found'
      });
    }

    const property = propertyResult.rows[0];

    const imagesResult = await pool.query(
      `
      SELECT *
      FROM property_images
      WHERE property_id = $1
      ORDER BY display_order ASC
      `,
      [id]
    );

    const videosResult = await pool.query(
      `
      SELECT *
      FROM property_videos
      WHERE property_id = $1
      `,
      [id]
    );

    property.images = imagesResult.rows;
    property.videos = videosResult.rows;

    res.json(property);

  } catch (err) {
    console.error('Admin property details error:', err);

    res.status(500).json({
      error: 'Failed to fetch property'
    });
  }
});


router.patch('/properties/:id', verifyAdmin, async (req, res) => {
  try {
    const {
      title,
      location,
      price,
      propertyType,
      size,
      description,
      documentationStatus,
      featured,
      status
    } = req.body;

    const result = await pool.query(
      `
      UPDATE properties
      SET
        title = COALESCE($1, title),
        location = COALESCE($2, location),
        price = COALESCE($3, price),
        property_type = COALESCE($4, property_type),
        size = COALESCE($5, size),
        description = COALESCE($6, description),
        documentation_status = COALESCE($7, documentation_status),
        featured = COALESCE($8, featured),
        status = COALESCE($9, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
      `,
      [
        title,
        location,
        price,
        propertyType,
        size,
        description,
        documentationStatus,
        featured,
        status,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Property not found'
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Admin property update error:', err);

    res.status(500).json({
      error: 'Failed to update property'
    });
  }
});


router.delete('/properties/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM properties
      WHERE id = $1
      RETURNING id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Property not found'
      });
    }

    res.json({
      message: 'Property deleted successfully'
    });

  } catch (err) {
    console.error('Admin property delete error:', err);

    res.status(500).json({
      error: 'Failed to delete property'
    });
  }
});


// ======================================================
// BUYERS
// ======================================================

router.get('/buyers', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM buyers
      ORDER BY created_at DESC
      `
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Admin buyers error:', err);

    res.status(500).json({
      error: 'Failed to fetch buyers'
    });
  }
});


router.get('/buyers/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM buyers WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Buyer not found'
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Admin buyer details error:', err);

    res.status(500).json({
      error: 'Failed to fetch buyer'
    });
  }
});


router.patch('/buyers/:id', verifyAdmin, async (req, res) => {
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
      preferredPropertyType,
      status,
      internalNotes
    } = req.body;

    const result = await pool.query(
      `
      UPDATE buyers
      SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        preferred_locations = COALESCE($4, preferred_locations),
        budget = COALESCE($5, budget),
        purchase_purpose = COALESCE($6, purchase_purpose),
        timeline = COALESCE($7, timeline),
        financing_status = COALESCE($8, financing_status),
        preferred_property_type =
          COALESCE($9, preferred_property_type),
        status = COALESCE($10, status),
        internal_notes = COALESCE($11, internal_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
      `,
      [
        name,
        phone,
        email,
        preferredLocations,
        budget,
        purchasePurpose,
        timeline,
        financingStatus,
        preferredPropertyType,
        status,
        internalNotes,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Buyer not found'
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Admin buyer update error:', err);

    res.status(500).json({
      error: 'Failed to update buyer'
    });
  }
});


router.delete('/buyers/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM buyers
      WHERE id = $1
      RETURNING id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Buyer not found'
      });
    }

    res.json({
      message: 'Buyer deleted successfully'
    });

  } catch (err) {
    console.error('Admin buyer delete error:', err);

    res.status(500).json({
      error: 'Failed to delete buyer'
    });
  }
});


// ======================================================
// ENQUIRIES
// ======================================================

router.get('/enquiries', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT *
      FROM enquiries
    `;

    const params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);

  } catch (err) {
    console.error('Admin enquiries error:', err);

    res.status(500).json({
      error: 'Failed to fetch enquiries'
    });
  }
});


router.patch('/enquiries/:id', verifyAdmin, async (req, res) => {
  try {
    const {
      status,
      internalNotes
    } = req.body;

    const result = await pool.query(
      `
      UPDATE enquiries
      SET
        status = COALESCE($1, status),
        internal_notes = COALESCE($2, internal_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
      `,
      [
        status,
        internalNotes,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Enquiry not found'
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Admin enquiry update error:', err);

    res.status(500).json({
      error: 'Failed to update enquiry'
    });
  }
});


router.delete('/enquiries/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM enquiries
      WHERE id = $1
      RETURNING id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Enquiry not found'
      });
    }

    res.json({
      message: 'Enquiry deleted successfully'
    });

  } catch (err) {
    console.error('Admin enquiry delete error:', err);

    res.status(500).json({
      error: 'Failed to delete enquiry'
    });
  }
});


// ======================================================
// INVESTMENTS
// ======================================================

router.get('/investments', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT *
      FROM investment_opportunities
    `;

    const params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);

  } catch (err) {
    console.error('Admin investments error:', err);

    res.status(500).json({
      error: 'Failed to fetch investment opportunities'
    });
  }
});


router.patch('/investments/:id', verifyAdmin, async (req, res) => {
  try {
    const {
      status,
      internalNotes
    } = req.body;

    const result = await pool.query(
      `
      UPDATE investment_opportunities
      SET
        status = COALESCE($1, status),
        internal_notes = COALESCE($2, internal_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
      `,
      [
        status,
        internalNotes,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Investment opportunity not found'
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Admin investment update error:', err);

    res.status(500).json({
      error: 'Failed to update investment opportunity'
    });
  }
});


router.delete('/investments/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM investment_opportunities
      WHERE id = $1
      RETURNING id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Investment opportunity not found'
      });
    }

    res.json({
      message:
        'Investment opportunity deleted successfully'
    });

  } catch (err) {
    console.error('Admin investment delete error:', err);

    res.status(500).json({
      error:
        'Failed to delete investment opportunity'
    });
  }
});


// ======================================================
// ACQUISITION REQUESTS
// ======================================================

router.get(
  '/acquisition-requests',
  verifyAdmin,
  async (req, res) => {
    try {
      const { status } = req.query;

      let query = `
        SELECT
          ar.*,
          b.name AS buyer_name,
          b.email AS buyer_email,
          b.phone AS buyer_phone,
          p.title AS property_title,
          p.location AS property_location
        FROM acquisition_requests ar
        LEFT JOIN buyers b
          ON ar.buyer_id = b.id
        LEFT JOIN properties p
          ON ar.property_id = p.id
      `;

      const params = [];

      if (status) {
        query += ` WHERE ar.status = $1`;
        params.push(status);
      }

      query += ` ORDER BY ar.created_at DESC`;

      const result = await pool.query(
        query,
        params
      );

      res.json(result.rows);

    } catch (err) {
      console.error(
        'Admin acquisition requests error:',
        err
      );

      res.status(500).json({
        error:
          'Failed to fetch acquisition requests'
      });
    }
  }
);


router.patch(
  '/acquisition-requests/:id',
  verifyAdmin,
  async (req, res) => {
    try {
      const {
        status,
        notes
      } = req.body;

      const allowedStatuses = [
        'pending',
        'reviewing',
        'approved',
        'rejected',
        'completed'
      ];

      if (
        status &&
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          error: 'Invalid acquisition request status'
        });
      }

      const result = await pool.query(
        `
        UPDATE acquisition_requests
        SET
          status = COALESCE($1, status),
          notes = COALESCE($2, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
        `,
        [
          status,
          notes,
          req.params.id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error:
            'Acquisition request not found'
        });
      }

      res.json(result.rows[0]);

    } catch (err) {
      console.error(
        'Admin acquisition update error:',
        err
      );

      res.status(500).json({
        error:
          'Failed to update acquisition request'
      });
    }
  }
);


module.exports = router;