# Message Board Platform

A message board platform built with Node.js, Express, Prisma, and MySQL.

## Prerequisites

### Required Software

#### 1. Node.js (v18+)
**Download and Install:**
- **Windows**: Download from [Node.js Official Site](https://nodejs.org/)
- **macOS**: 
  ```bash
  # Using Homebrew
  brew install node
  
  # Or download from official site
  ```
- **Ubuntu/Debian**:
  ```bash
  # Using NodeSource repository
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **CentOS/RHEL**:
  ```bash
  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
  sudo yum install -y nodejs
  ```

**Verify Installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
```

#### 2. npm (Node Package Manager)
- Usually installed with Node.js
- **Update npm** (if needed):
  ```bash
  npm install -g npm@latest
  ```

#### 3. MySQL Database
**Installation Options:**

**Option A: Local Installation**
- **Windows**: Download MySQL Installer from [MySQL Official Site](https://dev.mysql.com/downloads/installer/)
- **macOS**:
  ```bash
  brew install mysql
  brew services start mysql
  ```
- **Ubuntu/Debian**:
  ```bash
  sudo apt update
  sudo apt install mysql-server
  sudo systemctl start mysql
  sudo systemctl enable mysql
  ```
- **CentOS/RHEL**:
  ```bash
  sudo yum install mysql-server
  sudo systemctl start mysqld
  sudo systemctl enable mysqld
  ```

**Option B: Docker (Recommended)**
```bash
# Install Docker Desktop first, then:
docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=messageboard -p 3306:3306 -d mysql:8
```

**Verify MySQL Installation:**
```bash
mysql --version
mysql -u root -p -e "SELECT VERSION();"
```

#### 4. Docker and Docker Compose (Optional but Recommended)
**Installation:**

**Windows:**
- Download [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows/)
- Includes Docker Compose

**macOS:**
- Download [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac/)
- Or install via Homebrew:
  ```bash
  brew install --cask docker
  ```

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**CentOS/RHEL:**
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Verify Docker Installation:**
```bash
docker --version
docker-compose --version
docker run hello-world
```

#### 5. Git (for cloning repository)
**Installation:**
- **Windows**: Download from [Git Official Site](https://git-scm.com/)
- **macOS**: 
  ```bash
  brew install git
  ```
- **Ubuntu/Debian**:
  ```bash
  sudo apt install git
  ```
- **CentOS/RHEL**:
  ```bash
  sudo yum install git
  ```

**Verify Installation:**
```bash
git --version
```

### Required Node.js Packages
The following packages will be installed automatically with `npm install`:
- **express** - Web framework
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **morgan** - HTTP request logging
- **express-rate-limit** - Rate limiting
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **zod** - Schema validation
- **@prisma/client** - Database ORM
- **prisma** (dev) - Database migration tools
- **nodemon** (dev) - Development server with auto-restart

### System Requirements
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: At least 1GB free space
- **Network**: Internet connection for package downloads
- **Ports**: 
  - 3000 (Node.js app)
  - 3306/3307 (MySQL database)
  - 8080 (phpMyAdmin - Docker only)

### Pre-Installation Checklist
Before proceeding with installation, ensure:
- [ ] Node.js v18+ is installed and verified
- [ ] npm is installed and updated
- [ ] MySQL is installed and running (or Docker is ready)
- [ ] Git is installed (for cloning)
- [ ] Required ports are available
- [ ] Sufficient disk space is available

## Installation

### Method 1: Local Development Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/mohamadalikashakesh/message-board.git
cd message-board
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/messageboard"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# Master User Configuration
MASTER_EMAIL="master@example.com"
MASTER_PASSWORD="Master123"

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### Step 4: Database Setup
1. **Install MySQL** (if not already installed):
   - **Windows**: Download from [MySQL Official Site](https://dev.mysql.com/downloads/mysql/)
   - **macOS**: `brew install mysql`
   - **Ubuntu/Debian**: `sudo apt install mysql-server`

2. **Create Database**:
   ```sql
   CREATE DATABASE messageboard;
   CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'apppassword';
   GRANT ALL PRIVILEGES ON messageboard.* TO 'appuser'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Run Prisma Migrations**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   ```

#### Step 5: Start the Application
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### Method 2: Docker Setup (Recommended)

#### Prerequisites
- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

#### Step 1: Clone and Navigate
```bash
git clone <repository-url>
cd message-board
```

#### Step 2: Start All Services
```bash
# Build and start all services (MySQL, phpMyAdmin, Node.js app)
docker-compose up --build
```

#### Step 3: Access Services
- **API Server**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
  - Username: `root`
  - Password: `rootpassword`
- **MySQL Database**: localhost:3307

#### Step 4: Verify Installation
```bash
# Check if all containers are running
docker-compose ps

# View logs
docker-compose logs app
```

## Environment Setup

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |
| `MASTER_EMAIL` | Master user email | `master@example.com` |
| `MASTER_PASSWORD` | Master user password | `Master123` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Database Configuration

#### Local MySQL Setup
```bash
# Start MySQL service
sudo systemctl start mysql  # Linux
brew services start mysql   # macOS
```

#### Docker MySQL Setup
The Docker setup automatically configures MySQL with:
- Database: `messageboard`
- Root password: `rootpassword`
- User: `appuser` / Password: `apppassword`

## Database Setup & Migration

### Using Prisma CLI
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Manual Database Setup
```sql
-- Connect to MySQL and run:
CREATE DATABASE messageboard;
USE messageboard;

-- The migrations will create all tables automatically
```

## Running the App

### Development Mode
```bash
npm run dev
```
- Uses nodemon for auto-restart
- Detailed logging enabled
- Hot reload on file changes

### Production Mode
```bash
npm start
```
- Optimized for production
- Minimal logging
- No auto-restart

### Docker Mode
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```


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
