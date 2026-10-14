# Stage 1: Build Angular SPA
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps --ignore-scripts

COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Serve static bundle with Nginx
FROM nginx:1.27-alpine

COPY --from=builder /app/dist/carebase-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
