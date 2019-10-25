const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getTicket = this.getTicket.bind(this);
    this.getCompanies = this.getCompanies.bind(this);
    this.state = {
      authenticated: false,
      // bpp_url: 'https://bpp.berlingskemedia.net',
      bpp_url: 'https://bpp.berlingskemedia-testing.net',
      // bpp_url: 'http://bpp.local:8000',
    };
  }


  componentDidMount() {
    console.log(window.location)
    if(window.location.origin.indexOf('localhost') > -1) {
      // this.setState({
      //   bpp_url: `https://bpp.berlingskemedia-testing.net`
      // });
    }

    const a = {
      credentials: 'include'
    };

    const request = new Request(`${ this.state.bpp_url }/authenticate`, {
      credentials: 'include'
    });

    fetch(request)
    .then(response => {
      if(response.status === 200) {

        this.getCompanies();

        return response.json()
        .then(data => console.log(data));
      } else if(response.status === 401) {
        this.getTicket()
        .then(this.getCompanies);
      }
    });
  }


  getTicket() {
    const auth = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();
    const payload = {
      id_token: auth.id_token,
      access_token: auth.access_token
    };

    const request = new Request(`${ this.state.bpp_url }/authenticate`, {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'same-origin',
      headers: new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      })
    });

    return fetch(request)
    .then(response => {
      if(response.status === 200) {

        return response.json()
        .then(data => console.log(data));
      } else if(response.status === 401) {

      }
    });
  }


  getCompanies() {
    console.log('getCompanies')
    const request = new Request(`${ this.state.bpp_url }/api/companies`, {
      credentials: 'include'
    });

    return fetch(request)
    .then(response => {
      if(response.status === 200) {

        return response.json()
        .then(data => console.log(data));
      } else if(response.status === 401) {

      }
    });
  }


  validateAuthentication() {

  }

    // const request = new Request('/authenticate', {
    //   method: 'POST',
    //   body: JSON.stringify(credentials),
    //   headers: new Headers({
    //       'Accept': 'application/json',
    //       'Content-Type': 'application/json'
    //   })
    // });

    // return fetch(request);

    // return fetch(request)
    // .then(response => {
    //     if(response.status === 200) {
    //         return response.json()
    //         .then(ticket => setTicketReissueTimeout(ticket));
    //     } else if(response.status === 401) {
    //         return getUserTicket(_googleUser);
    //     } else {
    //         return Promise.reject(response);
    //     }
    // })
    // .catch(error => {
    //     console.error(error);
    //     return Promise.reject();
    // });


  render() {
    return (
      <div className="companies">
        {/* <h3>Companies</h3> */}
      </div>
    );
  }
};