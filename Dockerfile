FROM node:21.6.1-slim AS build

ENV NODE_VERSION=21.6.1-slim
ENV ARCH=arm64

WORKDIR /status-backend

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    xz-utils \
    libatomic1 --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm install

COPY . .

FROM node:21.6.1-slim

WORKDIR /status-backend

COPY --from=build /status-backend ./

RUN npm install -g nodemon --unsafe-perm && npm cache clean --force

ENTRYPOINT ["npm", "run", "dev"]
