/*jshint node: true */
'use strict';

const Boom = require('boom');
const bpc = require('./bpc_client');

module.exports.register = function (server, options, next) {

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
            return reply(err);
          }

          reply(userTicket)
          .state('console_ticket', userTicket);
        });

      } else if (request.state && request.state.console_ticket) {

        bpc.reissueTicket(request.state.console_ticket, function (err, reissuedTicket){
          if (err) {
            return reply(err);
          }
          reply(reissuedTicket)
            .state('console_ticket', reissuedTicket);
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
      reply()
        .unstate('console_ticket');
    }
  });

  next();
};


module.exports.register.attributes = {
  name: 'tickets',
  version: '1.0.0'
};
