const $ = require('jquery');
const React = require('react');

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
      user: user.email,
      scope: []
    };

    return $.ajax({
      type: 'POST',
      url: '/admin/applications/console/grants',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      this.setState((prevState) => {
        grants: prevState.grants.push(grant);
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
      if (index) {
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
      if (index) {
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

      return (
        <tr key={index}>
          <td className="col-xs-8">{grant.user}</td>
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
              <th className="col-xs-8">User</th>
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
      user: {},
      searchText: '',
      searchInProgress: false,
      searchTimer: null,
      searchSuccess: false,
      lastSearch: ''
    };
  }

  onChange(e) {
    var value = e.target.value;
    this.setState({searchText: value, searchSuccess: false});
    // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    this.setState({searchTimer: setTimeout(this.searchUsersByEmail, 1000)});
  }

  searchUsersByEmail() {
    if(this.state.searchInProgress){
      return false;
    }

    var searchText = this.state.searchText;

    this.setState({searchInProgress: true});

    return $.ajax({
      type: 'GET',
      url: `/admin/users?provider=google&email=${searchText}&id=${searchText}`
    }).done((data, textStatus, jqXHR) => {
      if (data.length === 1){
        this.setState({searchSuccess: true, user: data[0]});
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
    if (this.state.user !== {}) {
      this.props.createGrant(this.state.user)
      .done(() => {
        this.setState({user: {}, searchText: ''});
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.log('jqXHR', jqXHR);
        if (jqXHR.status === 409) {
          alert('User already admin');
          this.setState({user: {}, searchText: ''});
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
            placeholder="Email"
            value={this.state.searchText}
            onChange={this.onChange} />
        </div>
        <button type="submit" className="btn btn-default" disabled={!this.state.searchSuccess}>Add user</button>
      </form>
    );
  }
}
