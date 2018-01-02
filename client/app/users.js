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
    this.onChange = this.onChange.bind(this);
    this.searchUsersByEmail = this.searchUsersByEmail.bind(this);
    this.state = {
      searching: false,
      searchTimer: null
    };
  }

  onChange(e) {
    // // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    if (this.searchBox.value.length > 0) {
      this.setState({searchTimer: setTimeout(this.searchUsersByEmail, 1000)});
    }
  }

  searchUsersByEmail() {
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
        <div className="col-xs-12">
          <input
            type="text"
            name="searchBox"
            onChange={this.onChange}
            className="form-control"
            placeholder="Type email or ID to start search"
            readOnly={this.state.searching}
            ref={(searchBox) => this.searchBox = searchBox} />
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

    return (
      <div style={{marginTop: '30px', marginBottom: '30px'}}>
        { this.props.users.length === 1 ?
          <div>
          <div className="row">
            <div className="col-xs-12">
            <span>
              <dt>ID</dt>
              <dd>{this.props.users[0].id}</dd>
            </span>
              <span>
                <dt>Email</dt>
                <dd>{this.props.users[0].email}</dd>
              </span>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-xs-12">
              <DataScopes dataScopes={this.props.users[0].dataScopes} />
            </div>
          </div>
          </div>
        : null }
      </div>
    );
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
