FROM node:21.6.1

WORKDIR /status-backend

COPY . .

RUN npm ci
RUN npm install -g nodemon --unsafe-perm

ENTRYPOINT ["npm", "run", "dev"]
