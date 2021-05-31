'use strict';
const path = require('path');
const geolite2 = require('geolite2-redist');
const maxmind = require('maxmind');

async function init(dbsPath) {
  await geolite2.downloadDbs(path.resolve(__dirname, dbsPath));
}

async function getCitiesByIps(ips) {
  const cityLookup = await geolite2.open('GeoLite2-City', path => {
    return maxmind.open(path);
  });
  const ipsToCities = new Map();
  for (let ip of ips) {
    ipsToCities.set(ip, cityLookup.get(ip));
  }
  cityLookup.close();

  return ipsToCities;
}

async function getCountriesByIps(ips) {
  const countryLookup = await geolite2.open('GeoLite2-Country', path => {
    return maxmind.open(path);
  });
  const ipsToCountries = new Map();
  for (let ip of ips) {
    ipsToCountries.set(ip, countryLookup.get(ip));
  }
  countryLookup.close();

  return ipsToCountries;
}

async function getGeo(ips) {
  const [citiesByIps, countriesByIps] = await Promise.all([getCitiesByIps(ips), getCountriesByIps(ips)]);

  return ips.map(ip => ({ip, ...citiesByIps.get(ip), ...countriesByIps.get(ip)}));
}

function geoDataToDto(data) {
  return {
    ip: data.ip,
    city: data.city.names.en,
    country: data.country.names.en,
  }
}

module.exports = {
  name: 'geolookup',
  version: '1.0.0',
  init,
  register: function (server) {
    server.route({
      method: 'GET',
      path: '/ip/{ips}',
      config: {
        auth: {
          strategy: 'bpc',
          scope: ['admin'],
          entity: 'user'
        },
        cors: true,
      },
      handler: async function (request, h) {
        try {
          const geo = await getGeo(request.params.ips.split(','));
          return geo.map(geoDataToDto);
        } catch (e) {
          console.error(e);
        }
        return [];
      }
    });
  }
}
