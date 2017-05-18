const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.state = {grants: []};
  }

  getConsoleGrants() {
    return $.ajax({
      type: 'GET',
      url: '/admin/applications/console/grants',
      success: function(data, status){
        this.setState({grants: data});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  createGrant(user) {
    var grant = {
      user: user,
      scope: []
    };

    return $.ajax({
      type: 'POST',
      url: '/admin/applications/console/grants',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant),
      success: function(data, status){
        var grants = this.state.grants;
        grants.push(grant);
        this.setState({grants: grants});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  updateGrant(grant, index) {
    return $.ajax({
      type: 'POST',
      url: '/admin/applications/console/grants/'.concat(grant.id),
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant),
      success: function(data, status){
        // Updating the UI
        if (index) {
          var grants = this.state.grants;
          grants[index] = grant;
          this.setState({grants: grants});
        }
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  deleteGrant(grant, index) {
    return $.ajax({
      type: 'DELETE',
      url: '/admin/applications/console/grants/'.concat(grant.id),
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant),
      success: function(data, status){
        // Updating the UI
        if (index) {
          var grants = this.state.grants;
          grants.splice(index,1);
          this.setState({grants: grants});
        }
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  makeSuperAdmin(grant, index) {
    return $.ajax({
      type: 'POST',
      url: '/admin/users/'.concat(grant.user, '/superadmin'),
      success: function(data, status){
        // Updating the UI
        if (index) {
          var grants = this.state.grants;
          grants[index].scope.push('admin:*');
          this.setState({grants: grants});
        }
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  demoteSuperAdmin(grant, index) {
    return $.ajax({
      type: 'DELETE',
      url: '/admin/users/'.concat(grant.user, '/superadmin'),
      success: function(data, status){
        console.log('makeSuperAdmin', data);
        // Updating the UI
        if (index) {
          var grants = this.state.grants;
          grants[index].scope.splice(grant.scope.indexOf('admin:*'), 1);
          this.setState({grants: grants});
        }
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  componentDidMount() {
    this.getConsoleGrants();
  }

  render() {

    var grants = this.state.grants.map(function(grant, index) {
      var isSuperAdmin = grant.scope.indexOf('admin:*') > -1;
      return (
        <tr key={index}>
          <td className="col-xs-2">{grant.user}</td>
          <td className="col-xs-2"></td>
          <td className="col-xs-8">
            <ul className="list-unstyled">
              { isSuperAdmin
                ? <li>
                    <button type="button" className="btn btn-default btn-sm" onClick={this.demoteSuperAdmin.bind(this, grant, index)}>Demote Superadmin</button>
                  </li>
                : <li>
                    <button type="button" className="btn btn-warning btn-sm" onClick={this.makeSuperAdmin.bind(this, grant, index)}>Promote to Superadmin</button>
                    &nbsp;
                    <button type="button" className="btn btn-danger btn-sm" onClick={this.deleteGrant.bind(this, grant, index)}>Remove admin</button>
                  </li>
              }
            </ul>
          </td>
        </tr>
      );
    }.bind(this));

    return (
      <div className="users">
        <h3>Console users</h3>
        <AddAdminUser addAdminUser={this.createGrant.bind(this)} />
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-2">User ID</th>
              <th className="col-xs-2"></th>
              <th className="col-xs-8"></th>
            </tr>
            {grants}
          </tbody>
        </table>
      </div>
    );
  }
}

class AddAdminUser extends React.Component {

  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {user: ''};
  }

  onChange(e) {
    var temp = {};
    temp[e.target.name] = e.target.value;
    this.setState(temp);
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.user !== '') {
      this.props.addAdminUser(this.state.user).done(function() {
        this.setState({user: ''});
      }.bind(this));
    }
  }

  render() {
    return (
      <form style={{paddingTop: '30px', paddingBottom: '30px'}} onSubmit={this.handleSubmit} className="form-inline">
        <input
          type="text"
          name="user"
          className='form-control'
          placeholder="User ID"
          value={this.state.user}
          onChange={this.onChange} />
        <button type="submit" className="btn btn-default">Add user</button>
      </form>
    );
  }
}
