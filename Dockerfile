FROM node:5

ENV NODE_ENV production

ADD . /opt/apidoc/service

WORKDIR /opt/apidoc/service

RUN npm install --production

CMD ["node", "server.js"]
