/*jshint node: true */
'use strict';

const Boom = require('boom');
const Hawk = require('hawk');
const http = require('http');
const https = require('https');
var appTicket = {};

const POC_APPLICATION_APP_ID = process.env.POC_APPLICATION_APP_ID;
const POC_APPLICATION_APP_SECRET = process.env.POC_APPLICATION_APP_SECRET;
const POC_APPLICATION_SSO_URL = process.env.POC_APPLICATION_SSO_URL;
const POC_APPLICATION_SSO_PORT = process.env.POC_APPLICATION_SSO_PORT;


module.exports.getAppTicket = function(callback) {
  var app = {
    id: POC_APPLICATION_APP_ID,
    key: POC_APPLICATION_APP_SECRET,
    algorithm: 'sha256'
  };
  callSsoServer('POST', '/oz/app', {}, app, callback);
};


module.exports.getAppTicket(function(err, result){
  if (err){
    console.error(err);
    process.exit(1);
  } else {
    console.log('Got the appTicket');
    appTicket = result;
  }
});


module.exports.validateAppTicket = function(appTicket, callback){
  callSsoServer('POST', '/cognito/validateappticket', {}, appTicket, callback);
};


module.exports.getUserTicket = function(rsvp, callback) {
  callSsoServer('POST', '/oz/rsvp', {rsvp: rsvp}, appTicket, callback);
};


module.exports.validateUserTicket = function(userTicket, callback){
  callSsoServer('POST', '/cognito/validateuserticket', {}, userTicket, callback);
};


function callSsoServer(method, path, body, credentials, callback) {
  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = null;
  }

  var parameters = [];

  if (method === 'GET' && body !== null && typeof body === 'object'){
    var temp = [];
    Object.keys(body).forEach(function (k){
      parameters.push(k.concat('=', body[k]));
    });
  }

  var options = {
    // hostname: 'berlingske-poc.local',
    hostname: POC_APPLICATION_SSO_URL,
    port: POC_APPLICATION_SSO_PORT,
    // path: path.concat('?apiKey=', GIGYA_APP_KEY, '&userKey=', GIGYA_USER_KEY, '&secret=', GIGYA_SECRET_KEY, parameters),
    path: path.concat(parameters.length > 0 ? '?' : '', parameters.join('&')),
    method: method,
    headers: {
      // 'Authorization': 'Basic ' + authorization
    }
  };

  if (credentials !== null && Object.keys(credentials).length > 1){
    options.headers = {
      'Authorization': Hawk.client.header('http://'.concat(options.hostname, ':', options.port, options.path), method, {credentials: credentials, app: POC_APPLICATION_APP_ID}).field
    };
  }

  var req = http.request(options, parseReponse(callback));

  if (method !== 'GET' && body !== null && typeof body === 'object'){
    req.write(JSON.stringify(body));
  }

  req.end();

  req.on('error', function (e) {
    console.log(Date().toString(), 'Error on request to ' + path, e);
    callback(e);
  });
}


function parseReponse (callback) {
  return function (res) {
    var data = '';

    res.on('data', function(d) {
      data = data + d;
    });

    res.on('end', function () {
      try {
        data = JSON.parse(data);
      } catch (ex) {
        console.log('JSON parse error on: ', data);
        throw ex;
      }


      // Gigya responds HTTP 200 OK even on errors.
      if (data.statusCode > 300 || res.statusCode > 300) {
        var err = Boom.wrap(new Error(data.error), data.statusCode);
        callback(err, null);
      }
      else
        callback(null, data);
    });
  };
}
