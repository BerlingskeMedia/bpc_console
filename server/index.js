/*jshint node: true */
'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Tickets = require('./tickets');
const Proxy = require('./proxy');

var server = new Hapi.Server();
server.connection({ port: process.env.PORT ? process.env.PORT : 8000 });

server.state('ticket', {
  ttl: 1000 * 60 * 60 * 24 * 30, // (one month)
  isHttpOnly: false,
  isSecure: false,
  // isSameSite: false,
  path: '/',
  encoding: 'base64json'
});

server.register(Inert, () => {});
server.register(Tickets, { routes: { prefix: '/tickets' } }, cb);
server.register(Proxy, { routes: { prefix: '/admin' } }, cb);

server.route({
  method: 'GET',
  path: '/favicon.ico',
  handler: function(request, reply){
    reply();
  }
});

server.route({
  method: 'GET',
  path: '/bpc_env',
  handler: function(request, reply){
    reply({
      host: process.env.CONSOLE_APPLICATION_SSO_URL,
      port: process.env.CONSOLE_APPLICATION_SSO_PORT,
      app_id: process.env.CONSOLE_APPLICATION_APP_ID,
    });
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

// server.route({
//   method: 'GET',
//   path: '/{param*}',
//   handler: {
//     directory: {
//       path: './client',
//       redirectToSlash: true,
//       index: true
//     }
//   }
// });

server.start((err) => {
  if (err) {
    throw err;
  }
  console.log(`Console server running at: ${server.info.uri}`);
});

function cb (err) {
  if (err) {
    console.log('Error when loading plugin', err);
    server.stop();
  }
}
