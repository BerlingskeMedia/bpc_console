/*jshint node: true */
'use strict';

const sso_client = require('./sso_client');
var prefix = '';

function proxy (request, reply) {
  var path = request.path;

  if(path.startsWith(prefix)){
    path = path.slice(prefix.length)
  }

  // Well, we're actually just replacing route prefix '/admin' with the same '/admin'.
  // But let's do it anyway in case the route prefix gets changed.
  sso_client.request(request.method, '/admin'.concat(path), request.payload, request.state.ticket, reply);
}

module.exports.register = function (server, options, next) {

  prefix = server.realm.modifiers.route.prefix;

  server.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    path: '/{obj}/{id?}',
    handler: proxy
  });

  server.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    path: '/{obj}/{paths*2}',
    handler: proxy
  });

  server.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    path: '/{obj}/{paths*3}',
    handler: proxy
  });

  next();
};

module.exports.register.attributes = {
  name: 'proxy',
  version: '1.0.0'
};
