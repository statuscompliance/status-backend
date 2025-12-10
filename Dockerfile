FROM node:lts-alpine

WORKDIR /status-backend

COPY package*.json ./

RUN npm install --omit=dev --no-audit --no-fund && \
    npm cache clean --force

COPY . .

ENTRYPOINT ["npm", "start"]