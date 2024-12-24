FROM node:lts-alpine

WORKDIR /status-backend

COPY . .

RUN npm ci --omit=dev && \
    rm -rf $(npm get cache)

ENTRYPOINT ["npm", "start"]