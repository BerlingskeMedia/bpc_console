const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.setUsers = this.setUsers.bind(this);
    this.state = {users: null};
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

    let searchText = encodeURIComponent(this.searchBox.value);

    this.setState({searchInProgress: true});

    return $.ajax({
      type: 'GET',
      url: `/_b/users?email=${searchText}&id=${searchText}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.props.setUsers(data);
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    }).always(() => {
      this.setState({searchInProgress: false});
    });
  }

  clearSearch() {
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
            readOnly={this.state.searchInProgress}
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
          <UserDetails key={u.id + 'searchresult'} user={u} />
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
    this.state = {
      user: null
    };
  }

  componentDidMount() {

    const user_id = this.props.user.id;

    $.ajax({
      type: 'GET',
      url: `/_b/users/${user_id}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({user: data});
    });
  }

  render() {
    console.log('fulluser', this.state.user);
    return (
      this.state.user !== null
      ? <div style={{marginTop: '30px', marginBottom: '30px'}}>
          <UserDetails key={this.state.user.id + 'fulluser_1'} user={this.state.user} />
          <DataScopes key={this.state.user.id + 'fulluser_2'} dataScopes={this.state.user.dataScopes} />
          <Grants key={this.state.user.id + 'fulluser_3'} grants={this.state.user.grants} />
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
          </div>
          <div className="col-xs-6">
            {dataFromGigya}
            <RecalcPermissionsButton user={user} />
          </div>
        </div>
        <hr />
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


class DataScopes extends React.Component {

  constructor(props){
    super(props);
  }

  render() {

    var scopes = Object.keys(this.props.dataScopes ? this.props.dataScopes : {}).map(function (name, index) {
      return <ScopePermissions key={index} name={name} permissions={this.props.dataScopes[name]} />
    }.bind(this));

    return (
      <div className="row">
        <div className="col-xs-12">
          {scopes}
          { !scopes || Object.keys(scopes).length === 0
            ? <div>(This user has no permissions.)</div>
            : scopes
          }
        </div>
      </div>
    );
  }
}


class ScopePermissions extends React.Component {

  constructor(props){
    super(props);
  }

  render() {
    return (
      <div style={{marginBottom: '10px'}}>
        <div className="row">
          <div className="col-xs-12">
            <h4>Scope: {this.props.name}</h4>
          </div>
        </div>
        <PermissionsTable permissions={this.props.permissions}/>
      </div>
    );
  }
}


class PermissionsTable extends React.Component {

  constructor(props){
    super(props);
  }

  mapIntoMoreRows(name, permissionArray){

    let rows = [
      <PermissionField key={name} name={name} data="(See array items below)" />
    ];

    var permissionArrayRows = permissionArray.map(function (value, index) {
      let key = name + '.' + index.toString();
      return typeof permissionArray[index] === 'object'
        ? <PermissionObject key={key} name={key} data={permissionArray[index]} />
        : <PermissionField key={key} name={key} data={permissionArray[index]} />
    });

    return rows.concat(permissionArrayRows);
  }

  elementTypeIsAnObject(element, index, array){
    return typeof element === 'object';
  }

  render() {
    let permissions = Object.keys(this.props.permissions).map(function (name, index) {
      // If the permission is an array and some elements is an object, then we split the permission over multiple rows
      return this.props.permissions[name] instanceof Array
          && this.props.permissions[name].some(this.elementTypeIsAnObject)
        ? this.mapIntoMoreRows(name, this.props.permissions[name])
        : typeof this.props.permissions[name] === 'object'
          ? <PermissionObject key={index} name={name} data={this.props.permissions[name]} />
          : <PermissionField key={index} name={name} data={this.props.permissions[name]} />
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


class PermissionObject extends React.Component {

  constructor(props){
    super(props);
  }

  render() {
    return (
      <tr>
        <td className="col-xs-2">{this.props.name}</td>
        <td className="col-xs-10">
          {JSON.stringify(this.props.data)}
        </td>
      </tr>
    );
  }
}


class PermissionField extends React.Component {

  constructor(props){
    super(props);
  }

  render() {
    return (
      <tr>
        <td className="col-xs-2">{this.props.name}</td>
        <td className="col-xs-10">
          {this.props.data.toString()}
        </td>
      </tr>
    );
  }
}


class Grants extends React.Component {

  constructor(props){
    super(props);
  }

  render() {

    const grants = this.props.grants.map(function(grant, index) {
      const scopes = grant.scope.map(function(scope){
        return (
          <div key={index + '.' + scope}>
            <span>&nbsp;</span>
            <span className="label label-info">{scope}</span>
          </div>
        );
      });
      return (
        <div key={index} className="row" style={{paddingBottom: '10px'}}>
          <div className="col-xs-6">
            Grant: <strong>{grant.app}</strong>
          </div>
          <div className="col-xs-2">
            {grant.exp
              ? <span>Expires: <em>{grant.exp}</em></span>
              : <span>Expires: <em>Never</em></span>
            }
          </div>
          <div className="col-xs-4">
            Scopes:
            { scopes.length > 0
              ? scopes
              : <span>(ingen)</span>
            }
          </div>
        </div>
      );
    });

    return(
      <div>
        <hr />
        { grants === null || grants.length === 0
          ? <div>(This user has no grants.)</div>
          : grants
        }
      </div>
    );
  }
}
