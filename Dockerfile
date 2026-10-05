FROM node:20-alpine AS build
WORKDIR /app
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
# Bust layer cache when source changes (Dokploy sometimes reuses stale context)
ARG CACHEBUST=1
RUN echo "cachebust=$CACHEBUST" && npm run build

FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
