# MERD Landmark Properties - Full-Stack Real Estate Acquisition Platform

## Project Overview

MERD Landmark Properties is a comprehensive real estate acquisition platform connecting capital with property opportunities. The platform serves both buyers/investors and property suppliers through a professional, research-driven approach.

## Features

### For Buyers & Investors
- Browse curated property marketplace
- Filter by type, location, price, and other criteria
- Register as buyer to receive matched opportunities
- Request acquisition support
- Access investment analysis and market research

### For Property Suppliers
- Submit properties to reach qualified buyers
- Access buyer network through our platform
- Confidential investment opportunity submission
- Professional transaction coordination

### Admin Features
- Dashboard with key metrics
- Property management and publishing
- Submission review and approval workflow
- Buyer and investment opportunity tracking
- Enquiry management

## Technology Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing, helmet for headers, CORS, rate limiting
- **Validation**: express-validator

### Frontend
- **HTML5** semantic markup
- **CSS3** with custom properties and responsive design
- **JavaScript** (vanilla, no frameworks)
- **Mobile-first responsive design**

## Project Structure

```
merd-landmark-properties-ltd/
├── backend/
│   ├── server.js              # Main server file
│   ├── config.js              # Database configuration
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   └── validation.js      # Request validation
│   └── routes/
│       ├── auth.js            # Authentication routes
│       ├── properties.js       # Property listing routes
│       ├── submissions.js      # Property submission routes
│       ├── buyers.js           # Buyer registration routes
│       ├── investments.js      # Investment opportunity routes
│       ├── contact.js          # Contact/enquiry routes
│       └── admin.js            # Admin management routes
├── database/
│   └── schema.sql             # PostgreSQL schema
├── frontend/
│   ├── index.html             # Homepage
│   ├── properties.html        # Property listing page
│   ├── property-details.html  # Individual property page
│   ├── submit-property.html   # Property submission form
│   ├── buyer-registration.html # Buyer registration
│   ├── investment.html        # Investment opportunity submission
│   ├── contact.html           # Contact form
│   ├── about.html             # About page
│   ├── acquisition.html       # Acquisition services info
│   ├── admin-login.html       # Admin login
│   ├── admin-dashboard.html   # Admin dashboard
│   ├── css/
│   │   ├── variables.css      # CSS custom properties
│   │   ├── base.css           # Base styles
│   │   ├── components.css     # Component styles
│   │   ├── layout.css         # Layout styles
│   │   └── responsive.css     # Responsive breakpoints
│   └── js/
│       ├── api.js             # API client functions
│       ├── utils.js           # Utility functions
│       ├── main.js            # Main app script
│       ├── properties.js       # Properties page logic
│       ├── property-details.js # Property details logic
│       ├── buyer-registration.js
│       ├── property-submission.js
│       └── investment.js
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore file
├── package.json               # NPM dependencies
└── README.md                  # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Backend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

3. **Initialize database**
   ```bash
   psql -U postgres -d template1 -f database/schema.sql
   ```

4. **Start server**
   ```bash
   npm run dev  # development with nodemon
   # or
   npm start    # production
   ```

Server will run on `http://localhost:3000`

### Frontend Setup

1. Frontend files are served statically by the backend
2. Files in `frontend/` are served from the root path
3. Access via `http://localhost:3000`

## Database Schema

The platform includes the following main tables:

- **users** - User accounts and authentication
- **admins** - Admin user profiles
- **properties** - Listed properties
- **property_images** - Property photos
- **property_videos** - Property videos
- **property_submissions** - Property submissions from suppliers
- **submission_attachments** - Attachments to submissions
- **buyers** - Registered buyers/investors
- **investment_opportunities** - Confidential investment opportunities
- **property_matches** - Matching properties to buyers
- **enquiries** - Contact form enquiries
- **acquisition_requests** - Property acquisition requests
- **internal_notes** - Admin notes

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/properties` - List properties with filters
- `GET /api/properties/:id` - Get property details
- `GET /api/properties/featured` - Get featured properties
- `POST /api/submissions` - Submit property
- `GET /api/submissions/:id` - Get submission status
- `POST /api/buyers` - Register as buyer
- `POST /api/investments` - Submit investment opportunity
- `POST /api/contact` - Send contact enquiry

### Admin Endpoints (Protected)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/verify` - Verify token
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/submissions` - List submissions
- `PATCH /api/admin/submissions/:id` - Update submission
- `GET /api/admin/investments` - List investments
- `GET /api/admin/buyers` - List buyers

## Authentication

The platform uses JWT for authentication:
1. Admin login via `/api/auth/login`
2. Token is stored in localStorage
3. Token is sent in `Authorization: Bearer <token>` header
4. Protected routes verify token validity

## Environment Variables

Required `.env` variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=merd_landmark_properties
DB_USER=postgres
DB_PASSWORD=your_password

PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:3000

COMPANY_PHONE_1=+2348100650205
COMPANY_PHONE_2=+2349022245981
COMPANY_EMAIL=info@merdlandmark.com
```

## Security Considerations

1. **Password Hashing** - bcryptjs with salt rounds
2. **JWT Tokens** - Secure, time-limited tokens for admin access
3. **CORS** - Configured to allow frontend requests
4. **Rate Limiting** - API endpoints are rate-limited
5. **Input Validation** - All forms validated server-side
6. **Helmet** - HTTP headers security
7. **SQL Injection** - Parameterized queries using pg

## Development Notes

### Adding New Features
1. Create backend route in `/backend/routes/`
2. Add database queries using pool from config.js
3. Add validation middleware if needed
4. Create or update frontend HTML page
5. Add JavaScript logic for form handling/data display
6. Test thoroughly

### Styling
- Use CSS custom properties from `css/variables.css`
- Follow BEM naming convention for classes
- Ensure mobile-responsive design
- Test on multiple screen sizes

## Future Enhancements

- [ ] Property image upload with cloud storage
- [ ] Advanced search and filtering
- [ ] Email notifications
- [ ] PDF property reports
- [ ] Video tours
- [ ] Financing options calculator
- [ ] Admin analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Payment gateway integration

## Support

For support, contact:
- Phone: +234 810 065 0205 / +234 902 224 5981
- WhatsApp: https://wa.me/2348100650205

## License

PROPRIETARY - MERD Landmark Properties Ltd. All rights reserved.
