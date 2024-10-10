FROM node:lts-alpine

WORKDIR /status-backend

COPY . .

RUN npm ci --production && \
    rm -rf $(npm get cache)

ENTRYPOINT ["npm", "start"]