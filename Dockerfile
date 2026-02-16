FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
