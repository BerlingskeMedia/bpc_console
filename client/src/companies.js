const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');
const Bpp = require('./components/bpp');

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getCompanies = this.getCompanies.bind(this);
    this.createCompany = this.createCompany.bind(this);
    this.getAccessRules = this.getAccessRules.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.createUser = this.createUser.bind(this);
    this.state = {
      companies: [],
      accessrules: [],
      authorized: false
    };

    document.title = 'BPC - Companies';
  }


  getCompanies(query) {
    return Bpp.request(`/api/companies${ query || '' }`)
    .then(companies => {
      const companyCount = companies.length;
      const userCount = companies.reduce((acc, cur) => {
        return acc + cur.userCount;
      }, 0);
      this.setState({ companies, companyCount, userCount });
    });
  }


  createCompany(company) {
    return Bpp.request(`/api/companies`, {
      method: 'POST',
      body: JSON.stringify(company)
    })
    .then(company => {
      let companies = this.state.companies;
      companies.push(company)
      this.setState({ companies });
    });
  }


  getAccessRules() {
    return Bpp.request(`/api/accessrules`)
    .then(accessrules => this.setState({ accessrules }));
  }


  createUser(email) {
    if(email.length === 0) {
      return Promise.reject();
    }

    return Bpc.request('/gigya/register', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }


  searchUser(input) {
    if(input.length > 0) {
      const encoded_input = encodeURIComponent(input);
      const query = `?provider=gigya&email=${ encoded_input }&id=${ encoded_input }`;

      return Bpc.request(`/users${ query }`)
      .then(users => {
        const foundUser = users.length === 1 ? users[0] : null;
        return Promise.resolve(foundUser);
      });
    } else {
      return Promise.resolve(null);
    }
  }


  componentDidMount() {
    const auth = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();

    return Bpp.authorize({
      id_token: auth.id_token,
      access_token: auth.access_token
    })
    .then(ticket => {
      this.setState({ authorized: true });
    })
    .then(this.getCompanies)
    .then(this.getAccessRules)
    .catch(err => {
      this.setState({ authorized: false });
    })
  }


  render() {
    const companies = this.state.companies.map(company => {

      return <Company
              key={company._id}
              data={company}
              accessrules={this.state.accessrules}
              createUser={this.createUser}
              searchUser={this.searchUser} />
    });

    if(!this.state.authorized) {
      return (
        <div className="companies" style={{ paddingTop: '50px' }}>
          <div style={{textAlign: 'center'}}><em>(forbidden)</em></div>
        </div>
      );
    }

    return (
      <div className="companies" style={{ paddingTop: '30px' }}>
        <CompanySearch getCompanies={this.getCompanies} searchUser={this.searchUser} accessrules={this.state.accessrules} />
        <CompanySearchStatistics companyCount={this.state.companyCount} userCount={this.state.userCount} />
        { companies }
        { companies.length === 0
          ? <div style={{textAlign: 'center'}}><em>(none)</em></div>
          : null
        }
        <CompanyCreate createCompany={this.createCompany}  />
      </div>
    );
  }
};


class CompanySearch extends React.Component {
  constructor(props){
    super(props);
    this.onUserSearchChange = this.onUserSearchChange.bind(this);
    this.onTitleSearchChange = this.onTitleSearchChange.bind(this);
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
      searchParams.push(`uid=${ encodeURIComponent(this.state.foundUser.id) }`);
    } else if (this.userSearchBox.value.length > 0) {
      searchParams.push(`emailmask=${ encodeURIComponent(this.userSearchBox.value) }`);
    }


    if(this.accessFeatureSelect.value.length > 0) {
      searchParams.push(`accessFeature=${ encodeURIComponent(this.accessFeatureSelect.value) }`)
    }


    if(this.titleDomainSelect.value.length > 0) {
      searchParams.push(`titleDomain=${ encodeURIComponent(this.titleDomainSelect.value) }`)
    }
    
    const query = `?${ searchParams.join('&') }`;

