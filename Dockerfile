FROM node:18-alpine As build

RUN apk upgrade --update -q \
  && apk --no-cache -q add git

WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install

EXPOSE 3000

CMD ["npm", "start"]

