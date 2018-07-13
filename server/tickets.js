/*jshint node: true */
'use strict';

const Boom = require('boom');
const bpc = require('./bpc_client');

module.exports.register = function (server, options, next) {

  server.state('console_ticket', {
    // ttl: 1000 * 60 * 60 * 24 * 30, // (one month)
    ttl: null, // session time-life - cookies are deleted when the browser is closed
    isHttpOnly: false,
    isSecure: false,
    // isSameSite: false,
    path: '/',
    encoding: 'base64json'
  });

  server.route({
    method: 'POST',
    path: '/',
    config: {
      cors: false,
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {

      if (request.payload && request.payload.rsvp) {

        bpc.getUserTicket(request.payload.rsvp, function (err, userTicket){
          console.log('getUserTicket', err, userTicket);
          if (err){
            reply.unstate('console_ticket');
            return reply(err);
          }

          reply.state('console_ticket', userTicket);
          reply(userTicket);
        });

      } else if (request.state && request.state.console_ticket) {

        bpc.reissueTicket(request.state.console_ticket, function (err, reissuedTicket){
          if (err) {
            reply.unstate('console_ticket');
            return reply(err);
          }
          
          reply.state('console_ticket', reissuedTicket);
          reply(reissuedTicket);
        });

      } else {

        reply(Boom.badRequest());

      }

    }
  });

  server.route({
    method: 'DELETE',
    path: '/',
    config: {
      cors: false,
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {
      // This is not a global signout.
      reply.unstate('console_ticket');
      reply();
    }
  });

  next();
};


module.exports.register.attributes = {
  name: 'tickets',
  version: '1.0.0'
};


