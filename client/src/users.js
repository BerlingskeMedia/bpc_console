const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');
const Bpp = require('./components/bpp');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.setUsers = this.setUsers.bind(this);
    this.state = { users: null };

    document.title = 'BPC - Users';
  }

  
  setUsers(users) {
    // We clear state so that it triggers a re-render in the SearchResult component
    this.setState({users: []});
    this.setState({users: users});
  }


  componentDidMount() {
  }


  render() {

    let content = null;
    if(this.state.users !== null) {
      content = this.state.users.length === 1
        ? <ShowFullUser user={this.state.users[0]} />
        : <SearchResult users={this.state.users} />;
    }

    return (
      <div className="users" style={{paddingTop: '30px'}}>
        <SearchUser setUsers={this.setUsers} />
        {content}
      </div>
    );
  }
}


class SearchUser extends React.Component {

  constructor(props){
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onClickReload = this.onClickReload.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.state = {
      searchInProgress: false,
      searchTimer: null
    };
  }


  componentDidMount() {
    const searchText = getUrlParameter("search");
    if(searchText.length > 0) {
      this.searchBox.value = decodeURIComponent(searchText);
      this.searchUser();
    }
  }


  onSearchChange(e) {
    // // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    if (this.searchBox.value.length > 0) {
      this.setState({searchTimer: setTimeout(this.searchUser, 1000)});
    } else {
      this.setState({searchTimer: setTimeout(this.clearSearch, 1000)});
    }
  }


  onClickReload(e) {
    if (this.searchBox.value.length > 0) {
      this.searchUser();
    }
  }


  searchUser() {
    if(this.state.searchInProgress){
      return false;
    }

    const searchText = encodeURIComponent(this.searchBox.value);

    if (searchText.length === 0) {
      return false;
    }

    this.setState({searchInProgress: true});

    return Bpc.request(`/users?email=${ searchText }&id=${ searchText }`)
    .then(data => {
      window.history.pushState({ search: searchText }, "search", `/users?search=${searchText}`);
      this.props.setUsers(data);
    })
    .finally(() => {
      this.setState({searchInProgress: false});
    });
  }


  clearSearch() {
    window.history.pushState({ search: "" }, "search", `/users`);
    document.title = 'BPC - Users';
    this.props.setUsers(null);
  }


  render() {
    return (
      <div className="row">
        <div className="col-xs-11">
          <input
            type="text"
            name="searchBox"
            autoFocus={true}
            onChange={this.onSearchChange}
            className="form-control"
            placeholder="Type email or ID to start search"
            ref={(searchBox) => this.searchBox = searchBox} />
        </div>
        <div className="col-xs-1">
          <div className="text-right">
            <button className="btn btn-default" type="submit" onClick={this.onClickReload}>
              <span className="glyphicon glyphicon-repeat" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}


class SearchResult extends React.Component {

  constructor(props){
    super(props);
  }

  render(){

    document.title = 'BPC - Users';

    let rows = [];

    if (this.props.users === null) {

      return null;

    } else if (this.props.users.length === 0) {

      rows = [
        <div key={1} className="row">
          <div className="col-xs-6">
            <p>No result</p>
          </div>
        </div>
      ];

    } else if (this.props.users.length === 1) {

      // Should in theory not happen

    } else if (this.props.users.length > 1) {

      rows = this.props.users.map((u,i) => {
        return (
          <div key={u.id + i + 'searchresult'}>
            <UserDetails user={u} />
            <hr />
          </div>
        );
      });

    }

    return (
      <div style={{marginTop: '30px', marginBottom: '30px'}}>
        {rows}
      </div>
    );
  }
}


class ShowFullUser extends React.Component {

  constructor(props){
    super(props);
    this.getUserData = this.getUserData.bind(this);
    this.deleteGrant = this.deleteGrant.bind(this);
    this.expireGrant = this.expireGrant.bind(this);
    this.reactivateGrant = this.reactivateGrant.bind(this);
    this.updateGrant = this.updateGrant.bind(this);
    this.state = {
      user: null
    };
  }

  getUserData(user_id) {
    return Bpc.request(`/users/${ user_id }`)
    .then(data => {
      this.setState({user: data});
      document.title = `BPC - ${ data.email }`;
    });
  }

  deleteGrant(grant) {
    return Bpc.request('/grants', {
      method: 'PATCH',
      body: JSON.stringify(grant)
    })
    .then(data => {
      var user = this.state.user;
      const index = user.grants.findIndex(e => {
        return e.id === grant.id;
      });
      if(data.status === 'ok' && index > -1) {
        let temp = user.grants.slice();
        temp.splice(index, 1);
        user.grants = temp;
        this.setState({user: user});
      }
    });
  }

  expireGrant(grant) {

    grant.exp = Date.now();
    return this.updateGrant(grant);

  }

  reactivateGrant(grant) {

    grant.exp = null;
    return this.updateGrant(grant);

  }

  updateGrant(grant) {
    return Bpc.request('/grants', {
      method: 'POST',
      body: JSON.stringify(grant)
    })
    .then(data => {
      var user = this.state.user;
      const index = user.grants.findIndex(e => {
        return e.id === grant.id;
      });
      user.grants[index] = grant;
      this.setState({ user: user });
    });
  }


  componentDidMount() {
    this.getUserData(this.props.user._id);
  }
  
  componentDidUpdate(prevProps) {
    if (this.props.user._id !== prevProps.user._id) {
      this.getUserData(this.props.user._id);
    }
  }

  render() {
    return (
      this.state.user !== null
      ? <div style={{marginTop: '30px', marginBottom: '30px'}}>
          <UserDetails key={this.state.user.id + 'fulluser_1'} user={this.state.user} />
          <Access key={this.state.user.id + 'fulluser_4'} dataScopes={this.state.user.dataScopes} />
          <hr />
          <Permissions key={this.state.user.id + 'fulluser_2'} user={this.state.user} dataScopes={this.state.user.dataScopes} />
          <hr />
          <Grants
            key={this.state.user.id + 'fulluser_3'}
            grants={this.state.user.grants}
            deleteGrant={this.deleteGrant}
            expireGrant={this.expireGrant}
            reactivateGrant={this.reactivateGrant} />
          <hr />
          <DeleteUser user={this.state.user._id} />
        </div>
      : null
    );
  }
}


class UserDetails extends React.Component {

  constructor(props){
    super(props);
  }

  render() {
    let dataFromGigya;
    const user = this.props.user;

    if (user.gigya) {
      dataFromGigya = (
        <div>
          <h4>Gigya</h4>
          <table className="table table-condensed">
            <tbody>
              {/* { gigyaTableRows } */}
              <tr><td><span className="label label-default">UID</span></td><td>{user.gigya.UID}</td></tr>
              <tr><td><span className="label label-default">Login provider</span></td><td>{user.gigya.loginProvider || ''}</td></tr>
              <tr><td><span className="label label-default">Email</span></td><td>{user.gigya.profile ? user.gigya.profile.email : user.gigya.email || ''}</td></tr>
              { user.gigya.emails && user.gigya.emails.verified instanceof Array
                ? <tr><td><span className="label label-default">Verified emails</span></td><td>{ user.gigya.emails.verified.join(', ') }</td></tr>
                : null
              }
              { user.gigya.emails && user.gigya.emails.unverified instanceof Array
                ? <tr><td><span className="label label-default">Unverified emails</span></td><td>{ user.gigya.emails.unverified.join(', ') }</td></tr>
                : null
              }
            </tbody>
          </table>
        </div>
      );
    }

    const styleProviderColor = 
      user.provider === 'gigya' ? "#ff0000" : // Red
      user.provider === 'google' ? "#0000ff" : // Blue
      "#333"; // Standard dark

    return (
      <div>
        <div className="row">
          <div className="col-xs-6">
            <h4>BPC</h4>
            <table className="table table-condensed">
              <tbody>
                <tr><td><span className="label label-default">ID</span></td><td>{user.id}</td></tr>
                <tr><td><span className="label label-default">Email</span></td><td>{user.email}</td></tr>
                <tr><td><span className="label label-default">Provider</span></td><td><span style={{ color: styleProviderColor}}>{user.provider}</span></td></tr>
                <tr><td><span className="label label-default">Internt id</span></td><td>{user._id}</td></tr>
                <tr><td><span className="label label-default">Created</span></td><td>{user.createdAt}</td></tr>
                <tr><td><span className="label label-default">Last updated</span></td><td>{user.lastUpdated}</td></tr>
                <tr><td><span className="label label-default">Last fetched</span></td><td>{user.lastFetched}</td></tr>
                <tr><td><span className="label label-default">Last login</span></td><td>{user.lastLogin}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="col-xs-6">
            { dataFromGigya }
            <GigyaResetPassword user={ user } />
            <RecalcPermissionsButton user={ user } />
          </div>
        </div>
      </div>
    );
  }
}


class GigyaResetPassword extends React.Component {
  constructor(props){
    super(props);
    this.isvalid = this.isvalid.bind(this);
    this.showConfirm = this.showConfirm.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.state = {
      showConfirmReset: false,
      confirmResetTimeout: null,
      resetSuccesfulFadeOutTimeout: null
    }
  }

  isvalid() {
    if(this.newPasswordInput.value.length < 6) {
      return false;
    }

    if(this.props.user.provider !== 'gigya') {
      return false;
    }

    if(!this.props.user.email) {
      return false;
    }

    return {
      loginID: this.props.user.email,
      newPassword: this.newPasswordInput.value
    };
  }


  showConfirm() {
    if(!this.isvalid()) {
      alert('Invalid user or password');
      return;
    }

    confirmResetTimeout = setTimeout(() => {
      this.setState({ showConfirmReset: false });
    }, 2000);

    this.setState({
      showConfirmReset: true,
      confirmResetTimeout
     });
  }


  resetPassword() {
    const payload = this.isvalid();
    if(!payload) {
      alert('Invalid user or password');
      return;
    }

    return Bpc.request('/gigya/resetPassword', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then(() => {
      this.newPasswordInput.value = '';
      $('.resetSuccess').fadeIn(100);
      if(this.state.resetSuccesfulFadeOutTimeout) {
        clearTimeout(this.state.messageSentSuccesfulFadeOutTimeout);
      }

      const newResetSuccesfulFadeOutTimeout = setTimeout(
        function() {
          $('.resetSuccess').fadeOut(600);
        },
        3000
      );

      this.setState({
        resetSuccesfulFadeOutTimeout: newResetSuccesfulFadeOutTimeout
      });
    })
    .catch(err => {
      alert('Error');
    });
  }

  render() {
    if(this.props.user.provider !== 'gigya') {
      return null;
    }
    return(
      <div className="form-inline">
        <div className="form-group">
          <input
            type="text"
            name="newPasswordInput"
            className="form-control input"
            placeholder="Set new password"
            disabled={this.state.showConfirmReset}
            ref={(newPasswordInput) => this.newPasswordInput = newPasswordInput} />
        </div>
        <span>&nbsp;</span>
        <button type="button" className="btn btn btn-default" onClick={this.showConfirm} disabled={this.state.showConfirmReset}>Reset password</button>
        <span>&nbsp;</span>
        { this.state.showConfirmReset
          ? <button type="button" className="btn btn btn-danger" onClick={this.resetPassword}>Confirm</button>
          : null
        }
        <span className="resetSuccess" style={{color: '#008000', verticalAlign: 'middle', marginLeft: '10px', display: 'none'}}>Password reset</span>
      </div>
    );
  }
}


class RecalcPermissionsButton extends React.Component {

  constructor(props){
    super(props);
    this.requestUpdatePermissions = this.requestUpdatePermissions.bind(this);
    this.state = {
      authorized: false,
      messageSentSuccesfulFadeOutTimeout: null
    }
  }

  componentDidMount() {
    return Bpp.authorize()
    .then(() => {
      this.setState({ authorized: true });
    })
    .catch(err => {
      this.setState({ authorized: false });
    })
  }

  requestUpdatePermissions() {
    const message = {
      "type": "updatePermissions",
      "uid": this.props.user.id
    };

    return Bpp.request(`/api/accounts/message`, {
      method: 'POST',
      body: JSON.stringify(message)
    })
    .then(() => this.setState({ messageSent: true }))
    .then(() => {
      $('.messageSentSuccess').fadeIn(100);
      if(this.state.messageSentSuccesfulFadeOutTimeout) {
        clearTimeout(this.state.messageSentSuccesfulFadeOutTimeout);
      }

      const newMessageSentSuccesfulFadeOutTimeout = setTimeout(
        function() {
          $('.messageSentSuccess').fadeOut(600);
        },
        3000
      );

      this.setState({
        messageSentSuccesfulFadeOutTimeout: newMessageSentSuccesfulFadeOutTimeout
      });
    })
  }

  render() {

    if(!this.state.authorized) {
      return false;
    }

    if(this.props.user.provider !== 'gigya') {
      return null;
    }

    return (
      <div style={{paddingTop: '5px'}}>
        <button className="btn btn-default" type="button" onClick={this.requestUpdatePermissions}>
          Recalc permissions
        </button>
        <span className="messageSentSuccess" style={{color: '#008000', verticalAlign: 'middle', marginLeft: '10px', display: 'none'}}>Message sent</span>
      </div>
    );
  }
}


class Access extends React.Component {

  constructor(props){
    super(props);
  }

  render() {

    const dataScopes = this.props.dataScopes || {};
    const dataScopesKeys = Object.keys(dataScopes);

    const requiredAccessObjects = ['berlingske', 'bt', 'weekendavisen'];

    // If any of the keys 'berlingske', 'bt', 'weekendavisen' are missing, or they don't have an "access" object
    if(dataScopesKeys.length === 0
      || requiredAccessObjects.some(key => dataScopesKeys.indexOf(key) === -1)
      || requiredAccessObjects.some(key => !dataScopes[key].hasOwnProperty('access'))) {
      return null;
    }

    const calculatedAt = dataScopes.berlingske.access.calculatedAt;

    const yes = <span className="glyphicon glyphicon-ok" style={{color: 'lightgreen'}} aria-hidden="true"></span>;
    const no = <span className="glyphicon glyphicon-minus" style={{color: 'red'}} aria-hidden="true"></span>;

    return(
      <div>
        <hr />
        <table className="table table-striped">
          <thead>
            <tr>
              <th></th>
              <th>Web</th>
              <th>E-paper</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Berlingske</th>
              <td>{dataScopes.berlingske.access.bdk_paywall ? yes : no}</td>
              <td>{dataScopes.berlingske.access.bdk_apps ? yes : no}</td>
            </tr>
            <tr>
              <th>BT</th>
              <td></td>
              <td>{dataScopes.bt.access.bta_epaper ? yes : no}</td>
            </tr>
            <tr>
              <th>Weekendavisen</th>
              <td>{dataScopes.weekendavisen.access.wea_paywall ? yes : no}</td>
              <td>{dataScopes.weekendavisen.access.waa_epaper ? yes : no}</td>
            </tr>
          </tbody>
        </table>
        <div style={{textAlign: 'right'}}><em><small>Calculated at {calculatedAt}</small></em></div>
      </div>
    );
  }
}


class Permissions extends React.Component {

  constructor(props){
    super(props);
    this.setActiveTab = this.setActiveTab.bind(this);
    this.state = {
      activeTab: null
    };
  }

  componentDidMount() {
    const scopes = Object.keys(this.props.dataScopes ? this.props.dataScopes : {}).sort();
    this.setState({
      scopes: scopes,
      activeTab: scopes.length > 0 ? scopes[0] : null
    });
  }

  setActiveTab(e) {
    this.setState({ activeTab: e });
  }

  render() {

    if(!this.state.scopes || Object.keys(this.state.scopes).length === 0) {
      return <div>(This user has no scope data.)</div>
    }

    var navItems = this.state.scopes.map(function (name, index) {
      
      const isActive = this.state.activeTab === name;

      return (
        <li key={index} role="presentation" name={name} className={`${ isActive ? 'active' : '' }`} onClick={this.setActiveTab.bind(this, name)}>
          <a>{name}</a>
        </li>
      );
    }.bind(this));

    // Key __all__ is unlikelig to be used as a real scope name someday.
    navItems.push(
      <li key="__all__" role="presentation" name="__all__" className={`${ this.state.activeTab === "__all__" ? 'active' : '' }`} onClick={this.setActiveTab.bind(this, "__all__")}>
          <a><em>(all)</em></a>
      </li>
    );

    const showScope = this.state.activeTab === '__all__'
      ? <AllDataScopes dataScopes={this.props.dataScopes} />
      : <PermissionScope user={this.props.user} scope={this.state.activeTab} />;

    return (
      <div>
        <div className="row">
          <div className="col-xs-12">
            <h4>Permissions</h4>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-2">
            <ul className="nav nav-pills nav-stacked">
              { navItems }
            </ul>
          </div>
          <div className="col-xs-10">
            { showScope }
          </div>
        </div>
      </div>
    );
  }
}


class AllDataScopes extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const rawScopes = Object.keys(this.props.dataScopes ? this.props.dataScopes : {}).map((scope, index) => {
      return <DataScope key={index} scope={scope} dataScope={this.props.dataScopes[scope]} />
    });

    return (
      <div className="row">
        <div className="col-xs-12">
          { rawScopes }
        </div>
      </div>
    );
  }
}


