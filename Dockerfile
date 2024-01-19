FROM node:18-alpine AS build
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
RUN npm run build
ENV NODE_ENV production
RUN npm ci --omit=dev && npm cache clean --force

FROM nikolaik/python-nodejs:python3.12-nodejs18-alpine AS production
COPY --from=build /usr/src/app/node_modules /app/node_modules
COPY --from=build /usr/src/app/dist /app/dist
COPY --from=build /usr/src/app/python /app/python
RUN python3 -m venv /opt/venv/beskid
ENV PATH="/opt/venv/beskid/bin:$PATH"
RUN pip install numpy
USER pn
WORKDIR /home/pn
CMD [ "node", "/app/dist/main.js" ]