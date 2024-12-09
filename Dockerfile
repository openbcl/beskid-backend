FROM node:18-slim AS build
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
RUN npm run build
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

FROM ghcr.io/openbcl/beskid-backend:base AS production
COPY --from=build /usr/src/app/node_modules /app/node_modules
COPY --from=build /usr/src/app/dist /app/dist
COPY --from=build /usr/src/app/python /app/python
COPY --from=build /usr/src/app/templates /home/pn/templates
COPY --from=build /usr/src/app/.git/HEAD /app/.git/HEAD
COPY --from=build /usr/src/app/.git/refs/heads /app/.git/refs/heads
CMD [ "node", "/app/dist/main.js" ]