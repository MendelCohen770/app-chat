FROM node:20-alpine AS builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/tsconfig*.json ./
COPY server/src ./src
COPY shared ../shared
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/server

ENV NODE_ENV=production

COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/server/dist ./dist
RUN mkdir -p uploads && chown -R node:node /app

EXPOSE 3000
VOLUME ["/app/server/uploads"]

USER node

CMD ["node", "dist/server/src/index.js"]
