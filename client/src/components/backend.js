const bpc = require('./bpc');

const request = (path, options = {}) => {
  return bpc.request(path, options, window.location.origin)
};

module.exports = { request };
