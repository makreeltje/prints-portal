# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# ---- build: install all dependencies, build frontend and backend ----
FROM node:${NODE_VERSION}-bookworm-slim AS build
# Build tools are only a fallback for native modules without a prebuilt binary.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci
COPY design-system design-system
COPY backend backend
COPY frontend frontend
RUN npm run build

# ---- deps: production dependencies of the backend only ----
FROM node:${NODE_VERSION}-bookworm-slim AS deps
# Build tools are only a fallback for native modules without a prebuilt binary.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev --workspace backend --include-workspace-root=false \
  && npm cache clean --force

# ---- runtime ----
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data \
    PRINTS_ROOT=/prints
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/backend/package.json backend/package.json
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
RUN mkdir -p /data /prints && chown node:node /data
# The official image's unprivileged user (uid 1000).
USER node
VOLUME ["/data"]
EXPOSE 8080
# Node is guaranteed to exist in this image, unlike wget or curl.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/healthz').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "backend/dist/server.js"]
