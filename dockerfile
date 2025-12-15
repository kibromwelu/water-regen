# Builder - Install dependencies, generate Prisma, and build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci 
COPY . .
RUN npx prisma generate
RUN npm run build

# Production - Copy built files and run the app
FROM node:20-alpine AS runner
WORKDIR /app
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/package*.json ./
# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema 
COPY --from=builder /app/prisma ./prisma

# Prisma client must exist here too
RUN npx prisma generate

# Copy built app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]