const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getGrants = this.getGrants.bind(this);
    this.activateGrant = this.activateGrant.bind(this);
    this.expireGrant = this.expireGrant.bind(this);
    this.updateGrant = this.updateGrant.bind(this);
    this.deleteGrant = this.deleteGrant.bind(this);
    this.makeSuperAdmin = this.makeSuperAdmin.bind(this);
    this.demoteSuperAdmin = this.demoteSuperAdmin.bind(this);
    this.pagesizelimit = 50;
    this.state = {
      grantscount: 0,
      grants: []
    };
  }


  getGrantsCount() {
    return $.ajax({
      type: 'GET',
      url: `/_b/grants/count?app=console`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({
        grantscount: data.count
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }


  getGrants({ limit = this.pagesizelimit, skip = 0 }) {
    return $.ajax({
      type: 'GET',
      url: `/_b/grants?app=console&limit=${ limit }&skip=${ skip }`
    }).done(data => {
      this.setState({ grants: data });
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
        let temp = prevState.grants.slice();
        temp.splice(0, 0, data);
        return {
          grantscount: prevState.grantscount + 1,
          grants: temp
        };
      });
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
      const index = this.state.grants.findIndex(e => {
        return e.id === grant.id;
      });
      if(data.status === 'ok' && index > -1) {
        this.setState((prevState) => {
          let temp = prevState.grants.slice();
          temp.splice(index, 1);
          return {
            grantscount: prevState.grantscount - 1,
            grants: temp
          };
        });
      }
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
      const index = this.state.grants.findIndex(e => {
        return e.id === grant.id;
      });
      if (index > -1) {
        this.setState((prevState) => {
          return prevState.grants[index] = data;
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
      const index = this.state.grants.findIndex(e => {
        return e.id === grant.id;
      });
      if (index > -1) {
        this.setState((prevState) => {
          return prevState.grants[index] = data;
        });
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
      const index = this.state.grants.findIndex(e => {
        return e.id === grant.id;
      });
      if (index > -1) {
        this.setState((prevState) => {
          return prevState.grants[index] = data;
        });
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }


  componentDidMount() {
    this.getGrantsCount();
    this.getGrants({});
  }


  render() {
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
        <UserSearch
          createGrant={this.createGrant.bind(this)}
          makeSuperAdmin={this.makeSuperAdmin}
          demoteSuperAdmin={this.demoteSuperAdmin}
          activateGrant={this.activateGrant}
          deleteGrant={this.deleteGrant}
          expireGrant={this.expireGrant} />
        <GrantsList
          grants={this.state.grants}
          makeSuperAdmin={this.makeSuperAdmin}
          demoteSuperAdmin={this.demoteSuperAdmin}
          activateGrant={this.activateGrant}
          deleteGrant={this.deleteGrant}
          expireGrant={this.expireGrant} />
        <GrantsPagination
          grantscount={this.state.grantscount}
          getGrants={this.getGrants}
          pagesizelimit={this.pagesizelimit} />
      </div>
    );
  }
}



class GrantsList extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return(
      <div style={{paddingTop: '30px', paddingBottom: '30px'}}>
        <h4>All console users</h4>
        <GrantsTable
          scope={this.props.scope}
          grants={this.props.grants}
          makeSuperAdmin={this.props.makeSuperAdmin}
          demoteSuperAdmin={this.props.demoteSuperAdmin}
          deleteGrant={this.props.deleteGrant}
          updateGrant={this.props.updateGrant}
          expireGrant={this.props.expireGrant}
          activateGrant={this.props.activateGrant} />
      </div>
    );
  }
}


class GrantsPagination extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      activePage: 1
    };
  }


  setActivePage(page){
    this.setState({
      activePage: page
    });

    const skip = (page * this.props.pagesizelimit) - this.props.pagesizelimit;
    this.props.getGrants({ skip });
  }

  componentDidMount() {
  }

  render() {
    const pagesCount = Math.ceil(this.props.grantscount / this.props.pagesizelimit);

    if(pagesCount < 2) {
      return(null);
    }

    let pages = [];
    for(var i = 1; i <= pagesCount; i++){
      pages.push(
        <button key={i} name={i} type="button" className="btn btn-default" onClick={this.setActivePage.bind(this, i)}>{i}</button>
      );
    }

    return (
      <div className="btn-group" role="group">
        {pages}
      </div>
    );
  }
}


class GrantsTable extends React.Component {
  constructor(props){
    super(props);
  }
  

  render() {
    var grants = this.props.grants.map((grant, index) => {
      return <Grant
        key={grant.id}
        grant={grant}
        makeSuperAdmin={this.props.makeSuperAdmin}
        demoteSuperAdmin={this.props.demoteSuperAdmin}
        activateGrant={this.props.activateGrant}
        deleteGrant={this.props.deleteGrant}
        expireGrant={this.props.expireGrant} />
    });

    return (
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


class UserSearch extends React.Component {

  constructor(props){
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.state = {
      user: {},
      grant: {},
      searchInProgress: false,
      searchTimer: null,
      searchSuccess: false,
      userFound: false,
      userNotFound: false,
      userHasGrant: false,
      userAndGrantCanBeCreated: false
    };
  }


  onSearchChange(e) {
    // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    this.setState({
      searchTimer: setTimeout(this.searchUser, 1000),
      userFound: false,
      userNotFound: false
    });
  }

  searchUser() {
    if(this.state.searchInProgress){
      return false;
    }

    const searchText = encodeURIComponent(this.searchBox.value.trim());

    if (searchText.length === 0) {
      return false;
    }

    this.setState({searchInProgress: true});

    return $.ajax({
      type: 'GET',
      url: `/_b/users?provider=google&id=${searchText}&email=${searchText}`
    }).done((data, textStatus, jqXHR) => {

      if (data.length === 1){

        const user = data[0];

        this.setState({
          userFound: true,
          user: user
        });


        // Checking existing grants
        // We are setting state in this response so the UI doesn't flicker
        $.ajax({
          type: 'GET',
          url: `/_b/grants?app=console&user=${user._id}`
        })
        .done((data, textStatus, jqXHR) => {

          this.setState({
            userHasGrant: data.length === 1,
            grant: data.length === 1 ? data[0] : null
          });
        });
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({
        userFound: false,
        userNotFound: false
      });
    }).always(() => {
      this.setState({searchInProgress: false});
    });
  }


  render() {
    var inputClasses = 'form-group '.concat(this.state.userFound ? 'has-success' : '');

    return (
      <div style={{paddingTop: '30px', paddingBottom: '30px'}}>
        <h4>Search user</h4>
        <form>
          <div className={inputClasses}>
            <input
              type="text"
              name="searchBox"
              onChange={this.onSearchChange}
              className='form-control'
              placeholder="Search for user"
              ref={(searchBox) => this.searchBox = searchBox} />
          </div>
        </form>
        <div className="row">
          <div className="col-xs-12">
          { this.state.userFound && this.state.userHasGrant
            ? <GrantsTable
                grants={[this.state.grant]}
                makeSuperAdmin={this.props.makeSuperAdmin}
                demoteSuperAdmin={this.props.demoteSuperAdmin}
                activateGrant={this.props.activateGrant}
                deleteGrant={this.props.deleteGrant}
                expireGrant={this.props.expireGrant} />
            : null
          }
          {/* { this.state.userFound && !this.state.userHasGrant
            ? <button type="button" className="btn btn-default" onClick={this.createGrant}>Create grant</button>
            : null
          }
          { this.state.userNotFound && this.state.userAndGrantCanBeCreated
            ? <button type="button" className="btn btn-default" onClick={this.createUserAndGrant}>Create user and grant</button>
            : null
          }
          { this.state.userNotFound && !this.state.userAndGrantCanBeCreated
            ? <div>User not found</div>
            : null
          } */}
          </div>
        </div>
      </div>
    );
  }
}
