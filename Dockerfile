# ---- Build Stage ----
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ---- Production Stage ----
FROM node:18-alpine AS prod
WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app /app

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Run migrations and start app
CMD npx prisma migrate deploy && npm start

