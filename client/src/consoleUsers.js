const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      grants: []
    };
  }

  getConsoleGrants() {
    return $.ajax({
      type: 'GET',
      url: '/_b/applications/console/grants'
    }).done(data => {
      this.setState({grants: data});
    }).fail((jqXHR) => {
      console.error(jqXHR.responseText);
      if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
        alert(jqXHR.responseJSON.message);
      }
    });
  }

  createGrant(user) {
    const grant = {
      user: user._id,
      scope: [],
      exp: null
    };

    return $.ajax({
      type: 'POST',
      url: '/_b/applications/console/grants',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      this.setState((prevState) => {
        grants: prevState.grants.push(data);
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
        alert(jqXHR.responseJSON.message);
      }
    });
  }

  deleteGrant(grant, index) {
    return $.ajax({
      type: 'DELETE',
      url: '/_b/applications/console/grants/'.concat(grant.id),
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState((prevState) => {
        grants: prevState.grants.splice(index, 1);
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
        alert(jqXHR.responseJSON.message);
      }
    });
  }

  makeSuperAdmin(grant, index) {
    return $.ajax({
      type: 'POST',
      url: '/_b/superadmin/'.concat(grant.id)
    }).done((data, textStatus, jqXHR) => {
      if (index > -1) {
        var grants = this.state.grants;
        grants[index].scope.push('admin:*');
        this.setState({grants: grants});
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
        alert(jqXHR.responseJSON.message);
      }
    });
  }

  demoteSuperAdmin(grant, index) {
    return $.ajax({
      type: 'DELETE',
      url: '/_b/superadmin/'.concat(grant.id)
    }).done((data, textStatus, jqXHR) => {
      if (index > -1) {
        var grants = this.state.grants;
        grants[index].scope.splice(grant.scope.indexOf('admin:*'), 1);
        this.setState({grants: grants});
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
        alert(jqXHR.responseJSON.message);
      }
    });
  }


  componentDidMount() {
    this.getConsoleGrants();
  }


  render() {

    var grants = this.state.grants.map((grant, index) => {
      var isSuperAdmin = grant.scope.indexOf('admin:*') > -1;

      var isAdminOfApp = grant.scope
      .filter(function(scope){
        return scope !== 'admin:*' && scope.indexOf('admin:') === 0;
      })
      .map(function(scope, index) {
        var app = scope.substring('admin:'.length);
        return (
          <span key={index + '.' + app}>
            <span>&nbsp;</span>
            <span>
            </span>
            <span className="app label label-info">
              <Link style={{color:'white'}} to={`/application/${app}`}>{app}</Link>
            </span>
          </span>
        );
      });

      return (
        <tr key={index}>
          <td className="col-xs-3">{grant.user}</td>
          <td className="col-xs-2">
          { isSuperAdmin
            ? <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.demoteSuperAdmin.bind(this, grant, index)}>Demote Superadmin</button>
            : <button type="button" className="btn btn-info btn-sm btn-block" onClick={this.makeSuperAdmin.bind(this, grant, index)}>Promote to Superadmin</button>
          }
          </td>
          <th className="col-xs-5">
            {isAdminOfApp}
          </th>
          <td className="col-xs-2">
            { isSuperAdmin
              ? <button type="button" className="btn btn-danger btn-sm btn-block" disabled="disabled">Is superadmin</button>
              : <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.deleteGrant.bind(this, grant, index)}>Remove access</button>
            }
          </td>
        </tr>
      );
    });

    return (
      <div className="consoleUsers" style={{paddingTop: '30px'}}>
        <AddConsoleUser createGrant={this.createGrant.bind(this)} />
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-3">User</th>
              <th className="col-xs-2"></th>
              <th className="col-xs-5">Admin of app</th>
              <th className="col-xs-2"></th>
            </tr>
            {grants}
          </tbody>
        </table>
      </div>
    );
  }
}


class AddConsoleUser extends React.Component {

  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    // this.state = {
    //   inputValue: ''
    // };
    this.state = {
      searchText: '',
      searchInProgress: false,
      searchTimer: null,
      searchSuccess: false,
      foundUser: {},
      lastSearch: ''
    };
  }

  // onChange(e) {
  //   this.setState({inputValue: e.target.value});
  // }

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

    var searchText = this.state.searchText;

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
      console.log('jqXHR', jqXHR);
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
            readOnly={this.state.searchInProgress}
            onChange={this.onChange} />
        </div>
        <button type="submit" className="btn btn-default" disabled={!this.state.searchSuccess}>Grant access</button>
      </form>
    );
  }
}
