FROM becomes/bcms:1.0.0

WORKDIR /app

COPY events/. /app/events
COPY functions/. /app/functions
COPY public/. /app/public
COPY uploads/. /app/uploads
COPY .git/. /app/.git
COPY package.json /app
COPY package-lock.json /app
COPY bcms-config.js /app

RUN npm install

EXPOSE 1280

ENTRYPOINT [ "npm","start" ]