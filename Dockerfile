# Profilio : build de la SPA (Vite) puis service statique par nginx.
#   docker build --build-arg VITE_GHOST_URL=https://cms.example.com --build-arg VITE_GHOST_CONTENT_KEY=xxx -t profilio .
# Sans arguments, le site utilise le contenu statique de src/data.ts.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_GHOST_URL=""
ARG VITE_GHOST_CONTENT_KEY=""
ENV VITE_GHOST_URL=$VITE_GHOST_URL VITE_GHOST_CONTENT_KEY=$VITE_GHOST_CONTENT_KEY
RUN npm run build

FROM nginx:1.27-alpine
ARG VITE_GHOST_URL=""
# Origine Ghost autorisée par la CSP (connect-src) ; seule variable substituée dans le template.
ENV GHOST_ORIGIN=$VITE_GHOST_URL NGINX_ENVSUBST_FILTER=^GHOST_
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO /dev/null http://localhost/ || exit 1
