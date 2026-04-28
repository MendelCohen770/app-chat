FROM node:20-alpine AS builder
WORKDIR /app/client

ARG VITE_API_BASE_URL=http://localhost:5173
ARG VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY client/package*.json ./
RUN npm ci

COPY client ./
COPY shared ../shared
RUN npm run build

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/client/dist ./
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
