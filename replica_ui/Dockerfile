FROM node:16 AS base

WORKDIR /usr/src/app

COPY ./package*.json ./

FROM base AS production

RUN npm ci --only=production

FROM base AS development

RUN npm install

CMD [ "npm", "start" ]
