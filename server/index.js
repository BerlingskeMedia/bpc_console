/*jshint node: true */
'use strict';

// The env name has changes in hapi-bpc at some point
process.env.BPC_APP_KEY = process.env.BPC_APP_KEY || process.env.BPC_APP_SECRET;

const log = require('util').log;
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const HapiBpc = require('hapi-bpc');

const server = Hapi.server({
  port: process.env.PORT || 8000
});


const Good = require('@hapi/good');
const goodOptions = {
  reporters: {
    myConsoleReporter: [
      { module: '@hapi/good-squeeze', name: 'Squeeze', args: [{ log: '*', response: { exclude: 'good_exclude' }}] },
      { module: '@hapi/good-console' },
      'stdout'
    ]
  }
};

const init = async () => {

  await server.register(Inert);
  await server.register(HapiBpc);

  await server.ext('onPreResponse', function (request, reply) {
    const {response} = request;

    if (response.isBoom) {
      response.output.headers['X-Frame-Options'] = 'DENY';
    } else {
      response.header('X-Frame-Options', 'DENY');
    }

    return reply.continue;
  })

  server.route({
    method: 'GET',
    path: '/healthcheck',
    config: {
      tags: ['good_exclude']
    },
    handler: function(request, h){
      return '';
    }
  });

  server.route({
    method: 'GET',
    path: '/favicon.ico',
    config: {
      tags: ['good_exclude']
    },
    handler: function(request, h){
      return '';
    }
  });

  server.route({
    method: 'get',
    path: '/build/{param*}',
    config: {
      tags: ['good_exclude']
    },
    handler: {
      directory: {
        path: './client/build'
      }
    }
  });

  server.route({
    method: 'get',
    path: '/assets/{param*}',
    config: {
      tags: ['good_exclude']
    },
    handler: {
      directory: {
        path: './client/assets'
      }
    }
  });

  server.route({
    method: 'get',
    path: '/{param*}',
    config: {
      tags: ['good_exclude']
    },
    handler: {
      file: './client/index.html'
    }
  });


  await server.register({ plugin: Good, options: goodOptions });
  await server.bpc.connect();
  await server.start();
  log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
