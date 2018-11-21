FROM node:9-alpine

LABEL maintainer="ISA Research Group <isagroup.us@gmail.com>"

RUN mkdir -p /opt/app

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# default to port 80 for node
ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT

# check every 30s to ensure this service returns HTTP 200
#HEALTHCHECK CMD curl -fs http://localhost:$PORT || exit 1

# install dependencies first, in a different location for easier app bind mounting for local development
WORKDIR /opt
COPY package.json package-lock.json* ./
RUN npm install && npm cache clean --force
ENV PATH /opt/node_modules/.bin:$PATH

# copy in our source code last, as it changes the most
WORKDIR /opt/app
COPY . /opt/app

CMD [ "node", "index.js" ]