class PermissionScope extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      dataScope: {}
    };
  }

  componentDidMount() {
    this.getPermissions(this.props)
  }
  
  componentDidUpdate(prevProps) {
    if (this.props.scope !== prevProps.scope || this.props.user !== prevProps.user) {
      this.getPermissions(this.props)
    }
  }

  getPermissions({user, scope}) {
    const dataScope = user.dataScopes[scope] || null;
    this.setState({ dataScope: dataScope });
  }

  render() {
    return (
      <DataScopeTable dataScope={ this.state.dataScope } />
    );
  }
}


class DataScope extends React.Component {

  constructor(props){
    super(props);
  }

  render() {
    return (
      <div style={{marginBottom: '10px'}}>
        <div className="row">
          <div className="col-xs-12">
            <h4>Scope: {this.props.scope}</h4>
          </div>
        </div>
        <DataScopeTable dataScope={this.props.dataScope}/>
      </div>
    );
  }
}


class DataScopeTable extends React.Component {

  constructor(props){
    super(props);
  }

  mapIntoMoreRows(name, permissionArray){

    let rows = [
      <EmField key={name} name={name} data="(See array items below)" />
      
    ];


    var permissionArrayRows = permissionArray.map(function (value, index) {
      let key = name + '.' + index.toString();
      return (
        <DataField key={key} name={key} data={permissionArray[index]} />
      );
    });

    return rows.concat(permissionArrayRows);
  }

