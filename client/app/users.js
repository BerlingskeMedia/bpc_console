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
      <div className="users">
        <h3>Users</h3>
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

  searchUsersByEmail(provider, email) {
    if(this.state.searching){
      return false;
    }

    let searchText = encodeURIComponent(this.searchBox.value);

    return $.ajax({
      type: 'GET',
      url: `/admin/users?provider=${this.provider.value}&email=${searchText}&id=${searchText}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.props.setUsers(data);
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    }).always(() => {
      this.setState({searching: false})
    });
  }

  render() {
    return (
      <div className="row">
        <div className="col-xs-2">
          <select
            className="form-control"
            ref={(provider) => this.provider = provider}
            onChange={this.onChange}>
              <option value="gigya">Gigya</option>
              <option value="google">Google</option>
          </select>
        </div>
        <div className="col-xs-10">
          <input
            type="text"
            name="searchBox"
            onChange={this.onChange}
            className="form-control"
            placeholder="Søg via email eller ID"
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
    var userRows = this.props.users.map(function(user, index) {
      var permissions = Object.keys(user.dataScopes).map(function (name, index) {
        return <PermissionScope key={index} scopeName={name} permissions={user.dataScopes[name]} />
      });

      return (
        <tr key={index}>
          <td className="col-xs-2">{user.id}</td>
          <td className="col-xs-2">{user.email}</td>
          <td className="col-xs-2"><span className="label label-info">{user.provider}</span></td>
          <td className="col-xs-8">
            {permissions}
          </td>
        </tr>
      );
    });

    return (
      <table className="table" style={{marginTop: '30px', marginBottom: '30px'}}>
        <tbody>
          <tr>
            <th className="col-xs-2">ID</th>
            <th className="col-xs-2">Email</th>
            <th className="col-xs-2">Provider</th>
            <th className="col-xs-6">Permissions</th>
          </tr>
          {userRows}
        </tbody>
      </table>
    );
  }
}


class PermissionScope extends React.Component {
  render() {
    var permissions = this.props.permissions instanceof Array
      ? this.props.permissions.map(function(permission, index) {
          return (
            <span>
              <dt>{index}</dt>
              <dd>{permission}</dd>
            </span>
          );
        })
      : Object.keys(this.props.permissions).map(function (name, index) {
          if (typeof this.props.permissions[name] === 'object') {
            return Object.keys(this.props.permissions[name]).map(function (key, index2){
              return (
                <span key={index + index2}>
                  <dt>{name}.{key}</dt>
                  <dd>{this.props.permissions[name][key].toString()}</dd>
                </span>
              );
            }.bind(this));
          } else {
            return (
              <span key={index}>
                <dt>{name}</dt>
                <dd>{this.props.permissions[name].toString()}</dd>
              </span>
            );
          }
      }.bind(this));

    return (
      <div>
        <div>Scope: <strong>{this.props.scopeName}</strong></div>
        <dl className="dl-horizontal">
          {permissions}
        </dl>
      </div>
    );
  }
}
