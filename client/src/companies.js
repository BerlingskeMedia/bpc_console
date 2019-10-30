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
      companies: [],
      authenticated: false,
      bpp_ticket: null,
      // bpp_url: null,
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
    this.setState({ bpp_ticket: ticket, authenticated: true });
    return Promise.resolve(ticket);
  }


  componentDidMount() {
    if(!this.state.bpp_url) {
      const bpp_url = window.location.origin.replace('console', 'bpp');
      this.setState({ bpp_url });
    }

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
    .then(companies => this.setState({ companies }));
  }


  render() {
    const companies = this.state.companies.map(company => {
      return <Company key={company._id} data={company} fetchBPP={ this.fetchBPP } />
    });

    return (
      <div className="companies" style={{paddingTop: '30px'}}>
        { companies }
        {/* <table className="table table-condensed">
          <tbody>
            { companies }
          </tbody>
        </table> */}
      </div>
    );
  }
};


class Company extends React.Component {
  constructor(props){
    super(props);
    this.getCompany = this.getCompany.bind(this);
    this.showCompanyDetails = this.showCompanyDetails.bind(this);
    this.state = {
      company: null,
      showDetails: false
    };
  }

  getCompany(id) {
    return this.props.fetchBPP(`/api/companies/${ id }`)
    .then(company => this.setState({ company }));
  }

  showCompanyDetails(id) {
    this.getCompany(id)
    .then(() => this.setState({ showDetails: true }));
  }

  render() {
    return(
      <div style={{ paddingButtom: '4px' }}>
        <div className="row">
          <div className="col-xs-4">
            <button type="button" className="btn bt-xs btn-link" onClick={this.showCompanyDetails.bind(this, this.props.data._id)}>{ this.props.data.title }</button>
          </div>
          <div className="col-xs-8">
            { this.state.showDetails
                ? <CompanyDetails data={ this.state.company } />
                : <CompanyOverview data={ this.state.company } />
            }
          </div>
        </div>
        <hr />
      </div>
    );
  }
}


class CompanyOverview extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    // TODO: Show user count and order sold quantity
    return (null);
  }
}


class CompanyDetails extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const users = this.props.data.users || [];
    const usersE = users.map((user, index) => <CompanyUser key={index} user={user} />);

    const roles = this.props.data.roles || [];
    const rolesE = roles.map((role, index) => <CompanyRole key={index} role={role} />);

    const emailMasks = this.props.data.emailMasks || [];
    const emailMasksE = emailMasks.map((emailMask, index) => <CompanyEmailMask key={index} emailMask={emailMask} />);

    return (
      <div style={{ minHeight: '100px' }}>
        <div className="row">
          <div className="col-xs-12">
            <dl>
              <dt>cid</dt>
              <dd>{ this.props.data.cid }</dd>
              <dt>active</dt>
              <dd>{ this.props.data.active.toString() }</dd>
            </dl>
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-xs-2">
            <strong>roles</strong>
          </div>
          <div className="col-xs-10">
            { rolesE }
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-xs-2">
            <strong>users</strong>
          </div>
          <div className="col-xs-10">
            { usersE }
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-xs-2">
            <strong>email masks</strong>
          </div>
          <div className="col-xs-10">
            { emailMasksE }
          </div>
        </div>
      </div>
    );
  }
}


class CompanyUser extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div>{ this.props.user }</div>
    );
  }
}


class CompanyRole extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div>{ this.props.role }</div>
    );
  }
}


class CompanyEmailMask extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div>{ this.props.emailMask }</div>
    );
  }
}
