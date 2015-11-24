FROM node:5

ADD . /opt/apidoc/service

WORKDIR /opt/apidoc/service

RUN npm install --production

CMD ["node", "server.js"]
