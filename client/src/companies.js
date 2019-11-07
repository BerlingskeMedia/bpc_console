const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.loadTicket = this.loadTicket.bind(this);
    this.getTicket = this.getTicket.bind(this);
    this.refreshTicket = this.refreshTicket.bind(this);
    this.saveTicket = this.saveTicket.bind(this);
    this.getCompanies = this.getCompanies.bind(this);
    this.getAccessRules = this.getAccessRules.bind(this);
    this.fetchBPP = this.fetchBPP.bind(this);
    this.fetchBPC = this.fetchBPC.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.state = {
      companies: [],
      accessrules: [],
      authenticated: false
    };
  }


  loadTicket() {
    let credentials = null;
    try {
      credentials =  JSON.parse(window.sessionStorage.getItem('bpp_ticket'));
    } catch(ex) { }
    return credentials;
  }


  fetchBPP(path, options) {

    let bpp_url = window.location.origin.replace('console', 'bpp');
    const local_bpp_url = window.localStorage.getItem('bpp_url');

    if(typeof local_bpp_url === 'string' && local_bpp_url.length > 0) {
      bpp_url = local_bpp_url;
    }

    if(!bpp_url) {
      console.error('BPP URL missing');
      return;
    }

    const request = new Request(`${ bpp_url }${ path }`, options);

    const credentials = this.loadTicket();
    if(credentials) {
      const result = hawk.client.header(request.method, request.url, { credentials, app: credentials.app });
      request.headers.set('Authorization', result.header);
    }

    return fetch(request)
    .then(response => {
      if(response.status === 200) {
        return response.json().then(data => data);
      } else {
        return Promise.reject(response);
      }
    });
  }


  fetchBPC(path, options) {
    const request = new Request(`${ path }`, options);

    return fetch(request)
    .then(response => {
      if(response.status === 200) {
        return response.json().then(data => data);
      } else {
        return Promise.reject(response);
      }
    });
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


  getCompanies(query) {
    return this.fetchBPP(`/api/companies${ query || '' }`)
    .then(companies => this.setState({ companies }));
  }


  getAccessRules() {
    return this.fetchBPP(`/api/accessrules`)
    .then(accessrules => this.setState({ accessrules }));
  }


  searchUser(input) {
    if(input.length > 0) {
      const encoded_input = encodeURIComponent(input);
      const query = `?provider=gigya&email=${ encoded_input }&id=${ encoded_input }`;

      return this.fetchBPC(`/api/users${ query }`)
      .then(users => {
        const foundUser = users.length === 1 ? users[0] : null;
        return Promise.resolve(foundUser);
      });
    } else {
      return Promise.resolve(null);
    }
  }


  componentDidMount() {
    const bpp_ticket = this.loadTicket();
    
    if(bpp_ticket) {
      this.refreshTicket(bpp_ticket)
      .then(this.getCompanies)
      .then(this.getAccessRules)
    } else {
      this.getTicket()
      .then(this.getCompanies)
      .then(this.getAccessRules)
    }
  }


  render() {
    const companies = this.state.companies.map(company => {
      return <Company key={company._id} data={company} accessrules={this.state.accessrules} fetchBPP={this.fetchBPP} searchUser={this.searchUser} />
    });

    return (
      <div className="companies" style={{ paddingTop: '30px' }}>
        <CompanySearch getCompanies={this.getCompanies} fetchBPP={this.fetchBPP} searchUser={this.searchUser} />
        { companies }
        { companies.length === 0
          ? <div style={{textAlign: 'center'}}><em>(none)</em></div>
          : null
        }
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
    this.onTitleSearchChange = this.onTitleSearchChange.bind(this);
    this.onUserSearchChange = this.onUserSearchChange.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.search = this.search.bind(this);
    this.state = {
      searchInProgress: false,
      searchTimer: null,
      searchUserInProgress: false,
      searchUserTimer: null,
      foundUser: null,
      userSearchBoxHasInput: false
    };
  }

  
  onUserSearchChange() {
    clearTimeout(this.state.searchUserTimer);
    this.setState({searchUserTimer: setTimeout(this.searchUser, 1000)});
  }
  

  searchUser() {
    const searchText = this.userSearchBox.value;
    if(searchText.length > 0) {
      this.props.searchUser(searchText)
      .then(foundUser => {
        this.setState({ foundUser, userSearchBoxHasInput: true }, this.search);
      });      
    } else {
      this.setState({ foundUser: null, userSearchBoxHasInput: false }, this.search);
    }
  }


  onTitleSearchChange(e) {
    clearTimeout(this.state.searchTimer);
    this.setState({searchTimer: setTimeout(this.search, 1000)});
  }


  search() {
    if(this.state.searchInProgress){
      return false;
    }

    const searchParams = [];

    if(this.titleSearchBox.value.length > 0) {
      searchParams.push(`title=${ encodeURIComponent(this.titleSearchBox.value) }`);
    }

    if(this.state.foundUser) {
      searchParams.push(`user=${ encodeURIComponent(this.state.foundUser.id) }`);
    } else if (this.userSearchBox.value.length > 0) {
      searchParams.push(`emailmask=${ encodeURIComponent(this.userSearchBox.value) }`);
    }
    
    const query = `?${ searchParams.join('&') }`;

    this.setState({ searchInProgress: true }, () => {
      this.props.getCompanies(query)
      .then(() => this.setState({ searchInProgress: false }));
    })
  }


  render() {

    let userSearchFeedback = null;
    let userSearchBoxClass = 'form-group has-feedback';
    if(this.state.userSearchBoxHasInput) {
      if (this.state.foundUser) {
        userSearchFeedback = <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>;
        userSearchBoxClass += ' has-success'
      // } else {
        // userSearchFeedback = <span className="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span>;
        // userSearchBoxClass += ' has-error'
      }
    }

    return (
      <div style={{ paddingBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-4">
            <input
              type="text"
              name="titleSearchBox"
              onChange={this.onTitleSearchChange}
              className="form-control"
              placeholder="Type company name start search"
              ref={(titleSearchBox) => this.titleSearchBox = titleSearchBox} />
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>Use ^ for the start, $ for the end.</em></small></div>
          </div>
          <div className="col-xs-4">
            <div className={ userSearchBoxClass }>
              <input
                type="text"
                name="userSearchBox"
                id="userSearchBox"
                className="form-control"
                aria-describedby="inputSuccess2Status"
                onChange={this.onUserSearchChange}
                placeholder="Type user email or ID start search"
                ref={(userSearchBox) => this.userSearchBox = userSearchBox} />
                { userSearchFeedback }
              <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em></em></small></div>
            </div>
          </div>
          <div className="col-xs-2">
            <select className="form-control">
              <option disabled="" value="N/A">accessFeature</option>
            </select>
          </div>
          <div className="col-xs-2">
            <select className="form-control">
              <option disabled="" value="N/A">titleDomain</option>
            </select>
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
    this.removeAccessRules = this.removeAccessRules.bind(this);
    this.validateUser = this.validateUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.addIp = this.addIp.bind(this);
    this.removeIp = this.removeIp.bind(this);
    this.addEmailmask = this.addEmailmask.bind(this);
    this.removeEmailmask = this.removeEmailmask.bind(this);
    this.state = {
      company: null,
      hasAnyChanges: false,
      showDetails: false,
      showLoader: false,
      searchUserInProgress: false,
      searchUserTimer: null,
      foundUser: null
    };
  }
  

  removeAccessRules(role) {
    let newCompany = Object.assign({}, this.state.company);
    // const roleIndex = newCompany.roles.findIndex(r => r === role);
    // newCompany.roles.splice(roleIndex, 1);
    this.updateCompanyState(newCompany);
  }


  validateUser(value) {
    clearTimeout(this.state.searchUserTimer);
    return new Promise((resolve) => {
      this.setState({searchUserTimer: setTimeout(() => {
        this.props.searchUser(value)
        .then(foundUser => {
          return resolve(foundUser !== null);
        });
      }, 1000)});
    });
  }
  

  addUser(value) {
    const id = this.props.data._id;
    return this.props.searchUser(value)
    .then(foundUser => {

      const payload = {
        add: foundUser.id
      };

      return this.props.fetchBPP(`/api/companies/${ id }/users`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then((company) => this.setState({ company }));
    });
  }

  
  removeUser(value) {
    const id = this.props.data._id;
    const payload = {
      remove: value
    };

    return this.props.fetchBPP(`/api/companies/${ id }/users`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then((company) => this.setState({ company }));
  }


  validateIp(value) {
    // Regex for IP incl. CIDR validation
    // var regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))?$/g;
    // var found = value.match(regex);
    // return found != null;
    var regex = RegExp('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))?$');
    const valid = regex.test(value);
    return Promise.resolve(valid);
  }


  addIp(value) {
    let newCompany = Object.assign({}, this.state.company);
    newCompany.ipFilter.push(value);
    return this.updateCompanyState(newCompany);
  }


  removeIp(item) {
    let newCompany = Object.assign({}, this.state.company);
    const index = newCompany.ipFilter.findIndex(i => i === item);
    newCompany.ipFilter.splice(index, 1);
    return this.updateCompanyState(newCompany);
  }


  validateEmailmask(value) {
    // var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // return regex.test(String(value).toLowerCase());
    const atIndex = value.indexOf('@');
    const dotIndex = value.indexOf('.');
    const valid = value.length > 0 &&     // There is a value
      atIndex > -1 &&                     // There is an @
      (atIndex + 1) < dotIndex &&         // There is a domain
      value.length - dotIndex > 1;        // There is a top-level domain
    return Promise.resolve(valid);
  }


  addEmailmask(value) {
    let newCompany = Object.assign({}, this.state.company);
    newCompany.emailMasks.push(value);
    return this.updateCompanyState(newCompany);
  }


  removeEmailmask(item) {
    let newCompany = Object.assign({}, this.state.company);
    const index = newCompany.emailMasks.findIndex(i => i === item);
    newCompany.emailMasks.splice(index, 1);
    return this.updateCompanyState(newCompany);
  }


  getCompany() {
    const id = this.props.data._id;
    return this.props.fetchBPP(`/api/companies/${ id }`)
    .then(company => this.setState({ company, hasAnyChanges: false }));
  }


  saveCompany() {
    const id = this.props.data._id;
    return this.props.fetchBPP(`/api/companies/${ id }`, {
      method: 'PUT',
      body: JSON.stringify(this.state.company)
    })
    .then((response) => this.setState({ company: response, hasAnyChanges: false }))
    .catch((err) => {
      alert('Error when saving!');
      this.getCompany();
    });
  }


  updateCompanyState(company) {
    return new Promise((resolve) => {
      return this.setState({
        company,
        hasAnyChanges: true
      }, resolve);
    });
  }


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
          <div className="col-xs-1">
            <CompanyOverview data={ this.state.company } />
          </div>
          <div className="col-xs-7" style={{ textAlign: 'right' }}>
            { this.state.showDetails
              ? <div>
                  <button type="button" className="btn btn-sm btn-danger" onClick={this.saveCompany} disabled={!this.state.confirmSave}>
                    <span className="glyphicon glyphicon-save" aria-hidden="true"></span> <span>Confirm</span>
                  </button>
                  <span>&nbsp;</span>
                  <button type="button" className="btn btn-xs btn-warning" className={`btn btn-sm ${ this.state.confirmSave ? 'btn-success' : 'btn-warning' }`} onClick={this.showConfirmSave} disabled={!this.state.hasAnyChanges}>
                    <span className={`glyphicon ${ this.state.confirmSave ? 'glyphicon-repeat' : 'glyphicon-save' }`} aria-hidden="true"></span> <span>Save</span>
                  </button>
                  <span>&nbsp;</span>
                  <button type="button" className="btn btn-sm btn-success" onClick={this.getCompany}>
                    <span className="glyphicon glyphicon-refresh" aria-hidden="true"></span> <span>Reload</span>
                  </button>
                  <span>&nbsp;</span>
                  <button type="button" className="btn btn-sm btn-default" onClick={this.showHideCompanyDetails}>
                    <span className="glyphicon glyphicon-resize-small" aria-hidden="true"></span> <span>Close</span>
                  </button>
                </div>
              : <div>
                  <button type="button" className="btn btn-sm btn-default" onClick={this.showHideCompanyDetails}>
                    <span className="glyphicon glyphicon-resize-full" aria-hidden="true"></span> <span>Open</span>
                  </button>
                </div>
            }
          </div>
        </div>

        { this.state.showDetails
          ?  <div style={{ marginTop: '10px', marginBottom: '100px', minHeight: '100px' }}>
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
                        <td>{ this.state.company.ariaAccountNo || '-' }</td>
                        <td>{ this.state.company.ariaAccountID || '-' }</td>
                        <td>{ this.state.company.cid }</td>
                        <td>{ this.state.company.active || '-' }</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <AccessRules
                data={this.state.company.accessRules}
                accessrules={this.props.accessrules}
                removeItem={this.removeAccessRules} />

              {/* <AddAccessRules accessrules={this.props.accessrules} addAccessRule={this.addAccessRule} /> */}
              
              <ArrayItems
                data={this.state.company.ipFilter}
                label="IP filter"
                removeItem={this.removeIp}
                addItem={this.addIp}
                validateItem={this.validateIp} />
              
              <ArrayItems
                data={this.state.company.emailMasks}
                label="Email masks"
                removeItem={this.removeEmailmask}
                addItem={this.addEmailmask}
                validateItem={this.validateEmailmask} />

              <hr />

              <ArrayItems
                data={this.state.company.users}
                label="Users"
                removeItem={this.removeUser}
                addItem={this.addUser}
                validateItem={this.validateUser} />

              {/* <div className="panel panel-default">
                <div className="panel-body">
                  <CompanyUsers
                    data={this.state.company.users}
                    removeUser={this.removeUser}
                    addUser={this.addUser}
                    searchUser={this.props.searchUser} />
                </div>
              </div> */}
            </div>  
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


class AccessRules extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const items = this.props.data.map(accessRule => {

      const access = this.props.accessrules.find((a) => {
        return a.accessFeature === accessRule.accessFeature && a.titleDomain === accessRule.titleDomain
      });

      const accessRoles = Object.keys(access.access).map((k, index) => {
        return (<div key={index}>
          <span>{k}:</span> <span>{access.access[k].join(', ')}</span>
        </div>);
      });


      return (
        <tr key={accessRule.accessFeature + accessRule.titleDomain }>
          <td>{accessRule.accessFeature}</td>
          <td>{accessRule.titleDomain}</td>
          <td>{ accessRoles }</td>
          <td style={{ textAlign: 'right' }}>
            <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem} style={{ minWidth: '90px'}}>
              <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
            </button>
          </td>
        </tr>
      );
    });

    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Access rules</strong>
        </div>
        <div className="col-xs-10">
          { items.length > 0
          ? <table className="table table-condensed">
            <thead>
              <tr>
                <th>accessFeature</th>
                <th>titleDomain</th>
                <th>Access ( -> BPC)</th>
                <th></th>
              </tr>
            </thead>
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


class AddAccessRules extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const accessFeaturesOptions = this.props.accessrules.map((a, index) => {
      return (
        <option key={index} value={a.accessFeature}>{a.accessFeature}</option>
      );
    });


    const titleDomainOptions = this.props.accessrules.map((a, index) => {
      return (
        <option key={index} value={a.titleDomain}>{a.titleDomain}</option>
      );
    });


    // const titleDomainOptions = this.props.accessrules.map((a, index) => {
    //   return (
    //     <option key={index} value={index}>{a.accessFeature + '/' + a.titleDomain}</option>
    //   );
    // });

    return(
      <div className="row" style={{ marginTop: '5px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Add Access rules</strong>
        </div>
        <div className="col-xs-3">
          <select className="form-control input-sm">
            <option key={-1} disabled value='N/A'>Select accessFeature</option>
            { accessFeaturesOptions }
          </select>
        </div>
        <div className="col-xs-3">
          <select className="form-control input-sm">
            <option key={-1} disabled value='N/A'>Select titleDomain</option>
            { titleDomainOptions }
          </select>
        </div>
        <div className="col-xs-2">

        </div>
      </div>
    );
  }
}


class ArrayItems extends React.Component {
  constructor(props){
    super(props);
    this.addItem = this.addItem.bind(this);
    this.onChangeAddItem = this.onChangeAddItem.bind(this);
    this.state = {
      inputValid: false
    };
  }


  onChangeAddItem() {
    const value = this.addItemInput.value;
    if(value.length > 0) {
      // Setting the invalid flag now, because there is one second delay
      //  before se start searching for users in BPC
      this.setState({ inputValid: false }, () => {
        this.props.validateItem(value)
        .then(inputValid => this.setState({ inputValid }))
      })
    } else {
      this.setState({ inputValid: false });
    }
  }


  addItem() {
    const value = this.addItemInput.value;
    if(value.length > 0) {
      this.props.addItem(value)
      .then(() => {
        this.setState({ inputValid: false });
        this.addItemInput.value = '';
      });
    }
  }


  render() {

    // In case of undefined
    const data = this.props.data || [];

    let items = data.map((item) => {
      return (
        <tr key={item}>
          <td>{ item }</td>
          <td style={{ textAlign: 'right'}}>
            <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem.bind(this, item)} style={{ minWidth: '90px' }}>
              <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
            </button>
          </td>
        </tr>
      );
    });

    items.push(
      <tr key={-1}>
        <td>
          <input
            type="text"
            name="addItemInput"
            className="form-control input-sm"
            onChange={this.onChangeAddItem}
            ref={(addItemInput) => this.addItemInput = addItemInput} />
        </td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-success' onClick={this.addItem} disabled={!this.state.inputValid} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
          </button>
        </td>
      </tr>
    );

    return (
      <div style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="row">
          <div className="col-xs-2" style={{ textAlign: 'right' }}>
            <strong>{ this.props.label }</strong>
          </div>
          <div className="col-xs-10">
            <table className="table table-condensed">
              <tbody>
                { items }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}


class CompanyUsers extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    const users = this.props.data || [];

    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
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
