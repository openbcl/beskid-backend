FROM node:18-slim AS build
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
RUN npm run build
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

FROM ghcr.io/openbcl/beskid-backend:base AS production
USER root
COPY --from=build /usr/src/app/node_modules /app/node_modules
COPY --from=build /usr/src/app/dist /app/dist
COPY --from=build /usr/src/app/python /app/python
RUN if [ -f /app/python/requirements.txt ]; then python -m pip install --no-cache-dir -r /app/python/requirements.txt; fi
COPY --from=build /usr/src/app/templates /home/pn/templates
COPY --from=build /usr/src/app/.git/HEAD /home/pn/.git/HEAD
COPY --from=build /usr/src/app/.git/refs/heads /home/pn/.git/refs/heads
USER pn
CMD [ "node", "/app/dist/main.js" ]