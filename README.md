# Message Board Platform

A message board platform built with Node.js, Express, Prisma, and MySQL.

## Prerequisites
- Node.js v18+
- npm
- MySQL database
- The following Node.js packages (installed automatically with `npm install`):
  - express
  - dotenv
  - cors
  - helmet
  - morgan
  - express-rate-limit
  - jsonwebtoken
  - bcrypt
  - zod
  - @prisma/client
  - prisma (dev)
  - nodemon (dev)
- **Docker** and **Docker Compose** (optional, for containerized setup)

## Installation
1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd message-board
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

## Docker & Docker Compose
You can run the app and MySQL database together using Docker Compose:

1. **Build and start the services:**
   ```sh
   docker-compose up --build
   ```
   This will build the app image, start the MySQL database, run migrations, and launch the server on [http://localhost:3000](http://localhost:3000).

2. **Stop the services:**
   ```sh
   docker-compose down
   ```
   Add `-v` to also remove the database volume (all data):
   ```sh
   docker-compose down -v
   ```

3. **Environment Variables:**
   - You can edit environment variables in `docker-compose.yml` or use a `.env` file (see comments in the compose file).
   - The database data is persisted in a Docker volume (`db_data`).

4. **Prisma Migrations:**
   - Migrations are run automatically on container startup.

## Environment Setup
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your_jwt_secret"
MASTER_EMAIL="master@example.com"
MASTER_PASSWORD="Master123"
PORT=3000
```

## Database Setup & Migration
1. Initialize the Prisma client:
   ```sh
   npx prisma generate
   ```
2. Run migrations to set up the database schema:
   ```sh
   npx prisma migrate deploy
   ```
   (Or, for development: `npx prisma migrate dev`)

## Running the App
- For development (with hot reload):
  ```sh
  npm run dev
  ```
- For production:
  ```sh
  npm start
  ```

The server will start on the port specified in `.env` (default: 3000).

## API Structure
- **/api/auth**: User registration, login, profile management
- **/api/boards**: Board creation, update, deletion, join/leave, member management
- **/api/messages**: Message posting, fetching, replying
- **/api/master**: Master/admin endpoints for user and board management

## Key Design Decisions
- **Modular Structure**: Code is organized into routes, middleware, validators, and config for maintainability.
- **Prisma ORM**: Used for type-safe, scalable database access and migrations.
- **Validation**: Traditional JS validation is used, with a recommendation to migrate to Zod for schema-based validation (already used for messages).
- **Security**:
  - JWT-based authentication for all endpoints
  - Role-based access (admin, user, master)
  - Rate limiting (per endpoint and global)
  - Helmet for HTTP security headers
  - CORS configured for frontend integration
- **Error Handling**: Centralized error and 404 handling middleware
- **Logging**: HTTP request logging with morgan, plus custom logs for debugging
- **Extensibility**: Easy to add new routes, validators, or middleware

## Database Schema
See `prisma/schema.prisma` for full details. Key models:
- **User/Account**: Separate user profile and account (auth) data
- **Board**: Message boards with admin, public/private, and status (active/frozen)
- **BoardMember**: Many-to-many user-board membership
- **Message**: Messages linked to boards and users
- **BannedUser**: Board-level bans

## Migrations
All schema changes are tracked in `prisma/migrations/`. Use Prisma CLI to apply or create new migrations.

## Notes
- For production, set strong secrets and restrict CORS origins.
- Consider migrating all validation to Zod for consistency.
- See `api.rest` for example API requests.
