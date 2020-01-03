
const request = (path, options = {}) => {

  let bpc_url = window.location.origin.replace('console', 'bpc');
  const local_bpc_url = window.localStorage.getItem('bpc_url');

  if(typeof local_bpc_url === 'string' && local_bpc_url.length > 0) {
    bpc_url = local_bpc_url;
  }

  if(!bpc_url) {
    console.error('BPC URL missing');
    return;
  }

  const _request = new Request(`${ bpc_url }${ path }`, options);

  let credentials;

  try {
    credentials =  JSON.parse(window.sessionStorage.getItem('bpc_console_ticket'));
    
    if(credentials) {
      const result = hawk.client.header(_request.url, _request.method, { credentials, app: credentials.app });
      _request.headers.set('Authorization', result.header);
    }
  } catch(ex) { }


  return fetch(_request)
  .then(response => {
    if(response.status === 200) {
      return response.json().then(data => data);
    } else if(response.status === 401 && response.message === "Expired ticket") {
      authorize(credentials);
    } else if(response.status === 401 && response.message === "Missing authentication") {
      authorize();
    } else {
      return Promise.reject(response);
    }
  });
};


const saveTicket = (credentials) => {
  window.sessionStorage.setItem('bpc_console_ticket', JSON.stringify(credentials));
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

  return fetch('/authorize', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })
  .then(response => {
    if(response.status === 200) {
      return response.json()
      .then(saveTicket)
      .then(setReissueTimeout);
    } else {
      return Promise.reject(response);
    }
  })
  .catch(err => {
    window.sessionStorage.removeItem('bpc_console_ticket');
  });
};


const unauthorize = () => {
  const options = {
    method: 'DELETE'
  };

  return fetch('/authorize', options)
  .then(response => {
    if(response.status === 200) {
      window.sessionStorage.removeItem('bpc_console_ticket');
      return Promise.resolve();
    } else {
      return Promise.reject(response);
    }
  });
};

module.exports = { request, authorize, unauthorize };
