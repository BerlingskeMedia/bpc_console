
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
    } else if(response.status === 401) {
      authorize(credentials)
      .then(ticket => window.location.reload());
    }

    return Promise.reject(response);
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
  if (!credentials) {
    const auth = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();
    credentials = {
      id_token: auth.id_token,
      access_token: auth.access_token
    };
  }

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


const getRoles = () => {
  try {
    let credentials =  JSON.parse(window.sessionStorage.getItem('bpp_ticket'));
    return credentials.scope.filter(s => s.startsWith('role:'));
  } catch(err) {
    return [];
  }
};


const isCompanyAdmin = () => {
  const roles = getRoles();
  return roles.some(scope => scope.endsWith('companies:admin'));
};


const isCompanyUser = () => {
  const roles = getRoles();
  return roles.some(scope => scope.endsWith('companies:user'));
};


const isAccessAdmin = () => {
  const roles = getRoles();
  return roles.some(scope => scope.endsWith('accessrules:admin'));
};


module.exports = { request, authorize, unauthorize, getRoles, isCompanyUser, isCompanyAdmin, isAccessAdmin };
