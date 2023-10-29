# syntax=docker/dockerfile:1

# ---- build ------------------------------------------------------------------
FROM node:18.16-alpine AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY public ./public
COPY src ./src

# Create React App inlines environment variables at build time, so the API URL has to be
# supplied here rather than at container start.
ARG REACT_APP_API_URL="http://localhost:8080/api"
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN yarn build

# ---- runtime ----------------------------------------------------------------
FROM nginx:1.25-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

# nginx needs to write its pid and caches; give the unprivileged user the directories it
# uses and run on 8080 so no capability to bind a low port is required.
RUN sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf \
  && sed -i '/^user /d' /etc/nginx/nginx.conf \
  && sed -i 's#/var/run/nginx.pid#/tmp/nginx.pid#' /etc/nginx/nginx.conf \
  && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
