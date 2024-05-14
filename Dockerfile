FROM node:21.6.1

WORKDIR /status-backend

COPY . .

COPY .env.deploy .env

RUN npm install
RUN npm install -g nodemon --unsafe-perm

CMD ["npm", "run", "dev"]