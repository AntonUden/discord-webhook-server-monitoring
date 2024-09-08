FROM node:22-alpine

RUN npm install --global typescript

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run-script build

CMD ["npm", "start"]