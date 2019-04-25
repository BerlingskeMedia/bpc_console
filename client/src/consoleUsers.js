const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.activateGrant = this.activateGrant.bind(this);
    this.expireGrant = this.expireGrant.bind(this);
    this.updateGrant = this.updateGrant.bind(this);
    this.deleteGrant = this.deleteGrant.bind(this);
    this.makeSuperAdmin = this.makeSuperAdmin.bind(this);
    this.demoteSuperAdmin = this.demoteSuperAdmin.bind(this);
    this.state = {
      consoleGrants: []
    };
  }

  getConsoleGrants() {
    return $.ajax({
      type: 'GET',
      url: '/_b/grants?app=console'
    }).done(data => {
      this.setState({consoleGrants: data});
    }).fail((jqXHR) => {
      console.error(jqXHR.responseText);
    });
  }

  createGrant(user) {
    const grant = {
      app: 'console',
      user: user._id,
      scope: [],
      exp: null
    };

    return $.ajax({
      type: 'POST',
      url: '/_b/grants',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      this.setState((prevState) => {
        return prevState.consoleGrants.push(data);
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  activateGrant(grant) {
    grant.exp = null;
    this.updateGrant(grant);
  }

  expireGrant(grant) {
    grant.exp = Date.now();
    this.updateGrant(grant);
  }

  updateGrant(grant) {
    return $.ajax({
      type: 'POST',
      url: `/_b/grants`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      const index = this.state.consoleGrants.findIndex(e => {
        return e.id === grant.id;
      });
      if (index > -1) {
        this.setState((prevState) => {
          return prevState.consoleGrants[index] = grant;
        });
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  deleteGrant(grant) {
    return $.ajax({
      type: 'PATCH',
      url: '/_b/grants',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      const index = this.state.consoleGrants.findIndex(e => {
        return e.id === grant.id;
      });
      if (index > -1) {
        this.setState((prevState) => {
          return prevState.consoleGrants.splice(index, 1);
        });
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  makeSuperAdmin(grant) {
    return $.ajax({
      type: 'POST',
      url: '/_b/superadmins',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      const index = this.state.consoleGrants.findIndex(e => {
        return e.id === grant.id;
      });
      if (index > -1) {
        var grants = this.state.consoleGrants;
        grants[index] = data;
        this.setState({consoleGrants: grants});
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  demoteSuperAdmin(grant) {
    return $.ajax({
      type: 'PATCH',
      url: '/_b/superadmins',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      const index = this.state.consoleGrants.findIndex(e => {
        return e.id === grant.id;
      });
      if (index > -1) {
        var grants = this.state.consoleGrants;
        grants[index] = data;
        this.setState({consoleGrants: grants});
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }


  componentDidMount() {
    this.getConsoleGrants();
  }


  render() {

    var grants = this.state.consoleGrants.map((grant, index) => {
      return <Grant
        key={grant.id}
        grant={grant}
        makeSuperAdmin={this.makeSuperAdmin}
        demoteSuperAdmin={this.demoteSuperAdmin}
        activateGrant={this.activateGrant}
        deleteGrant={this.deleteGrant}
        expireGrant={this.expireGrant} />
    });

    return (
      <div className="consoleUsers" style={{paddingTop: '30px'}}>
        {/* <div>
          <p>
            Console users aka. admin users, are able access this webpage, search for permissions,
            see the list of existing applications and create/register a new application.
          </p>
          <p>
            Superadmins are able to view and edit the details of all registered applications.
          </p>
        </div> */}
        <AddConsoleUser createGrant={this.createGrant.bind(this)} />
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-3">User</th>
              <th className="col-xs-3">Admin of app</th>
              <th className="col-xs-2"></th>
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

class Grant extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      foundUser: null
    };
  }

  searchUser(grant) {
    return $.ajax({
      type: 'GET',
      url: `/_b/users?provider=google&id=${grant.user}`
    }).done((data, textStatus, jqXHR) => {
      if (data.length === 1) {
        this.setState({
          foundUser: data[0]
        });
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({
        foundUser: null
      });
    });
  }

  componentDidMount() {
    this.searchUser(this.props.grant);
  }

  render() {
    const grant = this.props.grant;

    const isSuperAdmin = grant.scope.indexOf('admin:*') > -1;

    const isExpired = grant.exp !== null && grant.exp < Date.now();

    const adminOfApps = grant.scope
    .filter(function(scope){
      // We only want to show admin:-scopes - but not the superadmin (admin:*)
      return scope.indexOf('admin:') === 0 && scope !== 'admin:*';
    })
    .map(function(scope, index) {
      var app = scope.substring('admin:'.length);
      return (
        <div key={index + '.' + app}>
          <Link style={{color:'#595959', fontWeight: '400'}} to={`/application/${app}`}>{app}</Link>
        </div>
      );
    });

    return (
      <tr key={grant.id}>
        <td className="col-xs-3">
          { this.state.foundUser !== null
            ? <Link to={`/users?search=${this.state.foundUser.id}`}>{this.state.foundUser.email}</Link>
            : grant.user
          }
        </td> 
        <td className="col-xs-3">
          {adminOfApps}
        </td>
        <td className="col-xs-2">
          { isExpired
            ? null
            : isSuperAdmin
              ? <button type="button" disabled={isExpired} className="btn btn-info btn-sm btn-block" onClick={this.props.demoteSuperAdmin.bind(this, grant)}>Demote Superadmin</button>
              : <button type="button" disabled={isExpired} className="btn btn-default btn-sm btn-block" onClick={this.props.makeSuperAdmin.bind(this, grant)}>Promote to Superadmin</button>
          }
        </td>
        <td className="col-xs-2">
          { isExpired
            ? <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.props.deleteGrant.bind(this, grant)}>Delete access</button>
            : null
          }
        </td>
        <td className="col-xs-2">
          { isExpired
            ? <button type="button" className="btn btn-primary btn-sm btn-block" onClick={this.props.activateGrant.bind(this, grant)}>Reactivate access</button>
            : <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.props.expireGrant.bind(this, grant)}>Expire access</button>
          }
        </td>
      </tr>
    );
  }
}


class AddConsoleUser extends React.Component {

  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      searchText: '',
      searchInProgress: false,
      searchTimer: null,
      searchSuccess: false,
      foundUser: {},
      lastSearch: ''
    };
  }

  onChange(e) {
    const value = e.target.value;
    this.setState({
      searchText: value,
      searchSuccess: false
    });
    // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    this.setState({searchTimer: setTimeout(this.searchUsers, 1000)});
  }

  searchUsers() {
    if(this.state.searchInProgress){
      return false;
    }

    const searchText = this.state.searchText;

    if (searchText.length === 0) {
      return false;
    }

    this.setState({searchInProgress: true});

    return $.ajax({
      type: 'GET',
      url: `/_b/users?provider=google&id=${searchText}&email=${searchText}`
    }).done((data, textStatus, jqXHR) => {
      if (data.length === 1){
        this.setState({
          searchSuccess: true,
          foundUser: data[0]
        });
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({searchSuccess: false})
    }).always(() => {
      this.setState({searchInProgress: false})
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.createGrant(this.state.foundUser)
    .done(() => {
      this.setState({
        searchText: '',
        searchSuccess: false
      });
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      if (jqXHR.status === 409) {
        alert('User already admin');
        this.setState({
          searchText: '',
          searchSuccess: false
        });
      } else {
        console.error(jqXHR.responseText);
      }
    });
  }

  render() {
    var inputClasses = 'form-group '.concat(this.state.searchSuccess ? 'has-success' : '');
    return (
      <form style={{paddingBottom: '30px'}} onSubmit={this.handleSubmit}>
        <div className={inputClasses}>
          <input
            type="text"
            className='form-control'
            placeholder="Search for user"
            value={this.state.searchText}
            onChange={this.onChange} />
        </div>
        <button type="submit" className="btn btn-default" disabled={!this.state.searchSuccess}>Grant access</button>
      </form>
    );
  }
}