    this.setState({ searchInProgress: true }, () => {
      this.props.getCompanies(query)
      .finally(() => this.setState({ searchInProgress: false }));
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

    const accessrules = this.props.accessrules || [];

    const accessFeatures = [...new Set(accessrules.map((a) => a.accessFeature))];
    const accessFeaturesOptions = accessFeatures.map((accessFeature) => {
      return <option key={accessFeature} value={accessFeature}>{accessFeature}</option>;
    });

    const titleDomains = [...new Set( accessrules.map((a) => a.titleDomain) )];
    const titleDomainsOptions = titleDomains.map((titleDomain) => {
      return <option key={titleDomain} value={titleDomain}>{titleDomain}</option>;
    });

    return (
      <div style={{ marginBottom: '20px' }}>
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
            <select
              className="form-control"
              onChange={this.search}
              ref={(accessFeatureSelect) => this.accessFeatureSelect = accessFeatureSelect}>
              <option value=""></option>
              { accessFeaturesOptions }
            </select>
          </div>
          <div className="col-xs-2">
            <select
              className="form-control"
              onChange={this.search}
              ref={(titleDomainSelect) => this.titleDomainSelect = titleDomainSelect}>
              <option value=""></option>
              { titleDomainsOptions }
            </select>
          </div>
        </div>
      </div>
    );
  }
}

class CompanySearchStatistics extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return(
      <div style={{ marginBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-12">
            <div><em><small>Companies: { this.props.companyCount || '-' }</small></em></div>
            <div><em><small>Users: { this.props.userCount || '-' }</small></em></div>
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
    this.addCompanyNote = this.addCompanyNote.bind(this);
    this.addCompanyUserCountMax = this.addCompanyUserCountMax.bind(this);
    this.removeAccessRules = this.removeAccessRules.bind(this);
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.addIp = this.addIp.bind(this);
    this.removeIp = this.removeIp.bind(this);
    this.addEmailmask = this.addEmailmask.bind(this);
    this.removeEmailmask = this.removeEmailmask.bind(this);
    this.state = {
      company: null,
      usersToAdd: [],
      usersToRemove: [],
      hasAnyChanges: false,
      showDetails: false,
      showLoader: false
    };
  }


  addCompanyNote(note) {
    let newCompany = Object.assign({}, this.state.company);
    newCompany.note = note;
    this.updateCompanyState(newCompany);
  }

  addCompanyUserCountMax(userCountMax) {
    let newCompany = Object.assign({}, this.state.company);
    newCompany.userCountMax = userCountMax;
    this.updateCompanyState(newCompany);
  }
  

  removeAccessRules(role) {
    let newCompany = Object.assign({}, this.state.company);
    // const roleIndex = newCompany.roles.findIndex(r => r === role);
    // newCompany.roles.splice(roleIndex, 1);
    this.updateCompanyState(newCompany);
  }
  

  addUser(foundUser) {
    let newCompany = Object.assign({}, this.state.company);

    newCompany.users = newCompany.users || [];
    // const existingUsersIndex = newCompany.users.indexOf(foundUser.id);
    const existingUsersIndex = newCompany.users.findIndex((u) => u.uid === foundUser.id);
    if(existingUsersIndex === -1) {
      
      // For the visual 
      newCompany.users.push({
        uid: foundUser.id
      });

      this.setState({
        company: newCompany,
        hasAnyChanges: true
      });


      // If the user was removed but not saved
      // const removedUsersIndex = this.state.usersToRemove.indexOf(foundUser.id);
      const removedUsersIndex = this.state.usersToRemove.findIndex((u) => u.uid === foundUser.id);
      if(removedUsersIndex > -1) {
        this.setState((prevState) => {
          usersToRemove: prevState.usersToRemove.splice(removedUsersIndex, 1)
        });
      } else {
        this.setState((prevState) => {
          usersToAdd: prevState.usersToAdd.push({ uid: foundUser.id })
        });
      }
    }

    return Promise.resolve();
  }

  
  removeUser(user) {

    let newCompany = Object.assign({}, this.state.company);

    // const existingUsersIndex = newCompany.users.indexOf(value);
    const existingUsersIndex = newCompany.users.findIndex((u) => u.uid === user.uid);
    if(existingUsersIndex > -1) {

      // For the visual
      newCompany.users.splice(existingUsersIndex, 1);
      this.setState({
        company: newCompany,
        hasAnyChanges: true
      });


      // If the user was added but not saved
      // const addedUsersIndex = this.state.usersToAdd.indexOf(value);
      const addedUsersIndex = this.state.usersToAdd.findIndex((u) => u.uid === user.uid);
      if(addedUsersIndex > -1) {
        this.setState((prevState) => {
          usersToAdd: prevState.usersToAdd.splice(addedUsersIndex, 1)
        });
      } else {
        this.setState((prevState) => {
          usersToRemove: prevState.usersToRemove.push(user)
        });
      }
    }

    return Promise.resolve();
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
    newCompany.ipFilter = newCompany.ipFilter || [];
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
    newCompany.emailMasks = newCompany.emailMasks || [];
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
    return Bpp.request(`/api/companies/${ id }`)
    .then(company => this.setState({
      company,
      usersToAdd: [],
      usersToRemove: [],
      hasAnyChanges: false
    }));
  }


  saveCompany() {
    const id = this.props.data._id;

    const updateCompanyUsers = (payload) => {
      return Bpp.request(`/api/companies/${ id }/users`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    };

    const usersToAddPayloads = this.state.usersToAdd.map((user) => { return { add: user }});
    const usersToAddRequests = usersToAddPayloads.map((payload) => updateCompanyUsers(payload));
    
    const usersToRemovePayloads = this.state.usersToRemove.map((user) => { return { remove: user }});
    const usersToRemoveRequests = usersToRemovePayloads.map((payload) => updateCompanyUsers(payload));

    this.setState({ confirmSave: false });
    clearTimeout(this.state.confirmTimeout);

    Promise.all(usersToAddRequests.concat(usersToRemoveRequests))
    .then(() => {
      return Bpp.request(`/api/companies/${ id }`, {
        method: 'PUT',
        body: JSON.stringify(this.state.company)
      })
    })
    .then((response) => this.setState({
      company: response,
      usersToAdd: [],
      usersToRemove: [],
      hasAnyChanges: false
    }))
    .then(() => {
      this.setState({ showSaveSuccesful: true}, () => {
        setTimeout(function() {
          this.setState({ showSaveSuccesful: false });
        }.bind(this), 2000);
      });
    })
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
      if(this.state.hasAnyChanges) {
        this.setState({ showDetails: false, company: null });
      } else {
        this.setState({ showDetails: false });
      }
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
            <div className="text-wrap" style={{ textDecorationLine: '' }}><h5>{ this.props.data.title }</h5></div>
            {/* { this.state.showLoader
              ? (<div className="loadSpinner">
                  <img src="/assets/load_spinner.gif" />
                </div>)
              : null
            } */}
          </div>
          <div className="col-xs-4">
            <CompanyOverview data={ this.state.company || this.props.data } />
          </div>
          <div className="col-xs-4" style={{ textAlign: 'right' }}>
            { this.state.showDetails
              ? <button type="button" className="btn btn-sm btn-default" onClick={this.showHideCompanyDetails}>
                  { this.state.hasAnyChanges
                    ? <span><span className="glyphicon glyphicon-resize-small" aria-hidden="true"></span> <span>Cancel</span></span>
                    : <span><span className="glyphicon glyphicon-resize-small" aria-hidden="true"></span> <span>Close</span></span>
                  }
                </button>
              : <button type="button" className="btn btn-sm btn-default" onClick={this.showHideCompanyDetails}>
                  <span className="glyphicon glyphicon-resize-full" aria-hidden="true"></span> <span>Open</span>
                </button>
            }
          </div>
        </div>

        { this.state.showDetails
          ?  <div style={{ marginTop: '10px', marginBottom: '100px', minHeight: '100px' }}>
              <div className="row" style={{ marginBottom: '10px' }}>
                <div className="col-xs-12" style={{ textAlign: 'right' }}>
                { this.state.showSaveSuccesful
                    ? <span style={{ color: 'green' }}><span className="glyphicon glyphicon-ok" aria-hidden="true"></span> <span>Save successful  </span></span>
                    : <span>&nbsp;</span> }
                  <button type="button" className="btn btn-sm btn-danger" onClick={this.saveCompany} disabled={!this.state.confirmSave}>
                    <span className="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> <span>Confirm</span>
                  </button>
                  <span>&nbsp;</span>
                  <button type="button" className="btn btn-sm btn-warning" onClick={this.showConfirmSave} disabled={!this.state.hasAnyChanges}>
                    <span className={`glyphicon ${ this.state.confirmSave ? 'glyphicon-repeat' : 'glyphicon-save' }`} aria-hidden="true"></span> <span>Save</span>
                  </button>
                </div>
              </div>

              <CompanyCreatedDetails company={this.state.company} />
              
              <AccessRules
                data={this.state.company.accessRules}
                accessrules={this.props.accessrules}
                removeItem={this.removeAccessRules} />

              {/* <AddAccessRules accessrules={this.props.accessrules} addAccessRule={this.addAccessRule} /> */}

              <CompanyNote
                note={this.state.company.note}
                addCompanyNote={this.addCompanyNote} />
              
              <ArrayItems
                data={this.state.company.ipFilter}
                label="IP filter"
                note="Accepts single IPs and CIDR."
                removeItem={this.removeIp}
                addItem={this.addIp}
                validateItem={this.validateIp} />
              
              <ArrayItems
                data={this.state.company.emailMasks}
                label="Email masks"
                note="Users with matching email will automatically be included under Users."
                removeItem={this.removeEmailmask}
                addItem={this.addEmailmask}
                validateItem={this.validateEmailmask} />

              <UserMaxCount
                userCountMax={this.state.company.userCountMax}
                addCompanyUserCountMax={this.addCompanyUserCountMax} />

              <Users
                users={this.state.company.users}
                label="Users"
                note="Users that receive access according to Access rules."
                searchUser={this.props.searchUser}
                createUser={this.props.createUser}
                removeUser={this.removeUser}
                addUser={this.addUser} />

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

    // In case userCountMax=0 we want to display the value "0"
    const userCountMax = this.props.data.userCountMax === undefined || this.props.data.userCountMax === null || this.props.data.userCountMax === ''
      ? '-' : this.props.data.userCountMax;

    const userCountMaxExeeded =
      typeof userCountMax === 'number' &&
      typeof this.props.data.userCount === 'number' &&
      userCountMax < this.props.data.userCount;

    return (
      <div>
        <div style={{ paddingLeft: '4px', backgroundColor: userCountMaxExeeded ? 'red' : 'inherit' }}>
          <em><small>User count: {this.props.data.userCount || 0}/{ userCountMax }</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Note: {this.props.data.note || ''}</small></em>
        </div>
      </div>
    );
  }
}


class CompanyCreatedDetails extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      createdByUser: null
    };
  }


  componentDidMount() {

    if(this.props.company.createdBy && this.props.company.createdBy.user) {
      Bpc.request(`/users/${ encodeURIComponent(this.props.company.createdBy.user) }`)
      .then(createdByUser => this.setState({ createdByUser }));
    }
  }


  render() {

    const company = this.props.company;

    let ths = [];
    let tds = [];

    if(company.createdBy) {

      ths = [
        <th key="1">Created</th>,
        <th key="2">Created by</th>
      ];

      tds = [
        <td key="1">{this.props.company.createdAt || ''}</td>,
        <td key="2">{(this.state.createdByUser ? this.state.createdByUser.email : null ) || (company.createdBy ? company.createdBy.user : '')}</td>
      ];

    } else {

      ths = [
        <th key="1">ARIA Account No</th>,
        <th key="2">ARIA Account ID</th>,
        <th key="3">cid</th>
      ];

      tds = [
        <td key="1">{ company.ariaAccountNo || '-' }</td>,
        <td key="2">{ company.ariaAccountID || '-' }</td>,
        <td key="3">{ company.cid }</td>,
        <td key="4">{ company.active || '-' }</td>
      ];
    }

    return(
      <div className="row">
        <div className="col-xs-10 col-xs-offset-2">
          <table className="table table-condensed">
            <thead>
              <tr>
                { ths }
              </tr>
            </thead>
            <tbody>
              <tr>
                { tds }
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

  }
}


class CompanyNote extends React.Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const note = e.target.value;
    this.props.addCompanyNote(note);
  }

