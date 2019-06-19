FROM ubuntu:14.04

MAINTAINER Daniel Kokott <dako@berlingskemedia.dk>

# Installing wget - needed to download node.js
RUN apt-get update
RUN apt-get install -y wget

ENV NODE_VERSION v8.4.0

# Downloading and installing Node.
RUN wget -O - https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.gz \
    | tar xzf - --strip-components=1 --exclude="README.md" --exclude="LICENSE" \
    --exclude="ChangeLog" -C "/usr/local"

# Set the working directory.
WORKDIR /bpc_console

# Copying the code into image. Be aware no config files are including.
COPY ./server /bpc_console/server
COPY ./client /bpc_console/client
COPY ./package.json /bpc_console/package.json
COPY ./webpack.config.js /bpc_console/webpack.config.js

# Installing packages
RUN npm install
RUN npm install webpack
RUN npm install webpack-cli
RUN npm install babel-preset-env

RUN npx webpack

# Building the client
# RUN npm run client:build

# Exposing our endpoint to Docker.
EXPOSE  8000

# When starting a container with our image, this command will be run.
CMD ["node", "server/index.js"]
