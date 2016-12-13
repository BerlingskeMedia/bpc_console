/*jshint node: true */
'use strict';

const Boom = require('boom');
const Oz = require('oz');
const crypto = require('crypto');
const AWS = require('aws-sdk');
const Facebook = require('./facebook');
const MongoDB = require('./mongodb_client');

//Declaration of all properties linked to the environment (beanstalk configuration)
const ENCRYPTIONPASSWORD = process.env.ENCRYPTIONPASSWORD;
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;
const AWS_REGION = process.env.AWS_REGION;
const COGNITO_IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID;
const IAM_ROLE_ARN = process.env.IAM_ROLE_ARN;
const COGNITO_DATASET_NAME = process.env.COGNITO_DATASET_NAME;
const COGNITO_KEY_NAME = process.env.COGNITO_KEY_NAME;
const CALLBACKURL = process.env.CALLBACKURL;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var AWS_SESSION_TOKEN = '';

// if (process.env.AWS_ACCESS_KEY_ID === undefined || process.env.AWS_SECRET_ACCESS_KEY === undefined){
//   console.error('AWS credentials are missing');
//   process.exit(0);
// }

AWS.config.region = AWS_REGION;
AWS.config.update({
  // accessKeyId: AWS_ACCESS_KEY_ID,
  // secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION
});

var cognitoIdentity = new AWS.CognitoIdentity();
var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();


//Params for making the API call
// var params = {
//   AccountId: AWS_ACCOUNT_ID, // AWS account Id
//   RoleArn: IAM_ROLE_ARN, // IAM role that will be used by authentication
//   IdentityPoolId: COGNITO_IDENTITY_POOL_ID, //ID of the identity pool
//   Logins: {
//     // 'www.amazon.com': AMAZON_TOKEN //Token given by Amazon
//   }
// };

//Initialize the Credentials object
// AWS.config.credentials = new AWS.CognitoIdentityCredentials(params);


// var poolData = {
//   UserPoolId : COGNITO_IDENTITY_POOL_ID,
//   ClientId : '5tv5te4df577992koo6mo7t6me',
//   Paranoia : 7
// };


// Call to Amazon Cognito, get the credentials for our user
// AWS.config.credentials.get(err,data){…}

