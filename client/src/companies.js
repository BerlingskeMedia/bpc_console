const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getTicket = this.getTicket.bind(this);
    this.refreshTicket = this.refreshTicket.bind(this);
    this.saveTicket = this.saveTicket.bind(this);
    this.getCompanies = this.getCompanies.bind(this);
    this.fetchBPP = this.fetchBPP.bind(this);
    this.state = {
      authenticated: false,
      bpp_ticket: null,
      // bpp_url: 'https://bpp.berlingskemedia.net',
      // bpp_url: 'https://bpp.berlingskemedia-testing.net',
      bpp_url: 'http://bpp.local:8000'
      // bpp_url: 'http://localhost:8000'
    };
  }


  getTicket() {
    const auth = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();

    const request = new Request(`${ this.state.bpp_url }/authenticate`, {
      method: 'POST',
      body: JSON.stringify({
        id_token: auth.id_token,
        access_token: auth.access_token
      })
    });

    return fetch(request)
    .then(response => {
      if(response.status === 200) {
        return response.json()
        .then(this.saveTicket);
      } else if(response.status === 401) {
        return Promise.reject(response);
      }
    });
  }


  refreshTicket(credentials) {

    const request = new Request(`${ this.state.bpp_url }/authenticate`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    const result = hawk.client.header(request.method, request.url, { credentials, app: credentials.app });
    
    request.headers.set('Authorization', result.header);

    return fetch(request)
    .then(response => {
      if(response.status === 200) {
        return response.json()
        .then(this.saveTicket)
        .then(ticket => {
          // TODO: Set a timeout when to reissue the ticket -
          // - it must refresh it after reload if it's old
          // and it must keep reissueing it going forward
        });
      } else if(response.status === 401) {
        return Promise.reject(response);
      }
    });
  }


  saveTicket(ticket) {
    window.sessionStorage.setItem('bpp_ticket', JSON.stringify(ticket));
    this.setState({ bpp_ticket: ticket });
    return Promise.resolve(ticket);
  }


  componentDidMount() {
    // if(window.location.origin.indexOf('localhost') > -1) {
      // this.setState({
      //   bpp_url: `https://bpp.berlingskemedia-testing.net`
      // });
    // }

    let bpp_ticket;

    try {
      bpp_ticket = window.sessionStorage.getItem('bpp_ticket');
      bpp_ticket = JSON.parse(bpp_ticket);
    } catch(ex) {
      bpp_ticket = null;
    }

    if(bpp_ticket) {

      this.refreshTicket(bpp_ticket)
      .then(this.getCompanies)
    } else {

      this.getTicket()
      .then(this.getCompanies)
    }
  }


  fetchBPP(path, options) {
    const request = new Request(`${ this.state.bpp_url }${ path }`, options);
    const credentials = this.state.bpp_ticket;
    const result = hawk.client.header(request.method, request.url, { credentials, app: credentials.app });
    request.headers.set('Authorization', result.header);
    return fetch(request)
    .then(response => {
      if(response.status === 200) {
        return response.json().then(data => data);
      } else if(response.status === 401) {
        return Promise.reject(response);
      } else {
        console.log(`Unhandled statusCode ${ response.status } for request ${ request.method } ${ request.url }`)
      }
    });
  }


  getCompanies() {
    
    return this.fetchBPP(`/api/companies`)
    .then(data => {
      console.log('data', data)
    });
  }


  render() {
    return (
      <div className="companies">
        {/* <h3>Companies</h3> */}
      </div>
    );
  }
};
