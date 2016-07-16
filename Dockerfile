FROM node

RUN mkdir -p /usr/src/app
RUN mkdir -p /usr/src/models
WORKDIR /usr/src/app

COPY ./node_modules/pinecone-models/ /usr/src/models/

RUN ls /usr/src/models/

RUN npm link ../models

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

CMD [ "npm", "start" ]