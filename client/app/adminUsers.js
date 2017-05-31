const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getUsersInformation = this.getUsersInformation.bind(this);
    this.getUserInformation = this.getUserInformation.bind(this);
    this.state = {
      users: [],
      grants: []
    };
  }

  getConsoleGrants() {
    return $.ajax({
      type: 'GET',
      url: '/admin/applications/console/grants'
    }).done(data => {
      this.setState({grants: data});
    }).fail((jqXHR) => {
      console.error(jqXHR.responseText);
    });
  }

  getUsersInformation(grants) {
    grants.forEach(grant => this.getUserInformation(grant.user).then(data => {
      this.setState((prevState) => {
        users: prevState.users[data.id] = data
      });
    }));
  }

  getUserInformation(id) {
    return $.ajax({ type: 'GET', url: '/admin/users/'.concat(id) });
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
    this.getConsoleGrants().then((data) => {
      this.getUsersInformation(data);
    });
  }

  render() {

    var grants = this.state.grants.map((grant, index) => {
      var isSuperAdmin = grant.scope.indexOf('admin:*') > -1;
      var user = this.state.users[grant.user];

      if (!user) {
        return;
      }

      return (
        <tr key={index}>
          <td className="col-xs-2">{grant.user}</td>
          <td className="col-xs-6">{user.email}</td>
          <td className="col-xs-2">
            { isSuperAdmin
              ? null
              : <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.deleteGrant.bind(this, grant, index)}>Remove admin</button>
            }
          </td>
          <td className="col-xs-2">
            { isSuperAdmin
              ? <button type="button" className="btn btn-default btn-sm btn-block" onClick={this.demoteSuperAdmin.bind(this, grant, index)}>Demote Superadmin</button>
              : <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.makeSuperAdmin.bind(this, grant, index)}>Promote to Superadmin</button>
            }
          </td>
        </tr>
      );
    });

    return (
      <div className="users">
        <h3>Console users</h3>
        <AddAdminUser createGrant={this.createGrant.bind(this)} />
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-2">ID</th>
              <th className="col-xs-6">Email</th>
              <th className="col-xs-2"></th>
              <th className="col-xs-2"></th>
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
    this.searchUsersByEmail = this.searchUsersByEmail.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      user: '',
      searchText: '',
      searching: false,
      searchTimer: null,
      searchSuccess: false,
      lastSearch: ''
    };
  }

  onChange(e) {
    var value = e.target.value;
    this.setState({user: value, searchText: value});
    // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    this.setState({searchTimer: setTimeout(this.searchUsersByEmail, 1000)});
  }

  searchUsersByEmail() {
    if(this.state.searching){
      return false;
    }

    var searchText = this.state.searchText;

    this.setState({searching: true});

    return $.ajax({
      type: 'GET',
      url: '/admin/users?provider=google&email='.concat(searchText)
    }).done((data, textStatus, jqXHR) => {
      if (data.length === 1){
        this.setState({searchSuccess: true, user: data[0].id});
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({searchSuccess: false})
    }).always(() => {
      this.setState({searching: false})
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.user !== '') {
      this.props.createGrant(this.state.user)
      .done(() => {
        this.setState({user: '', searchText: ''});
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.log('jqXHR', jqXHR);
        if (jqXHR.status === 409) {
          alert('User already admin');
          this.setState({user: '', searchText: ''});
        } else {
          console.error(jqXHR.responseText);
        }
      }).always(() => {
        this.setState({searchSuccess: false});
      });
    }
  }

  render() {
    var inputClasses = 'form-group '.concat(this.state.searchSuccess ? 'has-success' : '');
    return (
      <form style={{paddingTop: '30px', paddingBottom: '30px'}} onSubmit={this.handleSubmit} className="form-inline">
        <div className={inputClasses}>
          <input
            type="text"
            className='form-control'
            placeholder="Email / User ID"
            value={this.state.searchText}
            onChange={this.onChange} />
        </div>
        <button type="submit" className="btn btn-default">Add user</button>
      </form>
    );
  }
}
