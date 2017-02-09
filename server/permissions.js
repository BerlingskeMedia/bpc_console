/*jshint node: true */
'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Oz = require('oz');
const MongoDB = require('./mongodb_client');

const ENCRYPTIONPASSWORD = process.env.ENCRYPTIONPASSWORD;

module.exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/{name}',
    config: {
      auth: {
        access: {
          scope: ['{params.name}', 'admin'],
          entity: 'user'
        }
      },
      cors: {
        credentials: true,
        origin: ['*'],
        // access-control-allow-methods:POST
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 86400
      },
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {
      console.log('permissions USER', request.params.name);

      getTicketFromHawkHeader(request.headers.authorization, function(err, ticket){

        if (ticket.ext.private.Permissions === undefined || ticket.ext.private.Permissions[request.params.name] === undefined){
          reply(Boom.forbidden());
        }

        // We only want to reply the permissions within the requested scope
        var Permissions = Object.assign({}, ticket.ext.private.Permissions);

        Object.keys(Permissions).filter(function (k) {
            return k !== request.params.name;
        }).forEach(function (v) {
            delete Permissions[v];
        });

        reply({Permissions: Permissions});

      });
    }
  });

  server.route({
    method: 'GET',
    path: '/{user}/{name}',
    config: {
      auth: {
        access: {
          scope: ['{params.name}', 'admin'],
          entity: 'app'
        }
      },
      cors: {
        credentials: true,
        origin: ['*'],
        // access-control-allow-methods:POST
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 86400
      },
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {
      console.log('permissions APP', request.params.user, request.params.name);

      var queryProject = {
        _id: 0
      };
      queryProject['Permissions.'.concat(request.params.name)] = 1;

      MongoDB.collection('users').findOne(
        {
          UID: request.params.user
        },
        queryProject
        , function (err, result){
          if (err) {
            console.error(err);
          }

          reply(err, result);
        }
      );
    }
  });

  // server.route({
  //   method: 'GET',
  //   path: '/{user}/{name}/{key}',
  //   config: {
  //     auth: {
  //       access: {
  //         scope: ['{params.name}', 'admin'],
  //         entity: 'app' // <-- Important. Users must not be allowed to query permissions
  //       }
  //     },
  //     cors: {
  //       credentials: true,
  //       origin: ['*'],
  //       // access-control-allow-methods:POST
  //       headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
  //       exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  //       maxAge: 86400
  //     },
  //     state: {
  //       parse: true,
  //       failAction: 'log'
  //     }
  //   },
  //   handler: function(request, reply) {
  //     console.log('GET permissions key', request.params.name, request.params.key);
  //
  //     var queryProject = {
  //       _id: 0
  //     };
  //     queryProject['Permissions.'.concat(request.params.name, '.', request.params.key)] = 1;
  //
  //     MongoDB.collection('users').findOne(
  //       {
  //         UID: request.query.UID,
  //         email: request.query.email
  //       },
  //       queryProject
  //       , function (err, result){
  //         if (err) {
  //           console.error(err);
  //         }
  //
  //         reply(err, result);
  //       }
  //     );
  //   }
  // });

  server.route({
    method: 'POST',
    path: '/{user}/{name}',
    config: {
      auth: {
        access: {
          scope: ['{params.name}', 'admin'],
          entity: 'app' // <-- Important. Users must not be allowed to query permissions
        }
      },
      cors: {
        credentials: true,
        origin: ['*'],
        // access-control-allow-methods:POST
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 86400
      },
      state: {
        parse: true,
        failAction: 'log'
      },
      validate: {
        payload: Joi.object()
      }
    },
    handler: function(request, reply) {
      console.log('PUT permissions key', request.params.user, request.params.name);

      var set = {};
      Object.keys(request.payload).forEach(function(key){
        set['Permissions.'.concat(request.params.name,'.', key)] = request.payload[key];
      });

      MongoDB.collection('users').updateOne(
        {
          UID: request.params.user
        },
        {
          $currentDate: { 'Updated': { $type: "timestamp" } },
          $set: set
        },
        {
          upsert: true
          //  writeConcern: <document>, // Perhaps using writeConcerns would be good here. See https://docs.mongodb.com/manual/reference/write-concern/
          //  collation: <document>
        },
        function(err, result){
          if (err){
            reply(err)
          } else if (result === null) {
            reply(Boom.notFound());
          } else {
            reply();
          }
        }
      );
    }
  });

  next();
};

module.exports.register.attributes = {
  name: 'permissions',
  version: '1.0.0'
};

// TODO: Make a module instead of having this function in both validate.js and permissions.js
function getTicketFromHawkHeader(requestHeaderAuthorization, callback){
  var id = requestHeaderAuthorization.match(/id=([^,]*)/)[1].replace(/"/g, '');
  if (id === undefined || id === null || id === ''){
    return callback(Boom.unauthorized('Authorization Hawk ticket not found'));
  }

  Oz.ticket.parse(id, ENCRYPTIONPASSWORD, {}, callback);
}