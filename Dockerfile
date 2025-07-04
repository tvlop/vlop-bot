FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml* ./

RUN npm install --production

COPY . .

RUN mkdir -p logs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]