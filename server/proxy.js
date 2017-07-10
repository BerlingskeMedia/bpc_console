/*jshint node: true */
'use strict';

const bpc = require('./bpc_client');
var route_prefix = '';

function proxy (request, reply) {

  var path = request.raw.req.url;
  if(path.startsWith(route_prefix)){
    path = path.slice(route_prefix.length)
  }

  bpc.request({
    path: path,
    method: request.method,
    query: request.query
  },
  request.payload,
  request.state.console_ticket,
  reply);
}

module.exports.register = function (server, options, next) {

  route_prefix = server.realm.modifiers.route.prefix;

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
