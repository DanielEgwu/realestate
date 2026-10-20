const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const pool = require('../config');

const {
  validatePropertySubmission,
  handleValidationErrors
} = require('../middleware/validation');

// =====================================================
// FILE UPLOAD CONFIGURATION
// =====================================================

const uploadDirectory = path.join(
  __dirname,
  '../uploads/submissions'
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {

    const extension =
      path.extname(file.originalname);

    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1E9
      )}${extension}`;

    cb(null, uniqueName);
  }

});


// =====================================================
// UPLOAD VALIDATION
// =====================================================

const upload = multer({

  storage,

  limits: {
    fileSize: 100 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const allowedImages = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    const allowedVideos = [
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];

    const allowedDocuments = [
      'application/pdf'
    ];

    const allowedTypes = [
      ...allowedImages,
      ...allowedVideos,
      ...allowedDocuments
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {

      cb(null, true);

    } else {

      cb(
        new Error(
          'Unsupported file type.'
        )
      );

    }

  }

});


// =====================================================
// SUBMIT PROPERTY
// =====================================================

router.post(
  '/',
  upload.fields([
    {
      name: 'propertyPhotos',
      maxCount: 20
    },
    {
      name: 'propertyVideo',
      maxCount: 1
    },
    {
      name: 'propertyDocuments',
      maxCount: 20
    }
  ]),

  validatePropertySubmission,
  handleValidationErrors,

  async (req, res) => {

    const client =
      await pool.connect();

    try {

      await client.query('BEGIN');

      const {
        title,
        location,
        askingPrice,
        propertyType,
        size,
        description,
        keyFeatures,
        documentationStatus,
        documentationDetails,
        submitterName,
        submitterPhone,
        submitterEmail,
        submitterRole,
        companyName,
        expectedCommission,
        referralArrangement
      } = req.body;


      // ===============================================
      // CREATE SUBMISSION
      // ===============================================

      const result =
        await client.query(
          `
          INSERT INTO property_submissions (
            title,
            location,
            asking_price,
            property_type,
            size,
            description,
            key_features,
            documentation_status,
            documentation_details,
            submitter_name,
            submitter_phone,
            submitter_email,
            submitter_role,
            company_name,
            expected_commission,
            referral_arrangement,
            status
          )

          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17
          )

          RETURNING *
          `,
          [
            title,
            location,
            askingPrice,
            propertyType,
            size || null,
            description || null,
            keyFeatures || null,
            documentationStatus || null,
            documentationDetails || null,
            submitterName,
            submitterPhone,
            submitterEmail,
            submitterRole || null,
            companyName || null,
            expectedCommission || null,
            referralArrangement || null,
            'pending'
          ]
        );


      const submission =
        result.rows[0];


      // ===============================================
      // COLLECT FILES
      // ===============================================

      const files =
        req.files || {};


      const uploadedFiles = [

        ...(files.propertyPhotos || [])
          .map(file => ({
            file,
            type: 'photo'
          })),

        ...(files.propertyVideo || [])
          .map(file => ({
            file,
            type: 'video'
          })),

        ...(files.propertyDocuments || [])
          .map(file => ({
            file,
            type: 'document'
          }))

      ];


      // ===============================================
      // SAVE ATTACHMENTS
      // ===============================================

      for (
        const item of uploadedFiles
      ) {

        const file =
          item.file;


        /*
         * IMPORTANT:
         *
         * file.path is the physical server path.
         *
         * We DO NOT save that into the database.
         *
         * The frontend needs a browser-accessible URL.
         */

        const fileUrl =
          `/uploads/submissions/${encodeURIComponent(
            file.filename
          )}`;


        await client.query(
          `
          INSERT INTO submission_attachments (
            submission_id,
            file_url,
            file_type
          )

          VALUES (
            $1,
            $2,
            $3
          )
          `,
          [
            submission.id,
            fileUrl,
            item.type
          ]
        );

      }


      // ===============================================
      // COMPLETE TRANSACTION
      // ===============================================

      await client.query(
        'COMMIT'
      );


      res.status(201).json({

        message:
          'Property submission received. Our team will review it shortly.',

        submission

      });


    } catch (err) {

      await client.query(
        'ROLLBACK'
      );

      console.error(
        'Property submission error:',
        err
      );


      /*
       * If the database operation fails after
       * files were uploaded, remove those files
       * so we don't leave orphaned uploads.
       */

      const files =
        req.files || {};

      const uploadedFiles = [

        ...(files.propertyPhotos || []),

        ...(files.propertyVideo || []),

        ...(files.propertyDocuments || [])

      ];


      for (
        const file of uploadedFiles
      ) {

        try {

          if (
            file.path &&
            fs.existsSync(file.path)
          ) {

            fs.unlinkSync(
              file.path
            );

          }

        } catch (
          cleanupError
        ) {

          console.error(
            'File cleanup error:',
            cleanupError
          );

        }

      }


      res.status(500).json({

        error:
          'Failed to submit property'

      });


    } finally {

      client.release();

    }

  }
);


// =====================================================
// GET SUBMISSION BY ID
// =====================================================

router.get(
  '/:id',
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const result =
        await pool.query(
          `
          SELECT
            id,
            title,
            location,
            asking_price,
            property_type,
            size,
            description,
            key_features,
            documentation_status,
            documentation_details,
            status,
            review_notes,
            created_at

          FROM property_submissions

          WHERE id = $1
          `,
          [id]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            'Submission not found'

        });

      }


      const submission =
        result.rows[0];


      // ===============================================
      // GET ATTACHMENTS
      // ===============================================

      const attachmentsResult =
        await pool.query(
          `
          SELECT
            id,
            file_url,
            file_type,
            created_at

          FROM submission_attachments

          WHERE submission_id = $1

          ORDER BY created_at ASC
          `,
          [id]
        );


      submission.attachments =
        attachmentsResult.rows;


      res.json(
        submission
      );


    } catch (err) {

      console.error(
        'Get submission error:',
        err
      );


      res.status(500).json({

        error:
          'Failed to fetch submission'

      });

    }

  }
);


module.exports = router;