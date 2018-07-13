/*jshint node: true */
'use strict';

const Boom = require('boom');
const Joi = require('joi');
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
      },
      validate: {
        payload: Joi.object().keys({
          ID: Joi.string().required(),
          id_token: Joi.string().required(),
          access_token: Joi.string().required()
        })
      }
    },
    handler: function(request, reply) {

      const payload = Object.assign({}, request.payload, { app: bpc.env.app });

      // Doing the RSVP in the backend
      bpc.request({ path: '/rsvp', method: 'POST', payload: payload }, {}, function (err, response) {
        if (err){
          reply.unstate('console_ticket');
          reply(err);
          return;
        }

        bpc.request({ path: '/ticket/user', method: 'POST', payload: response }, null, function (err, userTicket){
          if (err){
            reply.unstate('console_ticket');
            reply(err);
            return;
          }

          reply.state('console_ticket', userTicket);
          reply(userTicket);
        });
      });

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

      if (request.state && request.state.console_ticket) {

        bpc.request({ path: '/ticket/reissue', method: 'POST' }, request.state.console_ticket, function (err, reissuedTicket){
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