  render() {
    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Note</strong>
          <div><em><small></small></em></div>
        </div>
        <div className="col-xs-10">
          <textarea
            className="form-control"
            defaultValue={this.props.note}
            rows="2"
            onChange={this.handleChange}></textarea>
        </div>
      </div>
    );
  }
}


class AccessRules extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const data = this.props.data || [];

    const items = data.map(accessRule => {

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
            {/* <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem} style={{ minWidth: '90px'}}>
              <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
            </button> */}
          </td>
        </tr>
      );
    });


    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Access rules</strong>
          <div><em><small>Access rules for this account are managed in Aria.</small></em></div>
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
      hasInput: false,
      inputValid: false
    };
  }


  onChangeAddItem() {
    const value = this.addItemInput.value;
    if(value.length > 0) {
      // Setting the invalid flag now, because there is one second delay
      //  before se start searching for users in BPC
      this.props.validateItem(value)
      .then(inputValid => this.setState({ hasInput: true, inputValid }));
    } else {
      this.setState({ hasInput: false, inputValid: false });
    }
  }


  addItem() {
    const value = this.addItemInput.value;
    if(value.length > 0) {

      // Setting inputValid to false to disable the button
      this.setState({ addingItem: true }, () => {
        this.props.addItem(value)
        .then(() => {
          this.addItemInput.value = '';
          this.setState({
            addingItem: false,
            inputValid: false,
            hasInput: false
          });
        })
        .catch(() => {
          this.setState({ addingItem: false });
        });
      });
    }
  }


  render() {

    // In case of undefined
    const data = this.props.data || [];

    let items = data.map((item) => <ArrayItem key={item} data={item} removeItem={this.props.removeItem} translateItem={this.props.translateItem} />)

    const inputClassName = this.state.hasInput && !this.state.inputValid ? 'form-group has-error' : 'form-group';

    items.push(
      <tr key={-1}>
        <td>
          {/* <div className="form-group has-feedback"> */}
          <div className={inputClassName}>
            <input
              type="text"
              name="addItemInput"
              className="form-control input-sm"
              onChange={this.onChangeAddItem}
              ref={(addItemInput) => this.addItemInput = addItemInput} />
          </div>
        </td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-success' onClick={this.addItem} disabled={!this.state.inputValid || this.state.addingItem} style={{ minWidth: '90px' }}>
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
            <div><em><small>{this.props.note}</small></em></div>
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


class ArrayItem extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const data = this.props.data || [];

    return (
      <tr key={ data }>
        <td>{ data }</td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem.bind(this, data)} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
          </button>
        </td>
      </tr>
    );
  }
}


