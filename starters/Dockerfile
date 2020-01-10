FROM node:10-slim

WORKDIR /app

COPY events/. /app/events
COPY functions/. /app/functions
COPY public/. /app/public
COPY uploads/. /app/uploads
COPY package.json /app
COPY bcms-config.js /app

RUN npm install
RUN npm run build

EXPOSE 1280

ENTRYPOINT [ "npm","run","serve" ]