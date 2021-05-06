const Hawk = require('@hapi/hawk/lib/browser');

const request = (path, options = {}) => {

  let pm_url = window.location.origin.replace('console', 'payment');
  const local_pm_url = window.localStorage.getItem('pm_url');

  if(typeof local_pm_url === 'string' && local_pm_url.length > 0) {
    pm_url = local_pm_url;
  } else if (process.env.PM_URL !== '') {
    pm_url = process.env.PM_URL;
  }

  if(!pm_url) {
    console.error('PaymentManager URL missing');
    return;
  }

  const opt = {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json'
    }
  };

  const _request = new Request(`${ pm_url }${ path }`, opt);

  let credentials;
  try {
    credentials =  JSON.parse(window.sessionStorage.getItem('pm_ticket'));

    if(credentials) {
      const result = Hawk.client.header(_request.url, _request.method, { credentials, app: credentials.app });
      _request.headers.set('Authorization', result.header);
    }
  } catch(ex) { }

  return fetch(_request)
    .then(response => {

      if(response.status === 200) {
        return response.json().then(data => data);
      } else if(response.status === 401) {
        authorize(credentials)
          .then(ticket => {
            if(ticket) {
              window.location.reload();
            }
          });
      }

      return Promise.reject(response);
    });
};


const saveTicket = (credentials) => {
  window.sessionStorage.setItem('pm_ticket', JSON.stringify(credentials));
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
      window.sessionStorage.removeItem('pm_ticket');
    });
};


const unauthorize = () => {
  const options = {
    method: 'DELETE'
  };

  return request('/authenticate', options)
    .then(() => {
      window.sessionStorage.removeItem('pm_ticket');
    });
};


const getRoles = () => {
  try {
    let credentials =  JSON.parse(window.sessionStorage.getItem('pm_ticket'));
    return credentials.scope.filter(s => s.startsWith('role:'));
  } catch(err) {
    return [];
  }
};

const isAccessAdmin = () => {
  const roles = getRoles();
  return roles.some(scope => scope.endsWith('accessrules:admin'));
};


module.exports = { request, authorize, unauthorize, getRoles, isAccessAdmin };