  elementTypeIsAnObject(element, index, array){
    return typeof element === 'object';
  }

  render() {
    let permissions = Object.keys(this.props.dataScope).map(function (name, index) {
      // If the permission is an array and some elements is an object, then we split the permission over multiple rows
      return this.props.dataScope[name] instanceof Array
          && this.props.dataScope[name].some(this.elementTypeIsAnObject)
        ? this.mapIntoMoreRows(name, this.props.dataScope[name])
        : <DataField key={index} name={name} data={this.props.dataScope[name]} />
    }.bind(this));

    return (
      <table className="table table-condensed">
        <tbody>
          {permissions}
        </tbody>
      </table>
    );
  }
}


class DataField extends React.Component {

  constructor(props){
    super(props);
  }

  render() {

    const dataType = typeof this.props.data;
    const data = dataType === 'object'
      ? JSON.stringify(this.props.data, undefined, 2)
      : dataType === 'string'
        ? '"' + this.props.data + '"'
        : this.props.data.toString();

    return (
      <tr>
        <td className="col-xs-2" style={{verticalAlign: 'middle'}}>{this.props.name}</td>
        <td className="col-xs-10">
          <pre>{data}</pre>
        </td>
      </tr>
    );
  }
}


class EmField extends React.Component {

  constructor(props){
    super(props);
  }

