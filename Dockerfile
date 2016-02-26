FROM node:5

ENV NODE_ENV production

ADD ./dist /opt/apidoc/service

WORKDIR /opt/apidoc/service

RUN npm install -q

CMD ["node", "server.js"]
