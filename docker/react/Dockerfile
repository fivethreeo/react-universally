FROM node:8.9.0-alpine

RUN mkdir /code

COPY package.json /code/

WORKDIR /code

RUN /usr/local/bin/npm install -g babel-cli

RUN /usr/local/bin/npm install --production

RUN cp -R node_modules /node_modules.production

RUN /usr/local/bin/npm install

RUN mv node_modules /node_modules.build
