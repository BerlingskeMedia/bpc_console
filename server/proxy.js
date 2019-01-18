/*jshint node: true */
'use strict';

var route_prefix = '';

function proxy (request, h) {

  const bpc = h.bpc;

  var path = request.raw.req.url;
  if(path.startsWith(route_prefix)){
    path = path.slice(route_prefix.length)
  }

  return bpc.request(
    {
      path: path,
      method: request.method,
      query: request.query,
      payload: request.payload
    },
    request.state.console_ticket,
    h
  );
}


module.exports = {
  name: 'proxy',
  version: '1.0.0',
  register: function (server, options) {

    route_prefix = server.realm.modifiers.route.prefix;
  
    server.route({
      method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      path: '/{obj}/{id?}',
      handler: proxy
    });
  
    server.route({
      method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      path: '/{obj}/{paths*2}',
      handler: proxy
    });
  
    server.route({
      method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      path: '/{obj}/{paths*3}',
      handler: proxy
    });
  }
};