const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.setUsers = this.setUsers.bind(this);
    this.state = { users: null };
  }

  setUsers(users) {
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

    return $.ajax({
      type: 'GET',
      url: `/_b/users?email=${searchText}&id=${searchText}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      window.history.pushState({ search: searchText }, "search", `/users?search=${searchText}`);
      this.props.setUsers(data);
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    }).always(() => {
      this.setState({searchInProgress: false});
    });
  }

  clearSearch() {
    window.history.pushState({ search: "" }, "search", `/users`);
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
    $.ajax({
      type: 'GET',
      url: `/_b/users/${user_id}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({user: data});
    });
  }

  deleteGrant(grant) {
    return $.ajax({
      type: 'PATCH',
      url: `/_b/grants`,
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
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
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
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
    return $.ajax({
      type: 'POST',
      url: `/_b/grants`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      var user = this.state.user;
      const index = user.grants.findIndex(e => {
        return e.id === grant.id;
      });
      user.grants[index] = grant;
      this.setState({user: user});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
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
      dataFromGigya = Object.keys(user.gigya).map(function(gigya_key) {
        return (
          <div key={gigya_key}><strong>Gigya {gigya_key}</strong>: {user.gigya[gigya_key]}</div>
        );
      });
      
      const gigya_url = `https://console.gigya.com/Site/partners/UserManagement.aspx/User#/details/id/${user.gigya.UID}/identity/all`;

      dataFromGigya.push(
        <div key="gigya_link">
          <a href={gigya_url} target="_blank">Link to Gigya</a>
        </div>
      );
    }

    const hasKuUid = user.dataScopes && user.dataScopes.profile && user.dataScopes.profile.kundeunivers_uid;
    const showLinkToKu = hasKuUid && window.location.hostname === 'console.berlingskemedia.net';
    const linkToKu = showLinkToKu ? <a href={`https://admin.kundeunivers.dk/user/${ user.dataScopes.profile.kundeunivers_uid }`} target="_blank">Link til KU Admin</a> : null;

    const styleProviderColor = 
      user.provider === 'gigya' ? "#ff0000" : // Red
      user.provider === 'google' ? "#0000ff" : // Blue
      "#333"; // Standard dark

    return (
      <div>
        <div className="row">
          <div className="col-xs-6">
            <div><strong>ID</strong>: {user.id}</div>
            <div><strong>Email</strong>: {user.email}</div>
            <div><strong>Provider</strong>: <span style={{ color: styleProviderColor}}>{user.provider}</span></div>
            <div><strong>Internt id</strong>: {user._id}</div>
            <div><strong>Created</strong>: {user.createdAt}</div>
            <div><strong>Last updated</strong>: {user.lastUpdated}</div>
            <div><strong>Last fetched</strong>: {user.lastFetched}</div>
            <div><strong>Last login</strong>: {user.lastLogin}</div>
          </div>
          <div className="col-xs-6">
            { dataFromGigya }
            { linkToKu }
            <RecalcPermissionsButton user={ user } />
          </div>
        </div>
      </div>
    );
  }
}


class RecalcPermissionsButton extends React.Component {

  constructor(props){
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(recalcPermissionsUrl) {
    return $.ajax({
      type: 'GET',
      url: recalcPermissionsUrl
    }).done((data, textStatus, jqXHR) => {
      console.log('recalc', data, textStatus);
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  render() {
    let nameQueryParam;

    if (this.props.user.gigya && this.props.user.gigya.UID) {
      nameQueryParam = this.props.user.gigya.UID;
    } else if (this.props.user.dataScopes && this.props.user.dataScopes.profile) {
      if (this.props.user.dataScopes.profile.sso_id) {
        nameQueryParam = this.props.user.dataScopes.profile.sso_id;
      } else if (this.props.user.dataScopes.profile.sso_uid) {
        nameQueryParam = this.props.user.dataScopes.profile.sso_uid;
      }
    }

    if (nameQueryParam) {
      let recalcPermissionsUrl =
      window.location.hostname === 'console.berlingskemedia.net' ?
      'https://admin.kundeunivers.dk/tester?name='.concat(nameQueryParam) :
      window.location.hostname === 'console.berlingskemedia-testing.net' ?
      'https://admin.kundeunivers-testing.dk/tester?name='.concat(nameQueryParam) :
      window.location.hostname === 'localhost' ?
      'https://admin.kundeunivers-testing.dk/tester?name='.concat(nameQueryParam) :
      null;

      return (
        <div style={{paddingTop: '5px'}}>
          <button className="btn btn-default" type="button" onClick={this.onClick.bind(this, recalcPermissionsUrl)}>
            Recalc KU permissions
          </button>
        </div>
      );
    } else {
      return null;
    }
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

    // Key __raw__ is unlikelig to be used as a real scope name someday.
    navItems.push(
      <li key="__raw__" role="presentation" name="__raw__" className={`${ this.state.activeTab === "__raw__" ? 'active' : '' }`} onClick={this.setActiveTab.bind(this, "__raw__")}>
          <a><em>RAW</em></a>
      </li>
    );

    const showScope = this.state.activeTab === '__raw__'
      ? <RawDataScopes dataScopes={this.props.dataScopes} />
      : <PermissionScope user={this.props.user._id} scope={this.state.activeTab} />;

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


class RawDataScopes extends React.Component {
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
    console.log('comss')
    console.log(this.props);
    this.getPermissions(this.props)
  }
  
  componentDidUpdate(prevProps) {
    console.log('comsssdsdsds')
    console.log('a', this.props)
    console.log('b', prevProps)
    if (this.props.scope !== prevProps.scope || this.props.user !== prevProps.user) {
      // this.fetchData(this.props.scope);
      console.log('fedt', this.props.scope)
      this.getPermissions(this.props)
    }
  }

    getPermissions({user, scope}) {
      return $.ajax({
        type: 'GET',
        url: `/_b/users/${user}`
      }).done((data, textStatus, jqXHR) => {

        const dataScope = data.dataScopes[scope] || {};
        console.log('dataScope')
        console.log(dataScope)

        this.setState({ dataScope: dataScope });
        }).fail((jqXHR, textStatus, errorThrown) => {
        console.error(jqXHR.responseText);
        this.setState({ dataScope: null });
      });
    }

  // AAAR requrires app key
  // getPermissions({user, scope}) {
  //   return $.ajax({
  //     type: 'GET',
  //     url: `/_b/permissions/${user}/${scope}`
  //   }).done((data, textStatus, jqXHR) => {
  //     this.setState({ dataScope: data });
  //   }).fail((jqXHR, textStatus, errorThrown) => {
  //     console.error(jqXHR.responseText);
  //     this.setState({ dataScope: null });
  //   });
  // }

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
          </td>
          <td className="col-xs-2">
            {grant.exp
              ? <span>{grant.exp}</span>
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
    return $.ajax({
      type: 'DELETE',
      url: '/_b/users/'.concat(this.props.user),
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      location.search = '';
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
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
};