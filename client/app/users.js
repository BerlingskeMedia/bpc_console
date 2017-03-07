var $ = require('jquery');
var React = require('react');

module.exports = React.createClass({
  getInitialState: function() {
    return {
      users: []
    };
  },
  getUsers: function() {
    return $.ajax({
      type: 'GET',
      url: '/admin/users',
      contentType: "application/json; charset=utf-8",
      success: function(data, status){
        this.setState({users: data});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  },
  componentDidMount: function() {
    this.getUsers();
  },
  render: function() {

    var users = this.state.users.map(function(user, index) {
      var permissions = Object.keys(user.Permissions).map(function (name, index) {
        return <PermissionScope key={index} scopeName={name} permissions={user.Permissions[name]} />
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
      <div className="users">
        <h3>Users</h3>
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-2">ID</th>
              <th className="col-xs-2">Email</th>
              <th className="col-xs-2">Provider</th>
              <th className="col-xs-6">Permissions</th>
            </tr>
            {users}
          </tbody>
        </table>
      </div>
    );
  }
});


var PermissionScope = React.createClass({
  render: function() {
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
});
