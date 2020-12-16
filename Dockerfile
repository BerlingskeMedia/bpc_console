FROM node:10.16-alpine as build

MAINTAINER Daniel Kokott <dako@berlingskemedia.dk>

WORKDIR /build

ADD package.json .
ADD package-lock.json .

# Installing packages
RUN npm install
RUN npm install webpack
RUN npm install webpack-cli

# Building the client
ADD ./client ./client
ADD webpack.config.js .
RUN webpack


FROM node:10.16-alpine

# Set the working directory.
WORKDIR /bpc_console

# Copying the code into image. Be aware no config files are including.
COPY --from=build /build/client ./client
ADD package.json .
ADD package-lock.json .

# Installing packages
RUN npm i --production

ADD ./server ./server

# Exposing our endpoint to Docker.
EXPOSE  8000

# When starting a container with our image, this command will be run.
CMD ["node", "server/index.js"]
