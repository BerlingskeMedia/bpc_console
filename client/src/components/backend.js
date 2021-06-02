const bpc = require('./bpc');

const request = (path, options = {}) => {
  return bpc.request(path, options, window.location.origin)
};

const geoLookup = (ips) => {
  ips = ips.map(ip => {
    if (ip.lastIndexOf('/') > 0) {
      return ip.substr(0, ip.lastIndexOf('/'));
    }
    return ip;
  });
  return request(`/geoLookup/ip/${ips.join(',')}`);
}

module.exports = { geoLookup };
