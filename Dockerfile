FROM node:24-alpine

WORKDIR /app

COPY package*.json yarn.lock db/ ./

RUN corepack enable && yarn install --frozen-lockfile

COPY . .

RUN yarn build


EXPOSE 3000

ARG COMMIT_SHA=unknown
ENV APP_VERSION=$COMMIT_SHA

CMD ["sh", "-c", "yarn migration:run && yarn start:prod"]