  render() {
    return (
      <tr>
        <td className="col-xs-2" style={{verticalAlign: 'middle'}}>{this.props.name}</td>
        <td className="col-xs-10"><em>{this.props.data}</em></td>
      </tr>
    );
  }
}


class Grants extends React.Component {

  constructor(props){
    super(props);
  }

  render() {

    const grants = this.props.grants.map(function(grant) {
      return (
        <tr key={grant.id}>
          <td className="col-xs-6">
            <Link to={`/application/${grant.app}`}>{grant.app}</Link>
            <br />
            <small><em>Last login: {grant.lastLogin || 'n/a'}</em></small>
          </td>
          <td className="col-xs-2">
            {grant.exp
              ? <span>{ new Date(grant.exp).toGMTString() }</span>
              : <span>Never</span>
            }
          </td>
          <td className="col-xs-2">
            { grant.exp && grant.exp < Date.now()
              ? <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.props.deleteGrant.bind(this, grant)}>Delete grant</button>
              : null
            }
          </td>
          <td className="col-xs-2">
            { grant.exp && grant.exp < Date.now()
              ? <button type="button" className="btn btn-primary btn-sm btn-block" onClick={this.props.reactivateGrant.bind(this, grant)}>Reactivate grant</button>
              : <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.props.expireGrant.bind(this, grant)}>Expire grant</button>
            }
          </td>
        </tr>
      );
    }.bind(this));

    return(
      <div style={{paddingTop: '30px', paddingBottom: '30px'}}>
        <h4>All grants</h4>
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-6">App</th>
              <th className="col-xs-2">Expires</th>
              <th className="col-xs-2"></th>
              <th className="col-xs-2"></th>
            </tr>
            { grants !== null && grants.length > 0
              ? grants
              : null
            }
          </tbody>
        </table>
      </div>
    );
  }
}


class DeleteUser extends React.Component {

  constructor(props){
    super(props);
    this.deleteUser = this.deleteUser.bind(this);
  }

  warnDeleteUserToggle(){
    $('.warnDeleteUser').toggle();
  }

  deleteUser() {
    return Bpc.request(`/users/${ this.props.user }`, {
      method: 'DELETE',
    })
    .then(data => {
      location.search = '';
    });
  }

  render() {
    return (
      <div className="row">
        <div className="col-xs-2 col-xs-offset-6">
          <div className="warnDeleteUser text-right" style={{display: 'none'}}>
            Sure?
          </div>
        </div>
        <div className="col-xs-2">
          <div className="warnDeleteUser" style={{display: 'none'}}>
            <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.deleteUser}>Yes</button>
          </div>
        </div>
        <div className="col-xs-2">
          <div className="warnDeleteUser">
            <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.warnDeleteUserToggle}>Delete user</button>
          </div>
          <div className="warnDeleteUser" style={{display: 'none'}}>
            <button type="button" className="btn btn-success btn-sm btn-block" onClick={this.warnDeleteUserToggle}>No</button>
          </div>
        </div>
      </div>
    );
  }
};


function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
