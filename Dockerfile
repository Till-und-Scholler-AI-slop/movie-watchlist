# ---- Build stage ----
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json* tsconfig.base.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm install --no-audit --no-fund

COPY server ./server
COPY client ./client
RUN npm run build

# ---- Runtime stage ----
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787
ENV DB_PATH=/app/data/watchlist.db

# Flatten the server so node_modules resolves from /app
COPY --from=build /app/server/package.json ./package.json
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/client/dist ./public
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

EXPOSE 8787
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
