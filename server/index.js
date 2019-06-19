/*jshint node: true */
'use strict';

// The env name has changes in hapi-bpc at some point
process.env.BPC_APP_KEY = process.env.BPC_APP_KEY || process.env.BPC_APP_SECRET;

const log = require('util').log;
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Proxy = require('./proxy');
const HapiBpc = require('hapi-bpc');

const server = Hapi.server({
  port: process.env.PORT || 8000
});


const init = async () => {

  await server.register(Inert);
  await server.register(HapiBpc);
  await server.register(Proxy, { routes: { prefix: '/_b' } });

  server.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: function(request, h){
      return '';
    }
  });

  server.route({
    method: 'get',
    path: '/build/{param*}',
    handler: {
      directory: {
        path: './client/build'
      }
    }
  });

  server.route({
    method: 'get',
    path: '/assets/{param*}',
    handler: {
      directory: {
        path: './client/assets'
      }
    }
  });

  server.route({
    method: 'get',
    path: '/{param*}',
    handler: {
      file: './client/index.html'
    }
  });


  await server.start();
  log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
