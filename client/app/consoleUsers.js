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
      url: '/admin/applications/console/grants'
    }).done(data => {
      this.setState({grants: data});
    }).fail((jqXHR) => {
      console.error(jqXHR.responseText);
    });
  }

  createGrant(user) {
    var grant = {
      user: user,
      scope: [],
      exp: null
    };

    return $.ajax({
      type: 'POST',
      url: '/admin/applications/console/grants',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      this.setState((prevState) => {
        grants: prevState.grants.push(data);
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  deleteGrant(grant, index) {
    return $.ajax({
      type: 'DELETE',
      url: '/admin/applications/console/grants/'.concat(grant.id),
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      if(data.n > 0 && index){
        this.setState((prevState) => {
          grants: prevState.grants.splice(index, 1);
        });
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  makeSuperAdmin(grant, index) {
    return $.ajax({
      type: 'POST',
      url: '/admin/superadmin/'.concat(grant.id)
    }).done((data, textStatus, jqXHR) => {
      if (index > -1) {
        var grants = this.state.grants;
        grants[index].scope.push('admin:*');
        this.setState({grants: grants});
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  demoteSuperAdmin(grant, index) {
    return $.ajax({
      type: 'DELETE',
      url: '/admin/superadmin/'.concat(grant.id)
    }).done((data, textStatus, jqXHR) => {
      if (index > -1) {
        var grants = this.state.grants;
        grants[index].scope.splice(grant.scope.indexOf('admin:*'), 1);
        this.setState({grants: grants});
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }


  componentDidMount() {
    this.getConsoleGrants();
  }


  render() {

    var grants = this.state.grants.map((grant, index) => {
      var isSuperAdmin = grant.scope.indexOf('admin:*') > -1;

      var isAdminOfApp = grant.scope.filter(function(scope){
        console.log('sco', scope);
        return scope !== 'admin:*' && scope.indexOf('admin:') === 0;
      }).map(function(scope, index) {
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
          <th className="col-xs-5">
            {isAdminOfApp}
          </th>
          <td className="col-xs-2">
            { isSuperAdmin
              ? <button type="button" className="btn btn-danger btn-sm btn-block" disabled="disabled">Is superadmin</button>
              : <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.deleteGrant.bind(this, grant, index)}>Remove admin</button>
            }
          </td>
          <td className="col-xs-2">
            { isSuperAdmin
              ? <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.demoteSuperAdmin.bind(this, grant, index)}>Demote Superadmin</button>
              : <button type="button" className="btn btn-info btn-sm btn-block" onClick={this.makeSuperAdmin.bind(this, grant, index)}>Promote to Superadmin</button>
            }
          </td>
        </tr>
      );
    });

    return (
      <div className="users">
        <h3>Console users</h3>
        <AddConsoleUser createGrant={this.createGrant.bind(this)} />
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-3">User</th>
              <th className="col-xs-5">Admin of app</th>
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


class AddConsoleUser extends React.Component {

  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      inputValue: ''
    };
  }

  onChange(e) {
    this.setState({inputValue: e.target.value});
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.createGrant(this.state.inputValue)
    .done(() => {
      this.setState({inputValue: ''});
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      console.log('jqXHR', jqXHR);
      if (jqXHR.status === 409) {
        alert('User already admin');
        this.setState({inputValue: ''});
      } else {
        console.error(jqXHR.responseText);
      }
    });
  }

  render() {
    var inputClasses = 'form-group '.concat(this.state.searchSuccess ? 'has-success' : '');
    return (
      <form style={{paddingTop: '30px', paddingBottom: '30px'}} onSubmit={this.handleSubmit} className="form-inline">
        <div className={inputClasses}>
          <input
            type="text"
            className='form-control'
            placeholder="Username"
            value={this.state.inputValue}
            onChange={this.onChange} />
        </div>
        <button type="submit" className="btn btn-default">Add user</button>
      </form>
    );
  }
}