class UserMaxCount extends React.Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    // Blank equals inifite users
    const userCountMax = e.target.value === '' ? e.target.value : parseInt(e.target.value);
    this.props.addCompanyUserCountMax(userCountMax);
  }

  render() {
    return (
      <div style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="row">
          <div className="col-xs-2" style={{ textAlign: 'right' }}>
            <strong>User max</strong>
            <div><em><small>Maximum allowed users. Blank = infinite.</small></em></div>
          </div>
          <div className="col-xs-10">
            <input
              type="number"
              className="form-control"
              min="0"
              defaultValue={this.props.userCountMax}
              onChange={this.handleChange} />
          </div>
        </div>
      </div>
    );
  }
}


class Users extends React.Component {
  constructor(props){
    super(props);
    this.createUser = this.createUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.onChangeAddUser = this.onChangeAddUser.bind(this);
    this.state = {
      hasInput: false,
      inputValid: false,
      searchUserInProgress: false,
      searchUserTimer: null,
      foundUser: null
    };
  }


  onChangeAddUser() {
    const value = this.addUserInput.value;
    if(value.length > 0) {
      // Setting the inputValid flag now, because there is one second delay
      //  before se start searching for users in BPC
      this.setState({ hasInput: true, inputValid: false }, () => {

        clearTimeout(this.state.searchUserTimer);

        this.setState({ searchUserInProgress: true, searchUserTimer: setTimeout(() => {
          this.props.searchUser(value)
          .then(foundUser => this.setState({ inputValid: foundUser !== null, foundUser, searchUserInProgress: false }));
        }, 1000)});

      });
    } else {
      this.setState({ hasInput: false, inputValid: false });
    }
  }


