const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.setUsers = this.setUsers.bind(this);
    this.state = {users: []};
  }

  setUsers(users) {
    this.setState({users: users});
  }

  componentDidMount() {
  }

  render() {
    return (
      <div className="users" style={{paddingTop: '30px'}}>
        <SearchUser setUsers={this.setUsers} />
        <SearchResult users={this.state.users} />
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
    this.state = {
      searching: false,
      searchTimer: null
    };
  }

  onSearchChange(e) {
    // // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    if (this.searchBox.value.length > 0) {
      this.setState({searchTimer: setTimeout(this.searchUser, 1000)});
    }
  }

  onClickReload(e) {
    if (this.searchBox.value.length > 0) {
      this.searchUser();
    }
  }

  searchUser() {
    if(this.state.searching){
      return false;
    }

    let searchText = encodeURIComponent(this.searchBox.value);

    this.setState({searching: true});

    return $.ajax({
      type: 'GET',
      url: `/_b/users?email=${searchText}&id=${searchText}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.props.setUsers(data);
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    }).always(() => {
      this.setState({searching: false});
    });
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
            readOnly={this.state.searching}
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

    if (this.props.users.length !== 1) {
      return null;
    }

    const user = this.props.users[0];
    let dataFromGigya;

    if (user.gigya) {
      dataFromGigya = Object.keys(user.gigya).map(function(key) {
        return (
          <span key={key}>
            <dt>Gigya {key}</dt>
            <dd>{user.gigya[key]}</dd>
          </span>
        );
      });
    }

    return (
      <div style={{marginTop: '30px', marginBottom: '30px'}}>
          <div>
          <div className="row">
            <div className="col-xs-6">
              <span>
                <dt>ID</dt>
                <dd>{user.id}</dd>
              </span>
              <span>
                <dt>Created</dt>
                <dd>{user.createdAt}</dd>
              </span>
              <span>
                <dt>Last updated</dt>
                <dd>{user.lastUpdated}</dd>
              </span>
              <span>
                <dt>Last fetched</dt>
                <dd>{user.lastFetched}</dd>
              </span>
              { user.email
                ? <span>
                    <dt>Email (tmp)</dt>
                    <dd>{user.email}</dd>
                  </span>
                : null
              }
            </div>
            <div className="col-xs-6">
              {dataFromGigya}
              <RecalcPermissionsButton user={user} />
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-xs-12">
              <DataScopes dataScopes={user.dataScopes} />
            </div>
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


class DataScopes extends React.Component {

  constructor(props){
    super(props);
  }

  render() {

    var scopes = Object.keys(this.props.dataScopes).map(function (name, index) {
      return <ScopePermissions key={index} name={name} permissions={this.props.dataScopes[name]} />
    }.bind(this));

    return (
      <div>
        {scopes}
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
