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
      bpc.getUserTicket(request.payload.rsvp, function (err, userTicket){
        console.log('getUserTicket', err, userTicket);
        if (err){
          return reply(err);
        }

        reply(userTicket)
          .state('ticket', userTicket);
      });
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
        .unstate('ticket');
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      cors: false,
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {
      bpc.reissueTicket(request.state.ticket, function (err, reissuedTicket){
        if (err) {
          return reply(err);
        }
        reply(reissuedTicket)
          .state('ticket', reissuedTicket);
      });
    }
  });

  next();
};


module.exports.register.attributes = {
  name: 'tickets',
  version: '1.0.0'
};
