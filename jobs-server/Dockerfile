# syntax=docker/dockerfile:1

# ---- dependencies -----------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
# Prisma's engines need OpenSSL, which node:alpine leaves out. bcrypt 6 ships prebuilt
# musl binaries, so no compiler toolchain is needed.
RUN apk add --no-cache openssl
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ---- build ------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src
RUN yarn prisma generate && yarn build

# ---- production dependencies only -------------------------------------------
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production
# The Prisma CLI is a dev dependency, so the client generated in `build` is copied over.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# ---- runtime ----------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY prisma ./prisma

# The image runs as the unprivileged `node` user that the base image already provides.
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT:-8080}/api/health" || exit 1

# server.ts handles SIGTERM itself; compose adds `init: true` to reap zombies.
CMD ["node", "dist/server.js"]
