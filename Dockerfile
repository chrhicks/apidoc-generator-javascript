FROM node:5

ENV NODE_ENV production

ADD ./dist /opt/apidoc/service

ADD ./run.sh /opt/apidoc/service/run.sh

WORKDIR /opt/apidoc/service

RUN mkdir ./log

RUN npm install -q -g forever

RUN npm install -q

ENTRYPOINT ./run.sh
