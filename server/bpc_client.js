/*jshint node: true */
'use strict';

const Boom = require('boom');
const Hawk = require('hawk');
const http = require('http');
const https = require('https');
const Url = require('url');
var appTicket = {};
var BPC_URL;

try {
  BPC_URL = Url.parse(process.env.BPC_URL);
} catch (ex) {
  console.error('Env var BPC_URL missing or invalid.');
  process.exit(1);
}

const BPC_APP_ID = process.env.BPC_APP_ID;
const BPC_APP_SECRET = process.env.BPC_APP_SECRET;

console.log('Connecting to BPC on', BPC_URL.host, 'AS', BPC_APP_ID);

module.exports.env = function() {
  return {
    href: BPC_URL.href,
    app_id: BPC_APP_ID,
  };
};

function getAppTicket() {
  var app = {
    id: BPC_APP_ID,
    key: BPC_APP_SECRET,
    algorithm: 'sha256'
  };

  callSsoServer({path: '/ticket/app', method: 'POST'}, {}, app, function(err, result){
    if (err){
      console.error(err);
      process.exit(1);
    } else {
      console.log('Got the appTicket');
      appTicket = result;
      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000);
    }
  });
};

getAppTicket();


function refreshAppTicket(){
  callSsoServer({path: '/ticket/reissue', method: 'POST'}, null, appTicket, function(err, result){
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
  callSsoServer({path: '/ticket/user', method: 'POST'}, {rsvp: rsvp}, appTicket, callback);
};


module.exports.refreshUserTicket = function(userTicket, callback){
  callSsoServer({path: '/ticket/reissue', method: 'POST'}, null, userTicket, callback);
};


module.exports.getApplications = function(userTicket, callback){
  callSsoServer({path: '/admin/applications'}, null, userTicket, callback);
};


function callSsoServer(options, body, credentials, callback) {
  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = null;
  }

  options.protocol = BPC_URL.protocol;
  options.hostname = BPC_URL.hostname;
  if (BPC_URL.port){
    options.port = BPC_URL.port;
  }

  var parameters = [];

  if ((options.method === undefined || options.method === null || options.method === 'GET') && body !== null && typeof body === 'object'){
    var temp = [];
    Object.keys(body).forEach(function (k){
      parameters.push(k.concat('=', body[k]));
    });

    if (parameters.length > 0) {
      options.path = options.path.concat('?', parameters.join('&'));
    }
  }


  // In case we want a request completely without any credentials, use {} as the credentials parameter to this function
  if (credentials === undefined || credentials === null){
    credentials = appTicket;
  }

  if (credentials !== undefined && credentials !== null && Object.keys(credentials).length > 1){
    var requestHref = Url.resolve(BPC_URL.href, options.path);
    var hawkHeader = Hawk.client.header(requestHref, options.method || 'GET', {credentials: credentials, app: BPC_APP_ID});
    if (hawkHeader.err) {
      console.error(hawkHeader.err);
      return callback(new Error('Hawk header: ' + hawkHeader.err));
    }

    options.headers = {
      'Authorization': hawkHeader.field
    };
  }

  var reqHandler = https;
  if (options.protocol === 'http:') {
    reqHandler = http;
  }

  var req = reqHandler.request(options, parseReponse(callback));

  if (options.method !== null && options.method !== 'GET' && body !== null && typeof body === 'object'){
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
        var err = Boom.wrap(new Error(data.error), res.statusCode, data.message);
        err.data = data;

        if (res.statusCode === 401 && data.message === 'Expired ticket'){
          getAppTicket();
        }

        callback(err, null);
      }
      else
        callback(null, data);
    });
  };
}
