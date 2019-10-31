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
      <div className="companies" style={{ paddingTop: '30px' }}>
        <CompanySearch />
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


class CompanySearch extends React.Component {
  constructor(props){
    super(props);
    this.state = {

    };
  }

  render() {
    return (
      <div style={{ paddingBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-4">
            <input type="text" name="searchBox" className="form-control" placeholder="Type company name start search"></input>
          </div>
          <div className="col-xs-4">
            <input type="text" name="searchBox" className="form-control" placeholder="Type user email start search"></input>
          </div>
        </div>
      </div>
    );
  }
}


class Company extends React.Component {
  constructor(props){
    super(props);
    this.getCompany = this.getCompany.bind(this);
    this.showHideCompanyDetails = this.showHideCompanyDetails.bind(this);
    this.state = {
      company: null,
      showDetails: false,
      showLoader: false
    };
  }

  getCompany() {
    const id = this.props.data._id;
    return this.props.fetchBPP(`/api/companies/${ id }`)
    .then(company => this.setState({ company }));
  }

  showHideCompanyDetails() {
    if(this.state.showDetails) {
      this.setState({ showDetails: false });
    } else {
      this.setState({ showLoader: true });
      this.getCompany()
      .then(() => this.setState({
        showDetails: true,
        showLoader: false
      }));
    }
  }

  render() {
    return (
      <div  style={{ paddingBottom: '4px' }}>
        <div className="row">
          <div className="col-xs-4">
            <button type="button" className="btn bt-xs btn-link" onClick={this.showHideCompanyDetails}>{ this.props.data.title }</button>
            {/* { this.state.showLoader
              ? (<div className="loadSpinner">
                  <img src="/assets/load_spinner.gif" />
                </div>)
              : null
            } */}
          </div>
          <div className="col-xs-8">
            <CompanyOverview data={ this.state.company } />
          </div>
        </div>
        { this.state.showDetails
          ? <CompanyDetails data={ this.state.company } />
          : null
        }
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
    this.deleteRole = this.deleteRole.bind(this);
  }


  deleteRole(role) {
    console.log('deleteRole')
    console.log(role)
  }


  deleteUser(user) {
    console.log('deleteUser')
    console.log(user)
  }


  deleteIp(ip) {
    console.log('deleteIp')
    console.log(ip)
  }


  deleteEmailmask(emailMasks) {
    console.log('deleteEmailmask')
    console.log(emailMasks)
  }

  render() {
    return (
      <div style={{ marginTop: '10px', minHeight: '100px' }}>
        <div className="row">
          <div className="col-xs-12">
            <dl className="dl-horizontal">
              <dt>ARIA Account No</dt>
              <dd>{ this.props.data.ariaAccountNo }</dd>
              <dt>ARIA Account ID</dt>
              <dd>{ this.props.data.ariaAccountID }</dd>
              <dt>cid</dt>
              <dd>{ this.props.data.cid }</dd>
              <dt>Active</dt>
              <dd>{ this.props.data.active.toString() }</dd>
            </dl>
          </div>
        </div>
        <DdItems data={this.props.data.roles} label="Roles" deleteItem={this.deleteRole} />
        <DdItems data={this.props.data.users} label="Users" deleteItem={this.deleteUser} />
        <DdItems data={this.props.data.ipFilter} label="IP filter" deleteItem={this.deleteIp} />
        <DdItems data={this.props.data.emailMasks} label="Email masks" deleteItem={this.deleteEmailmask} />
      </div>
    );
  }
}


class DdItems extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const data = this.props.data || [];
    const items = data.map((d,index) => <DdItem key={index} data={d} deleteItem={this.props.deleteItem.bind(this, d)} />);

    return (
      <div className="row" style={{ marginTop: '8px', minHeight: '10px' }}>
        <div className="col-xs-12">
          <dl className="dl-horizontal">
            <dt>{ this.props.label }</dt>
            <dd>
              <table className="table table-condensed">
                <tbody>
                  { items }
                </tbody>
              </table>
            </dd>
          </dl>
        </div>
      </div>
    );
  }
}


class DdItem extends React.Component {
  constructor(props){
    super(props);
    this.showConfirmRemove = this.showConfirmRemove.bind(this);
    this.state = {
      confirmRemove: false
    }
  }

  showConfirmRemove() {
    this.setState((prevState) => {
      return {
        confirmRemove: !prevState.confirmRemove
      };
    });
  }

  render() {    
    return (
      <tr>
        <td>{ this.props.data }</td>
        <td style={{ textAlign: 'right' }}>
          <button type="button" className={`btn btn-xs ${ this.state.confirmRemove ? 'btn-success' : 'btn-danger' }`} onClick={this.showConfirmRemove}>
            <span className={`glyphicon ${ this.state.confirmRemove ? 'glyphicon-minus' : 'glyphicon-trash' }`} aria-hidden="true"></span>
          </button>
          <span>&nbsp;</span>
          <button type="button" className="btn btn-xs btn-danger" onClick={this.props.deleteItem} disabled={!this.state.confirmRemove}>
            <span className="glyphicon glyphicon-trash" aria-hidden="true"></span> <span>Confirm</span>
          </button>
        </td>
      </tr>
    );
  }
}

