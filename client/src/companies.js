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
      bpp_url: null
    };
  }


  getTicket() {
    const auth = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();

    return this.fetchBPP('/authenticate', {
      method: 'POST',
      body: JSON.stringify({
        id_token: auth.id_token,
        access_token: auth.access_token
      })
    })
    .then(this.saveTicket)
    .then(ticket => {
      // TODO: Set a timeout when to reissue the ticket -
      // - it must refresh it after reload if it's old
      // and it must keep reissueing it going forward
    });
  }


  refreshTicket(credentials) {
    return this.fetchBPP('/authenticate', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
    .then(this.saveTicket)
    .then(ticket => {
      // TODO: Set a timeout when to reissue the ticket -
      // - it must refresh it after reload if it's old
      // and it must keep reissueing it going forward
    });    
  }


  saveTicket(ticket) {
    window.sessionStorage.setItem('bpp_ticket', JSON.stringify(ticket));
    this.setState({ bpp_ticket: ticket, authenticated: true });
    return Promise.resolve(ticket);
  }


  componentDidMount() {
    let bpp_url = window.location.origin.replace('console', 'bpp');
    const local_bpp_url = window.localStorage.getItem('bpp_url');

    if(typeof local_bpp_url === 'string' && local_bpp_url.length > 0) {
      bpp_url = local_bpp_url;
    }

    console.log(`Using BPP URL ${ bpp_url }`);

    this.setState({ bpp_url }, () => {


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
    });

  }


  fetchBPP(path, options) {

    if(!this.state.bpp_url) {
      console.error('BPP URL missing');
      return;
    }

    const request = new Request(`${ this.state.bpp_url }${ path }`, options);

    const credentials = this.state.bpp_ticket;
    if(credentials) {
      const result = hawk.client.header(request.method, request.url, { credentials, app: credentials.app });
      request.headers.set('Authorization', result.header);
    }

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
    this.saveCompany = this.saveCompany.bind(this);
    this.updateCompanyState = this.updateCompanyState.bind(this);
    this.showHideCompanyDetails = this.showHideCompanyDetails.bind(this);
    this.showConfirmSave = this.showConfirmSave.bind(this);
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


  saveCompany() {
    console.log('save', this.state.company)
    // PUT /companies/{id}
    // Payload:
    //  ipFilter
    //  emailMasks
    //  accessRules
  }


  
  
  addUser() {
    
  }
  
  
  removeUser() {
    
  }


  updateCompanyState(company) {
    this.setState({ company });
  }
  // POST /companies/users
  // Payload:
  //  ariaAccountNo
  //  add=string=UID
  //  remove=string=UID

  showHideCompanyDetails() {
    if(this.state.showDetails) {
      this.setState({ showDetails: false });
    } else {
      this.setState({ showLoader: true });
      this.getCompany()
      .then(() => this.setState({
        showDetails: true,
        showLoader: false,
        confirmSave: false,
        confirmTimeout: null
      }));
    }
  }

  showConfirmSave() {
    this.setState((prevState) => {
      let temp;
      if(!prevState.confirmSave && !prevState.confirmTimeout) {
        temp = setTimeout(this.showConfirmSave, 1500);
      } else {
        clearTimeout(prevState.confirmTimeout);
      }

      return {
        confirmSave: !prevState.confirmSave,
        confirmTimeout: temp
      };
    });
  }

  render() {
    return (
      <div style={{ paddingBottom: '4px' }}>
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
          <div className="col-xs-4">
            <CompanyOverview data={ this.state.company } />
          </div>
          <div className="col-xs-4" style={{ textAlign: 'right' }}>
            { this.state.showDetails
              ? <div>
                  <button type="button" className="btn btn-sm btn-danger" onClick={this.saveCompany} disabled={!this.state.confirmSave}>
                    <span className="glyphicon glyphicon-save" aria-hidden="true"></span> <span>Confirm</span>
                  </button>
                  <span>&nbsp;</span>
                  <button type="button" className="btn btn-xs btn-warning" className={`btn btn-sm ${ this.state.confirmSave ? 'btn-success' : 'btn-warning' }`} onClick={this.showConfirmSave}>
                    <span className={`glyphicon ${ this.state.confirmSave ? 'glyphicon-repeat' : 'glyphicon-save' }`} aria-hidden="true"></span> <span>Save</span>
                  </button>
                  <span>&nbsp;</span>
                  <button type="button" className="btn btn-sm btn-success" onClick={this.getCompany}>
                    <span className="glyphicon glyphicon-refresh" aria-hidden="true"></span> <span>Reload</span>
                  </button>
                </div>
              : null
            }
          </div>
        </div>

        { this.state.showDetails
          ? <CompanyDetails data={ this.state.company } updateCompanyState={this.updateCompanyState} />
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
    this.removeAccessRules = this.removeAccessRules.bind(this);
    this.removeIp = this.removeIp.bind(this);
    this.removeEmailmask = this.removeEmailmask.bind(this);
  }


  removeAccessRules(role) {
    let newCompany = Object.assign({}, this.props.data);
    // const roleIndex = newCompany.roles.findIndex(r => r === role);
    // newCompany.roles.splice(roleIndex, 1);
    this.props.updateCompanyState(newCompany);
  }


  removeIp(item) {
    let newCompany = Object.assign({}, this.props.data);
    const index = newCompany.ipFilter.findIndex(i => i === item);
    newCompany.ipFilter.splice(index, 1);
    this.props.updateCompanyState(newCompany);
  }


  removeEmailmask(item) {
    let newCompany = Object.assign({}, this.props.data);
    const index = newCompany.emailMasks.findIndex(i => i === item);
    newCompany.emailMasks.splice(index, 1);
    this.props.updateCompanyState(newCompany);
  }


  render() {
    return (
      <div style={{ marginTop: '10px', minHeight: '100px' }}>
        <div className="row">
          <div className="col-xs-10 col-xs-offset-2">
            <table className="table table-condensed">
              <thead>
                <tr>
                  <th>ARIA Account No</th>
                  <th>ARIA Account ID</th>
                  <th>cid</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{ this.props.data.ariaAccountNo || '-' }</td>
                  <td>{ this.props.data.ariaAccountID || '-' }</td>
                  <td>{ this.props.data.cid }</td>
                  <td>{ this.props.data.active.toString() }</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <CompanyItems data={this.props.data.roles} label="Access rules" removeItem={this.removeAccessRules} />
        <CompanyItems data={this.props.data.ipFilter} label="IP filter" removeItem={this.removeIp} />
        <CompanyItems data={this.props.data.emailMasks} label="Email masks" removeItem={this.removeEmailmask} />
        <hr />
        <CompanyUsers />
      </div>
    );
  }
}


class CompanyItems extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const data = this.props.data || [];
    const items = data.map((d) => <CompanyItem key={d} data={d} removeItem={this.props.removeItem.bind(this, d)} />);

    return (
      <div className="row" style={{ marginTop: '8px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>{ this.props.label }</strong>
        </div>
        <div className="col-xs-10">
          { items.length > 0
           ? <table className="table table-condensed">
              <tbody>
                { items }
              </tbody>
            </table>
            : <div>-</div>
          }
        </div>
      </div>
    );
  }
}


class CompanyItem extends React.Component {
  constructor(props){
    super(props);
  }

  render() {    
    return (
      <tr>
        <td>{ this.props.data }</td>
        <td style={{ textAlign: 'right' }}>
          <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem}>
            <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
          </button>
        </td>
      </tr>
    );
  }
}


class CompanyUsers extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="row" style={{ marginTop: '8px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <div><strong>Users</strong></div>
        </div>
        <div className="col-xs-10">
          <div>TODO</div>
        </div>
      </div>
    );
  }
}
