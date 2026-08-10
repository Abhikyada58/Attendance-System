FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency graphs
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for typescript)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Build the TypeScript code
RUN npm run build

# --- Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "run", "start"]