  createUser() {
    const value = this.addUserInput.value;
    if(value.length > 0) {
      return this.setState({ creatingUser: true }, () => {
        return this.props.createUser(value)
        .then((response) => {

          this.setState({
            creatingUser: false,
            inputValid: true,
            hasInput: true,
            foundUser: {
              id: response.UID,
              email: response.profile.email || value
            }
          });
        })
        .catch((err) => {
          this.setState({ creatingUser: false });
        });
      });
    }
  }


  addUser() {
    const foundUser = this.state.foundUser;
    if(foundUser) {
      this.setState({ addingUser: true }, () => {
        this.props.addUser(foundUser);
          this.addUserInput.value = '';
          this.setState({
            addingUser: false,
            inputValid: false, // Setting inputValid to false to disable the button
            hasInput: false
          });
      });
    }
  }


  render() {

    // In case of undefined
    const users = this.props.users || [];

    let items = users.map((user) => <User key={user.uid} user={user} removeUser={this.props.removeUser} searchUser={this.props.searchUser} />)

    const inputClassName = this.state.hasInput && !this.state.inputValid ? 'form-group has-error' : 'form-group';

    // The "inputValid" means the user was already found.
    const createButtonDisabled = this.state.creatingUser || !this.state.hasInput || this.state.inputValid || this.state.searchUserInProgress;
    const addButtonDisabled = !this.state.inputValid || this.state.addingUser || this.state.searchUserInProgress;

    items.push(
      <tr key={-1}>
        <td>
          {/* <div className="form-group has-feedback"> */}
          <div className={inputClassName}>
            <input
              type="text"
              name="addUserInput"
              className="form-control input-sm"
              onChange={this.onChangeAddUser}
              ref={(addUserInput) => this.addUserInput = addUserInput} />
          </div>
        </td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-default' onClick={this.createUser} disabled={createButtonDisabled} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-cloud-upload' aria-hidden="true"></span> <span>Create</span>
          </button>
          <span>&nbsp;</span>
          <button type="button" className='btn btn-xs btn-success' onClick={this.addUser} disabled={addButtonDisabled} style={{ minWidth: '90px' }}>
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
            <div><em><small>{this.props.note}</small></em></div>
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


class User extends React.Component {
  constructor(props){
    super(props);
    this.getAddedByDetails = this.getAddedByDetails.bind(this);
    this.state = {
      foundUser: null,
      addedByUser: null
    };
  }


  getUserDetails() {
    this.props.searchUser(this.props.user.uid)
    .then((foundUser) => {
      if(foundUser) {
        this.setState({ foundUser });
      } else {
        // Waiting on the Gigya webhook
        setTimeout(() => this.getUserDetails(), 3000);
      }
    });
  }


  getAddedByDetails() {
    if(this.props.user.addedBy && this.props.user.addedBy.user) {
      Bpc.request(`/users/${ encodeURIComponent(this.props.user.addedBy.user) }`)
      .then(addedByUser => this.setState({ addedByUser }));
    }
  }


  componentDidUpdate(prevProps) {
    const fieldIsHereNow = this.props.user.addedBy && this.props.user.addedBy.user;
    const fieldWasHereBefore = prevProps.user.addedBy && prevProps.user.addedBy.user;

    if(fieldIsHereNow !== undefined && fieldWasHereBefore !== undefined && fieldIsHereNow !== fieldWasHereBefore) {
      this.getAddedByDetails();
    }
  }
  
  
  componentDidMount() {
    this.getUserDetails(this.props.user.uid);
    this.getAddedByDetails();    
  }

  render() {

    let item = <span>{ this.props.user.uid }</span>
    const foundUser = this.state.foundUser;

    if(foundUser) {
      item = <Link to={`/users?search=${ foundUser.id }`}>{ foundUser.email }</Link>
    }

    return (
      <tr key={this.props.user.uid}>
        <td>
          <div style={{ marginTop: '3px', marginBottom: '3px' }}>
            { item }
            <div><em><small>Added: {this.props.user.addedAt || ''}</small></em></div>
            <div><em><small>Added by: {(this.state.addedByUser ? this.state.addedByUser.email : null ) || (this.props.user.addedBy ? this.props.user.addedBy.user : '')}</small></em></div>
          </div>
        </td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeUser.bind(this, this.props.user)} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
          </button>
        </td>
      </tr>
    );
  }
}


class CompanyCreate extends React.Component {
  constructor(props){
    super(props);
    this.onClickCreateCompany = this.onClickCreateCompany.bind(this);
    this.state = {
      canCreateCompanies: false
    };
  }


  onClickCreateCompany() {
    const title = this.companyTitleBox.value;
    if(title.length > 0) {
      return this.setState({ creatingCompany: true }, () => {
        return this.props.createCompany({ title }, () => {
          return this.setState({ creatingCompany: false });
        });
      });
    }
  }

  componentDidMount() {
    const canCreateCompanies = Bpp.isCompanyUser() || Bpp.isCompanyAdmin();
    this.setState({ canCreateCompanies });
  }


  render() {

    if(!this.state.canCreateCompanies) {
      return (null);
    }

    const createButtonDisabled = this.state.creatingCompany;

    return(
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-8">
            <input
                type="text"
                name="companyTitleBox"
                onChange={this.onTitleSearchChange}
                className="form-control"
                placeholder="Type company name to create"
                ref={(companyTitleBox) => this.companyTitleBox = companyTitleBox} />
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>Min. 3 chars. Max. 100 chars.</em></small></div>
          </div>
          <div className="col-xs-4" style={{ textAlign: 'left' }}>
            <button type="button" className="btn btn-default" onClick={this.onClickCreateCompany} disabled={createButtonDisabled}>
              <span className="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> <span>Create</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
