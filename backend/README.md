# Rhinos Training - Backend API

Backend API for Rhinos Training App built with Express.js, Prisma, and MongoDB.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (MongoDB Atlas)
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Brevo (Sendinblue) API
- **Validation**: Zod

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# MongoDB Atlas connection string
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/rhinos-training"

# JWT secret (generate a random string)
JWT_SECRET="your-super-secret-key-min-32-characters"
JWT_EXPIRES_IN="7d"

# Brevo API key (get from https://brevo.com)
BREVO_API_KEY="your-brevo-api-key"
BREVO_SENDER_EMAIL="noreply@yourteam.com"
BREVO_SENDER_NAME="Rhinos Training"

# Server config
PORT=5000
NODE_ENV="development"

# Frontend URL (for CORS and password reset links)
FRONTEND_URL="http://localhost:3001"

# Coach signup code
COACH_CODE="RHINOS2025"
```

### 3. Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 Sandbox - 512MB)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `DATABASE_URL`

### 4. Setup Brevo (Email Service)

1. Go to [Brevo](https://www.brevo.com/) and create a free account
2. Verify your sender email address
3. Go to Settings → SMTP & API → API Keys
4. Create a new API key and add it to `BREVO_API_KEY`

### 5. Initialize Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to MongoDB
npm run prisma:push
```

### 6. Run Development Server

```bash
npm run dev
```

The API will be running at `http://localhost:5000`

## API Endpoints

### Authentication

#### POST /api/auth/signup
Register a new user (player or coach).

**Request:**
```json
{
  "email": "player@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "player",
  "jerseyNumber": 42,
  "birthDate": "2000-01-15",
  "age": 24,
  "weightKg": 85,
  "heightCm": 180,
  "position": "RB",
  "sex": "male"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "player@example.com",
    "name": "John Doe",
    "role": "player",
    ...
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "player@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### POST /api/auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "player@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a reset link has been sent"
}
```

#### POST /api/auth/reset-password
Reset password with token from email.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

### Users

All user endpoints require authentication (Bearer token in Authorization header).

#### GET /api/users/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "player@example.com",
  "name": "John Doe",
  "role": "player",
  ...
}
```

#### GET /api/users
Get all users (team directory).

#### GET /api/users/:id
Get user by ID.

#### PATCH /api/users/me
Update current user profile.

**Request:**
```json
{
  "weightKg": 87,
  "metricsPublic": true,
  "phone": "+43123456789"
}
```

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

Key models:
- **User**: Players and coaches
- **TrainingSession**: Team and private training sessions
- **AttendancePoll**: Polls for training attendance
- **AttendancePollVote**: Votes on attendance polls
- **Video**: Training videos
- **WorkoutSync**: Synced workout data from offline devices
- **TeamSettings**: Team branding configuration
- **Exercise**: Exercise catalog

## Development

### Prisma Studio

View and edit your database with Prisma's GUI:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

### Database Migrations

```bash
# Push schema changes to database
npm run prisma:push

# Regenerate Prisma Client after schema changes
npm run prisma:generate
```

### Build for Production

```bash
npm run build
npm start
```

## Testing with Postman/Thunder Client

1. Import the collection (create one or use the API reference above)
2. Set environment variable `API_URL` to `http://localhost:5000`
3. After login, set `AUTH_TOKEN` to the returned JWT
4. Use `{{AUTH_TOKEN}}` in Authorization headers

## Deployment

Recommended platforms:
- **Railway**: Free tier, easy MongoDB Atlas integration
- **Render**: Free tier, supports Docker
- **DigitalOcean App Platform**: $5/month
- **AWS EC2**: Most control

Don't forget to:
1. Set all environment variables
2. Set `NODE_ENV=production`
3. Use a strong `JWT_SECRET`
4. Whitelist deployment IP in MongoDB Atlas

## Security Notes

⚠️ **CRITICAL: NEVER commit `.env` file to Git!**

The `.env` file contains sensitive data:
- MongoDB credentials (connection string with password)
- JWT_SECRET (used to sign authentication tokens)
- BREVO_API_KEY (email service API key)
- COACH_CODE (access code for coach registration)

**Security checklist:**
- [x] `.env` is in `.gitignore` (already configured)
- [ ] Use strong JWT_SECRET (min 32 random characters)
- [ ] Enable MongoDB Atlas IP whitelist in production
- [ ] Rate limit auth endpoints (TODO)
- [ ] Enable HTTPS in production (required for PWA)
- [ ] Validate all user input (using Zod) ✓
- [ ] Rotate credentials every 3-6 months
- [ ] Use environment variables in deployment platform (Railway, Render, etc.)

**If you accidentally commit `.env`:**
1. Immediately rotate all credentials (MongoDB password, API keys, JWT_SECRET)
2. Remove file from Git history using BFG Repo-Cleaner
3. Force push to repository
4. Notify team members

See `../SECURITY.md` for detailed security guidelines.

## TODO

- [ ] Add rate limiting for auth endpoints
- [ ] Add refresh tokens
- [ ] Add 2FA support
- [ ] Add admin panel routes
- [ ] Add workout sync endpoints
- [ ] Add training session endpoints
- [ ] Add attendance poll endpoints
- [ ] Add video endpoints
- [ ] Add team settings endpoints
- [ ] Add WebSocket support for real-time updates
- [ ] Add logging (Winston/Pino)
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add unit tests
- [ ] Add integration tests

## License

Private - Rhinos Training Team
