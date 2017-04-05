/*jshint node: true */
'use strict';

const Boom = require('boom');
const Hawk = require('hawk');
const http = require('http');
const https = require('https');
var appTicket = {};

const CONSOLE_APPLICATION_APP_ID = process.env.CONSOLE_APPLICATION_APP_ID;
const CONSOLE_APPLICATION_APP_SECRET = process.env.CONSOLE_APPLICATION_APP_SECRET;
const CONSOLE_APPLICATION_SSO_URL = process.env.CONSOLE_APPLICATION_SSO_URL;
const CONSOLE_APPLICATION_SSO_PORT = process.env.CONSOLE_APPLICATION_SSO_PORT;


function getAppTicket() {
  var app = {
    id: CONSOLE_APPLICATION_APP_ID,
    key: CONSOLE_APPLICATION_APP_SECRET,
    algorithm: 'sha256'
  };

  callSsoServer('POST', '/ticket/app', {}, app, function(err, result){
    if (err){
      console.error(err);
      process.exit(1);
    } else {
      console.log('Got the appTicket from ' + CONSOLE_APPLICATION_SSO_URL);
      appTicket = result;
      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000);
    }
  });
};

getAppTicket();

function refreshAppTicket(){
  callSsoServer('POST', '/ticket/reissue', null, appTicket, function(err, result){
    if (err){
      console.error('refreshAppTicket:', err);
    } else {
      console.log('refreshAppTicket (console)', result);
      appTicket = result;
      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000);
    }
  });
};


module.exports.getUserTicket = function(rsvp, callback) {
  callSsoServer('POST', '/ticket/user', {rsvp: rsvp}, appTicket, callback);
};


module.exports.refreshUserTicket = function(userTicket, callback){
  callSsoServer('POST', '/ticket/refresh', null, userTicket, callback);
};


module.exports.getApplications = function(userTicket, callback){
  callSsoServer('GET', '/admin/applications', null, userTicket, callback);
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
    hostname: CONSOLE_APPLICATION_SSO_URL,
    port: CONSOLE_APPLICATION_SSO_PORT,
    // path: path.concat('?apiKey=', GIGYA_APP_KEY, '&userKey=', GIGYA_USER_KEY, '&secret=', GIGYA_SECRET_KEY, parameters),
    path: path.concat(parameters.length > 0 ? '?' : '', parameters.join('&')),
    method: method,
    headers: {
      // 'Authorization': 'Basic ' + authorization
    }
  };
  if (credentials !== undefined && credentials !== null && Object.keys(credentials).length > 1){
    options.headers = {
      'Authorization': Hawk.client.header('http://'.concat(options.hostname, ':', options.port, options.path), method, {credentials: credentials, app: CONSOLE_APPLICATION_APP_ID}).field
    };
  }

  var req = http.request(options, parseReponse(callback));

  if (method !== 'GET' && body !== null && typeof body === 'object'){
    req.write(JSON.stringify(body));
  }

  req.end();

  req.on('error', function (e) {
    callback(e);
  });
}
module.exports.request = callSsoServer;


function parseReponse (callback) {
  return function (res) {
    var data = '';

    res.on('data', function(d) {
      data = data + d;
    });

    res.on('end', function () {
      try {
        if (data.length > 0){
          data = JSON.parse(data);
        }
      } catch (ex) {
        console.error('JSON parse error on: ', data);
        throw ex;
      }


      if (res.statusCode > 300) {
        var err = Boom.wrap(new Error(data.error), data.statusCode, data.message);
        err.data = data;
        callback(err, null);
      }
      else
        callback(null, data);
    });
  };
}
