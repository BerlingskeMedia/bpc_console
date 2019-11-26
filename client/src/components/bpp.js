
const request = (path, options = {}) => {

  let bpp_url = window.location.origin.replace('console', 'bpp');
  const local_bpp_url = window.localStorage.getItem('bpp_url');

  if(typeof local_bpp_url === 'string' && local_bpp_url.length > 0) {
    bpp_url = local_bpp_url;
  }

  if(!bpp_url) {
    console.error('BPP URL missing');
    return;
  }

  const _request = new Request(`${ bpp_url }${ path }`, options);

  let credentials;
  try {
    credentials =  JSON.parse(window.sessionStorage.getItem('bpp_ticket'));

    if(credentials) {
      const result = hawk.client.header(_request.url, _request.method, { credentials, app: credentials.app });
      _request.headers.set('Authorization', result.header);
    }
  } catch(ex) { }
  

  return fetch(_request)
  .then(response => {
    if(response.status === 200) {
      return response.json().then(data => data);
    } else {
      return Promise.reject(response);
    }
  });
};

const saveTicket = (credentials) => {
  window.sessionStorage.setItem('bpp_ticket', JSON.stringify(credentials));
  return Promise.resolve(credentials);
};


const setReissueTimeout = (credentials) => {
  setTimeout(() => authorize(credentials), credentials.exp - Date.now() - 10000);
  return Promise.resolve(credentials);
};


const authorize = (credentials) => {
  return request('/authenticate', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })
  .then(saveTicket)
  .then(setReissueTimeout)
  .catch(err => {
    window.sessionStorage.removeItem('bpp_ticket');
  });
};


const unauthorize = () => {
  const options = {
    method: 'DELETE'
  };

  return request('/authenticate', options)
  .then(() => {
    window.sessionStorage.removeItem('bpp_ticket');
  });
};


module.exports = { request, authorize, unauthorize };