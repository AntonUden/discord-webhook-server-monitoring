FROM node:22-bookworm

RUN npm install --global typescript

WORKDIR /app

COPY package.json ./

RUN apt update
RUN apt install iputils-ping -y
RUN npm install

COPY . .

RUN npm run-script build

CMD ["npm", "start"]