module.exports.register = function (server, options, next) {

  var oneday = 1000 * 60 * 60 * 24;
  var onemonth = oneday * 30;

  server.state('ii', {
    ttl: oneday,
    isHttpOnly: false,
    isSecure: false,
    isSameSite: false,
    path: '/'
  });

  server.state('il', {
    ttl: oneday,
    isHttpOnly: false,
    isSecure: false,
    isSameSite: false,
    path: '/'
  });

  server.state('ll', {
    ttl: oneday,
    isHttpOnly: false,
    isSecure: false,
    isSameSite: false,
    path: '/',
    encoding: 'base64json'
  });




  server.route({
    method: 'GET',
    path: '/',
    config: {
      cors: false,
      auth: false,
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log' // may also be 'ignore' or 'log'
      }
    },
    handler: function (request, reply) {
      console.log('GET / state', request.state);
      console.log('GET / query', request.query);

      var logins;

      var app = request.query.app;
      if (app === undefined || app === null){
        return reply(Boom.unauthorized('Missing app parameter'));
      }

      if (request.state.ll){
        logins = request.state.ll;
      } else if (request.query.Logins){
        logins = request.query.Logins;
      } else {
        var temp = Object.keys(request.query).map(f).join('&');
        return reply.redirect('/cognito.html?'.concat(temp));
      }

      createUserRsvp(app, logins, function(err, rsvp){
        if (err){
          return reply(err);
        }
        // After granting app access, the user returns to the app with the rsvp
        if (request.query.returnUrl) {
          console.log('redirecting to main page with returnUrl');
          reply.redirect(request.query.returnUrl.concat('?rsvp=', rsvp));
        } else {
          reply(rsvp)
            .header('X-RSVP-TOKEN', rsvp);
        }
      });

      function f(k){
        return k.concat('=', request.query[k]);
      }
    }
  });



  server.route({
    method: 'POST',
    path: '/',
    config: {
      auth: false,
      cors: {
        credentials: true,
        origin: ['*'],
        // access-control-allow-methods:POST
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 86400
      },
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log' // may also be 'ignore' or 'log'
      }
    },
    handler: function (request, reply) {
      console.log('POST / headers', request.headers);
      console.log('POST / payload', request.payload);

      var app = request.payload.app;
      if (app === undefined || app === null){
        return reply(Boom.unauthorized('Missing app parameter'));
      }

      var logins;
      if (request.state.ll){
        logins = request.state.ll;
      } else if (request.payload.Logins){
        logins = request.payload.Logins;
      } else {
        return reply(Boom.unauthorized());
      }

      createUserRsvp(app, logins, function(err, rsvp){
        if (err){
          return reply(err);
        }
        // After granting app access, the user returns to the app with the rsvp
        reply(rsvp)
          .header('X-RSVP-TOKEN', rsvp);
      });
    }
  });



  server.route({
    method: 'POST',
    path: '/register',
    config: {
      auth: false
    },
    handler: function(request, reply) {

      console.log('');
      console.log('registerUser', request.payload);

      // if (request.payload.IdentityId === undefined || request.payload.IdentityId === null){
      //   return reply(Boom.badRequest('Parameter IdentityId missing'));
      // }

      if (request.payload.Logins === undefined || request.payload.Logins === null){
        return reply(Boom.badRequest('Parameter Logins missing'));
      }

      // if (request.payload.AccessToken === undefined || request.payload.AccessToken === null){
      //   return reply(Boom.badRequest('Parameter AccessToken missing'));
      // }

      var logins = request.payload.Logins;

      var params = {
        IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
        AccountId: AWS_ACCOUNT_ID,
        Logins: logins
      };

      cognitoIdentity.getId(params, function(err, data) {
        if (err) {
          console.log(err);
          reply(Boom.unauthorized('Error getting IdentityId'));
        } else if (data.IdentityId === undefined || data.IdentityId === null) {
          reply(Boom.unauthorized('IdentityId could not be found'));
        } else {

          var IdentityId = data.IdentityId;

          MongoDB.collection('users').findOne({IdentityId: IdentityId}, {fields:{IdentityId:1, Permissions: 1}}, function(err, user) {
            if (err) {
              console.log(err);
              reply(Boom.badImplementation());
            } else if(user === null){
              MongoDB.collection('users').insertOne({
                IdentityId: IdentityId,
                IdentityProvider: Object.keys(logins)[0],
                Logins: JSON.stringify(logins),
                Permissions: [
                  '*:read'
                ]
              }, function(err, result){
                if (err) {
                  console.log(err);
                  reply(Boom.badImplementation());
                } else if(result.ok !== 1){
                  console.log('result', result);
                  reply(Boom.badImplementation());
                } else {
                  done()
                }
              });
            } else {
              done();
            }
          });

          function done(){
            reply()
            .state('ii', IdentityId)
            .state('il', Object.keys(logins)[0])
            .state('ll', logins);
          }
        }
      });

      // var cognitoIdentityCredentials = new AWS.CognitoIdentityCredentials({
      //   IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
      //   Logins: logins
      // });
      //
      // cognitoIdentityCredentials.get(function(err){
      //   if (err) {
      //     return reply(Boom.unauthorized());
      //   }
      //
      //   var IdentityId = cognitoIdentityCredentials.identityId;
      //
      //   if (temp_users[IdentityId] === undefined || temp_users[IdentityId] === null){
      //     temp_users[IdentityId] = {};
      //   }
      //
      //   temp_users[IdentityId].CognitoIdentityCredentials = cognitoIdentityCredentials;
      //
      //   temp_users[IdentityId].Permissions = [
      //     '*:read'
      //   ];




        // We need AccessToken to get the profile data

        // if (logins['graph.facebook.com']){
        //   Facebook.getProfile({access_token: cognitoIdentityCredentials.params.Logins['graph.facebook.com']}, function(err, response){
        //     temp_users[IdentityId].FacebookProfile = response;
        //   });
        // }
        //
        // var cognitoLogin = Object.keys(logins).find((k) => {return k.indexOf('cognito') > -1;});
        // console.log('cognitoLogin', cognitoLogin);
        // if(cognitoLogin){
        //   cognitoIdentityServiceProvider.getUser({AccessToken: cognitoIdentityCredentials.params.Logins[cognitoLogin]}, function(err, data){
        //     console.log('getUser', err, data);
        //     if (err) {
        //       // return reply(err);
        //     } else if (data === null) {
        //       // return reply(Boom.unauthorized());
        //       // } else if (data.Username !== request.payload.username) {
        //       //   return reply(Boom.unauthorized());
        //     } else {
        //       temp_users[IdentityId].CognitoUser = data;
        //     }
        //   });
        // }


      // });

      //
      // var params = {
      //   IdentityId: request.payload.IdentityId,
      //   Logins: request.payload.Logins
      // };
      //
      // // cognitoIdentity.getOpenIdToken(params, function(err, data) {
      // //   console.log('getOpenIdToken', err, data);
      // // });
      //
      // cognitoIdentity.getCredentialsForIdentity(params, function(err, data) {
      //   console.log('getCredentialsForIdentity', data, err);
      //   if (err) {
      //     return reply(Boom.unauthorized());
      //   } else if (request.payload.SessionToken !== data.Credentials.SessionToken){
      //     // return reply(Boom.unauthorized());
      //   }
      //
      //   temp_users[IdentityId].CognitoIdentityCredentials = data.Credentials;
      //
      //   Facebook.getProfiles({access_token: params.Logins['graph.facebook.com']}, function(err, response){
      //     temp_users[IdentityId].FacebookProfile = response;
      //   });
      //
      //
      //   reply();
      // });
    }
  });




  server.route({
    method: 'POST',
    path: '/auth',
    config: {
      auth: false,
      cors: {
        credentials: true,
        origin: ['*'],
        // access-control-allow-methods:POST
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'Cookie'],
        exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 86400
      },
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log' // may also be 'ignore' or 'log'
      }
    },
    handler: function(request, reply){

      console.log('');
      console.log('authUser');

      var logins;
      if (request.state.ll){
        logins = request.state.ll;
      } else if (request.payload.Logins){
        logins = request.payload.Logins;
      } else {
        return reply(Boom.unauthorized());
      }

      console.log('logins', logins);

      var cognitoIdentityCredentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
        Logins: logins
      });

      cognitoIdentityCredentials.get(function(err){
        if (err) {
          console.error(err);
          reply(Boom.unauthorized(err.message));
        } else {
          reply(cognitoIdentityCredentials);
        }
      });
    }
  });




  server.route({
    method: 'POST',
    path: '/signout',
    config: {
      auth: false,
      cors: {
        credentials: true,
        origin: ['*'],
        // access-control-allow-methods:POST
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 86400
      },
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log' // may also be 'ignore' or 'log'
      }
    },
    handler: function(request, reply){
      reply()
        .unstate('ii')
        .unstate('il')
        .unstate('ll');
    }
  });



  server.route({
    method: 'POST',
    path: '/validateticket',
    config: {
      auth: {
        strategy: 'oz',
        access: {
          scope: false,
          entity: 'any'
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
        parse: true, // parse and store in request.state
        failAction: 'log' // may also be 'ignore' or 'log'
      }
    },
    handler: function(request, reply) {
      console.log('validateticket');
      reply({});
    }
  });



  server.route({
    method: 'POST',
    path: '/validateappticket',
    config: {
      auth: {
        strategy: 'oz',
        access: {
          scope: false,
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
        parse: true, // parse and store in request.state
        failAction: 'log' // may also be 'ignore' or 'log'
      }
    },
    handler: function(request, reply) {
      console.log('validateappticket');
      reply({});
    }
  });



  server.route({
    method: 'POST',
    path: '/validateuserticket',
    config: {
      auth: {
        strategy: 'oz',
        access: {
          scope: false,
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
        parse: true, // parse and store in request.state
        failAction: 'log' // may also be 'ignore' or 'log'
      }
    },
    handler: function(request, reply) {
      console.log('validateuserticket');
      reply({});
    }
  });



  server.route({
    method: 'POST',
    path: '/permissions',
    config: {
      cors: {
        credentials: true,
        origin: ['*'],
        // access-control-allow-methods:POST
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 86400
      },
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log' // may also be 'ignore' or 'log'
      }
    },
    handler: function(request, reply) {

      console.log('');
      console.log('validateUser');
      console.log('PAYLOAD', request.payload);
      // console.log('STATE', request.state);

      // TODO: Validate accessToken
      // - Check the iss claim. It should match your user pool. For example, a user pool created in the us-east-1 region will have an iss value of https://cognito-idp.us-east-1.amazonaws.com/{userPoolId}.
      // - Check the token_use claim.

      //   If you are only accepting the access token in your web APIs, its value must be access.
      //   If you are only using the ID token, its value must be id.
      //   If you are using both tokens, the value is either id or access.

      // - Verify the signature of the decoded JWT token.
      // - Check the exp claim and make sure the token is not expired.

      // See "To verify a signature for ID and access tokens" on https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html


      // var accessToken = request.payload.accessToken;
      // var idToken = request.payload.idToken;

      if (request.payload === null){
        return reply(Boom.unauthorized('Payload missing'));
      }

      var identityId = request.payload.IdentityId !== undefined && request.payload.IdentityId !== null ? request.payload.IdentityId :
                       request.payload.identityId !== undefined && request.payload.identityId !== null ? request.payload.identityId : null;

      if (identityId === null){
        return reply(Boom.unauthorized('IdentityId missing'));
      }


      if (request.payload.sessionToken) {
        var accessKeyId = request.payload.accessKeyId ? request.payload.accessKeyId : '';
        var secretKey = request.payload.secretKey ? request.payload.secretKey : '';
        var creds = new AWS.Credentials(accessKeyId, secretKey, request.payload.sessionToken);
        console.log('creds', creds);

        if(creds.expired){
          reply(Boom.unauthorized());
        } else {
          getUserPermissions(identityId, reply);
        }
      } else {

        var logins;

        if (request.state.ll) {
          logins = request.state.ll;
        } else if (request.payload.Logins) {
          logins = request.payload.Logins;
        } else {
          return reply(Boom.unauthorized());
        }

        console.log('logins', logins);

        var params = {
          IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
          AccountId: AWS_ACCOUNT_ID,
          Logins: logins
        };

        cognitoIdentity.getId(params, function(err, data) {
          console.log('getId', err, data);
          if (err) {
            console.log(err);
            reply(Boom.unauthorized());
          } else if (data.IdentityId === undefined || data.IdentityId === null) {
            reply(Boom.unauthorized('user not found'));
          } else if (data.IdentityId !== request.state.ii) {
            reply(Boom.unauthorized('cookie mismatch'));
          } else {
            getUserPermissions(data.IdentityId, reply);
          }
        });
      }

      function getUserPermissions(IdentityId, callback){
        MongoDB.collection('users').findOne({IdentityId: IdentityId}, {fields: {_id: 0, Permissions: 1}}, function (err, result){
          if (err) {
            console.log(err);
            callback(Boom.unauthorized());
          } else {
            callback(null, result);
          }
        });
      }


      // var cognitoIdentityCredentials = new AWS.CognitoIdentityCredentials({
      //   IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
      //   Logins: logins
      // });
      //
      // cognitoIdentityCredentials.get(function(err){
      //   if (err) {
      //     return reply(Boom.unauthorized());
      //   }
      //
      //   if (new Date(cognitoIdentityCredentials.Expiration) < Date.now()) {
      //     reply(Boom.unauthorized('Session expired'));
      //   } else {
      //
      //     var user = temp_users[cognitoIdentityCredentials.identityId];
      //
      //     reply(user);
      //   }
      // });




      // var params = {
      //   IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
      //   AccountId: AWS_ACCOUNT_ID,
      //   Logins: logins
      // };
      //
      // cognitoIdentity.getId(params, function(err, data) {
      //   console.log('getId', err, data); // successful response
      //   if (err) {
      //     reply(Boom.unauthorized());
      //   } else if (data.IdentityId === undefined || data.IdentityId === null) {
      //     reply(Boom.unauthorized());
      //   } else {
      //
      //     var params = {
      //       IdentityId: data.IdentityId,
      //       Logins: logins
      //     };
      //
      //     cognitoIdentity.getOpenIdToken(params, function(err, data) {
      //       console.log('getOpenIdToken', err, data);
      //     });
      //
      //     cognitoIdentity.getCredentialsForIdentity(params, function(err, data) {
      //       console.log('getCredentialsForIdentity', err, data);
      //       if (err) {
      //         reply(Boom.unauthorized());
      //       } else {
      //         // TODO
      //         if (new Date(data.Expiration) < Date.now()) {
      //           reply(Boom.unauthorized('Session expired'));
      //         } else {
      //
      //           var user = temp_users[data.IdentityId];
      //           console.log('user', user);
      //
      //           reply(user);
      //         }
      //       }
      //     });
      //   }
      // });

      // if(Object.keys(logins).some((k) => {return k.indexOf('facebook') > -1;})){
      //
      // } else if(Object.keys(logins).some((k) => {return k.indexOf('cognito') > -1;})){
      //   cognitoIdentityServiceProvider.getUser({AccessToken: accessToken}, function(err, data){
      //     console.log('getUser', err, data);
      //     if (err) {
      //       // return reply(err);
      //     } else if (data === null) {
      //       // return reply(Boom.unauthorized());
      //       // } else if (data.Username !== request.payload.username) {
      //       //   return reply(Boom.unauthorized());
      //     } else {
      //       // if (request.payload.permissions.indexOf('read:*') > -1) {
      //       // }
      //       // reply();
      //     }
      //   });
      // }
    }
  });


  next();
};


module.exports.register.attributes = {
  name: 'cognito',
  version: '1.0.0'
};


module.exports.loadAppFunc = function(id, callback) {
  console.log('loadAppFunc', id);
  MongoDB.collection('applications').findOne({id:id}, {fields: {_id: 0}}, function(err, app) {
    if (err) {
      return callback(err);
    } else if (app === null){
      callback(Boom.unauthorized('Unknown application'));
    } else {
      callback(null, app);
    }
  });
};


module.exports.loadGrantFunc = function(id, next) {
  console.log('loadGrantFunc', id);
  MongoDB.collection('grants').findOne({id:id}, {fields: {_id: 0}}, function(err, grant) {
    if (err) {
      return next(err);
    } else if (grant === null) {
      next(Boom.unauthorized('Missing grant'));
    } else {
      grant.exp = Oz.hawk.utils.now() + (60000 * 60); // 60000 = 1 minute
      next(null, grant);
    }
  });
};


function createUserRsvp(app_id, logins, callback){
  MongoDB.collection('applications').findOne({id: app_id}, {fields: {_id: 0}}, function(err, app){
    if (err) {
      console.error(err);
      return callback(Boom.unauthorized(err.message));
    } else if (app === null){
      return callback(Boom.unauthorized('Unknown application'));
    }

    var cognitoIdentityCredentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
      Logins: logins
    });

    cognitoIdentityCredentials.get(function(err){
      if (err) {
        console.error(err);
        return callback(Boom.unauthorized(err.message));
      }

      MongoDB.collection('grants').findOne({user: cognitoIdentityCredentials.identityId}, {fields: {_id: 0}}, function(err, grant){
        if (err) {
          console.error(err);
          return callback(Boom.unauthorized(err.message));
        } else if (grant === null){
          return callback(Boom.unauthorized('Missing grant'));
        }

        grant.exp = Oz.hawk.utils.now() + (60000 * 60); // 60000 = 1 minute

        Oz.ticket.rsvp(app, grant, ENCRYPTIONPASSWORD, {}, (err, rsvp) => {
          if (err){
            console.error(err);
            return callback(err);
          }
          // After granting app access, the user returns to the app with the rsvp
          callback(null, rsvp);
        });
      });
    });
  });
}
