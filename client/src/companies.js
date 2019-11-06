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
      } else if(response.status === 401) {
        return Promise.reject(response);
      } else {
        console.log(`Unhandled statusCode ${ response.status } for request ${ request.method } ${ request.url }`)
      }
    });
  }


  fetchBPC(path, options) {
    const request = new Request(`${ path }`, options);

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
      return <Company key={company._id} data={company} accessrules={this.state.accessrules} fetchBPP={this.fetchBPP} />
    });

    return (
      <div className="companies" style={{ paddingTop: '30px' }}>
        <CompanySearch getCompanies={this.getCompanies} fetchBPP={this.fetchBPP} fetchBPC={this.fetchBPC} />
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
      const query = `?provider=gigya&email=${ encodeURIComponent(searchText) }&id=${searchText}`;

      return this.props.fetchBPC(`/api/users${ query }`)
      .then(users => {
        const foundUser = users.length === 1 ? users[0] : null;
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
                aria-describedby="inputSuccess2Status"
                onChange={this.onUserSearchChange}
                className="form-control"
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
    this.removeIp = this.removeIp.bind(this);
    this.removeEmailmask = this.removeEmailmask.bind(this);
    this.state = {
      company: null,
      showDetails: false,
      showLoader: false
    };
  }

  
  getCompany(id) {
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


  removeAccessRules(role) {
    let newCompany = Object.assign({}, this.state.company);
    // const roleIndex = newCompany.roles.findIndex(r => r === role);
    // newCompany.roles.splice(roleIndex, 1);
    this.updateCompanyState(newCompany);
  }


  removeIp(item) {
    let newCompany = Object.assign({}, this.state.company);
    const index = newCompany.ipFilter.findIndex(i => i === item);
    newCompany.ipFilter.splice(index, 1);
    this.updateCompanyState(newCompany); // TODO
    // this.setState((prevState) => {
    //   return {
    //     company: prevState.company.ipFilter.splice(index, 1);
    //   }
    // });
  }


  removeEmailmask(item) {
    let newCompany = Object.assign({}, this.state.company);
    const index = newCompany.emailMasks.findIndex(i => i === item);
    newCompany.emailMasks.splice(index, 1);
    this.updateCompanyState(newCompany);
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
      this.getCompany(this.props.data._id)
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

        {/* { this.state.showDetails
          ? <CompanyDetails data={ this.state.company } updateCompanyState={this.updateCompanyState} />
          : null
        } */}

        { this.state.showDetails
          ?  <div style={{ marginTop: '10px', minHeight: '100px' }}>
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
              <AccessRules data={this.state.company.accessRules} accessrules={this.props.accessrules} removeItem={this.removeAccessRules} />
              {/* <AddAccessRules accessrules={this.props.accessrules} addAccessRule={this.addAccessRule} /> */}
              <CompanyItems data={this.state.company.ipFilter} label="IP filter" removeItem={this.removeIp} />
              <CompanyItems data={this.state.company.emailMasks} label="Email masks" removeItem={this.removeEmailmask} />
              <hr />
              <div className="panel panel-default">
                <div className="panel-body">
                  <CompanyUsers />
                </div>
              </div>
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


// class CompanyDetails extends React.Component {
//   constructor(props){
//     super(props);
//     this.removeAccessRules = this.removeAccessRules.bind(this);
//     this.removeIp = this.removeIp.bind(this);
//     this.removeEmailmask = this.removeEmailmask.bind(this);
//   }


//   removeAccessRules(role) {
//     let newCompany = Object.assign({}, this.props.data);
//     // const roleIndex = newCompany.roles.findIndex(r => r === role);
//     // newCompany.roles.splice(roleIndex, 1);
//     this.props.updateCompanyState(newCompany);
//   }


//   removeIp(item) {
//     let newCompany = Object.assign({}, this.props.data);
//     const index = newCompany.ipFilter.findIndex(i => i === item);
//     newCompany.ipFilter.splice(index, 1);
//     this.props.updateCompanyState(newCompany);
//   }


//   removeEmailmask(item) {
//     let newCompany = Object.assign({}, this.props.data);
//     const index = newCompany.emailMasks.findIndex(i => i === item);
//     newCompany.emailMasks.splice(index, 1);
//     this.props.updateCompanyState(newCompany);
//   }


//   render() {
//     return (
//       <div style={{ marginTop: '10px', minHeight: '100px' }}>
//         <div className="row">
//           <div className="col-xs-10 col-xs-offset-2">
//             <table className="table table-condensed">
//               <thead>
//                 <tr>
//                   <th>ARIA Account No</th>
//                   <th>ARIA Account ID</th>
//                   <th>cid</th>
//                   <th>Active</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td>{ this.props.data.ariaAccountNo || '-' }</td>
//                   <td>{ this.props.data.ariaAccountID || '-' }</td>
//                   <td>{ this.props.data.cid }</td>
//                   <td>{ this.props.data.active.toString() }</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         </div>
//         <AccessRules data={this.props.data.accessRules} removeItem={this.removeAccessRules} />
//         <CompanyItems data={this.props.data.ipFilter} label="IP filter" removeItem={this.removeIp} />
//         <CompanyItems data={this.props.data.emailMasks} label="Email masks" removeItem={this.removeEmailmask} />
//         <hr />
//         <CompanyUsers />
//       </div>
//     );
//   }
// }


class AccessRules extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const items = this.props.data.map(accessRule => {

      console.log('this.props.accessrules')
      console.log(this.props.accessrules)
      const access = this.props.accessrules.find((a) => {
        return a.accessFeature === accessRule.accessFeature && a.titleDomain === accessRule.titleDomain
      });

      const accessRoles = Object.keys(access.access).map((k) => {
        return (<div>
          <span>{k}:</span> <span>{access.access[k].join(', ')}</span>
        </div>);
      });


      return (
        <tr key={accessRule.accessFeature + accessRule.titleDomain }>
          <td>{accessRule.accessFeature}</td>
          <td>{accessRule.titleDomain}</td>
          <td>{ accessRoles }</td>
          <td style={{ textAlign: 'right' }}>
            <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem}>
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


class CompanyItems extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const data = this.props.data || [];
    const items = data.map((d) => <CompanyItem key={d} data={d} removeItem={this.props.removeItem.bind(this, d)} />);

    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
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
