const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.getGrants = this.getGrants.bind(this);
    this.createGrant = this.createGrant.bind(this);
    this.updateGrant = this.updateGrant.bind(this);
    this.deleteGrant = this.deleteGrant.bind(this);
    this.expireGrant = this.expireGrant.bind(this);
    this.reactivateGrant = this.reactivateGrant.bind(this);
    this.pagesizelimit = 30;
    this.state = {
      grantscount: 0,
      grants: [],
      roles: []
    };
  }

  getGrantsCount() {
    const app = this.props.application.id;
    if(!app) {
      return;
    }

    return $.ajax({
      type: 'GET',
      url: `/_b/grants/count?app=${app}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({
        grantscount: data.count
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  getGrants(options) {
    const app = this.props.application.id;
    if(!app) {
      return;
    }

    let query;
    if (options && options.skip) {
      query = `limit=${this.pagesizelimit}&skip=${options.skip}`;
    } else {
      query = `limit=${this.pagesizelimit}&skip=0`;
    }

    return $.ajax({
      type: 'GET',
      url: `/_b/grants?app=${app}&${query}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({
        grants: data
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  createGrant(grant) {
    return $.ajax({
      type: 'POST',
      url: `/_b/grants`,
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
      url: `/_b/grants`,
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

  expireGrant(grant) {
    grant.exp = Date.now();
    return this.updateGrant(grant);
  }

  reactivateGrant(grant) {
    grant.exp = null;
    return this.updateGrant(grant);
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
      this.setState((prevState) => {
        return prevState.grants[index] = grant;
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }
  
  componentDidUpdate(prevProps) {
    if (this.props.application && this.props.application.id &&
      this.props.application.id !== prevProps.application.id) {

      this.getGrantsCount();
      this.getGrants();
    }
  }
  
  render() {

    const scope = this.props.application.scope;

    return (
      <div className="grants">
        <h3>Users</h3>
        <div>Total user count: {this.state.grantscount}</div>
        <UserSearch
          application={this.props.application}
          createGrant={this.createGrant}
          deleteGrant={this.deleteGrant}
          updateGrant={this.updateGrant}
          expireGrant={this.expireGrant}
          reactivateGrant={this.reactivateGrant} />
        <GrantsList
          scope={scope}
          grants={this.state.grants}
          deleteGrant={this.deleteGrant}
          updateGrant={this.updateGrant}
          expireGrant={this.expireGrant}
          reactivateGrant={this.reactivateGrant} />
        <GrantsPagination
          grantscount={this.state.grantscount}
          getGrants={this.getGrants}
          pagesizelimit={this.pagesizelimit} />
      </div>
    );
  }
}


class UserSearch extends React.Component {

  constructor(props){
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.createGrant = this.createGrant.bind(this);
    this.createUserAndGrant = this.createUserAndGrant.bind(this);
    this.deleteGrant = this.deleteGrant.bind(this);
    this.state = {
      user: {},
      searchInProgress: false,
      searchTimer: null,
      userFound: false,
      userNotFound: false,
      userHasGrant: false,
      userAndGrantCanBeCreated: false,
      grant: {}
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

    this.setState({
      userHasGrant: false,
      userAndGrantCanBeCreated: false,
      grant: {}
    });

    const searchText = encodeURIComponent(this.searchBox.value.trim());

    if (searchText.length === 0) {
      return false;
    }

    this.setState({searchInProgress: true});

    const application = this.props.application;
    const provider = application.settings.provider;

    return $.ajax({
      type: 'GET',
      url: `/_b/users?provider=${provider}&id=${searchText}&email=${searchText}`
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
          url: `/_b/grants?app=${application.id}&user=${user._id}`
        })
        .done((data, textStatus, jqXHR) => {

          this.setState({
            userHasGrant: data.length === 1,
            grant: data.length === 1 ? data[0] : null
          });
        });

      } else if (data.length === 0) {

        this.setState({
          userFound: false,
          userNotFound: true,
          userAndGrantCanBeCreated: provider === 'google' && searchText.indexOf(encodeURIComponent('@')) > 1,
        });

      }

    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({
        userFound: false,
        userNotFound: false
      })
    }).always(() => {
      this.setState({searchInProgress: false})
    });
  }


  createGrant() {
    if (this.state.user !== {}) {

      const newGrant = {
        app: this.props.application.id,
        user: this.state.user._id,
        scope: []
      };

      return this.props.createGrant(newGrant)
      .done((data, textStatus, jqXHR) => {
        this.setState({
          userFound: true,
          userNotFound: false,
          userHasGrant: true,
          grant: data
        });
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        this.setState({userFound: false});
        console.log('jqXHR', jqXHR);
        if (jqXHR.status === 409) {
          alert('User already have access');
          this.searchBox.value = '';
          this.setState({user: {}});
        } else {
          console.error(jqXHR.responseText);
        }
      });
    }
  }


  createUserAndGrant() {
    const payload = {
      email: this.searchBox.value.trim(),
      provider: this.props.application.settings.provider
    };

    return $.ajax({
      type: 'POST',
      url: `/_b/users`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(payload)
    }).done((data, textStatus, jqXHR) => {
      
      this.setState({
        userNotFound: false,
        userAndGrantCanBeCreated: false,
        userFound: true,
        user: data
      });

      return this.createGrant();
    });
  }


  deleteGrant(grant) {
    this.props.deleteGrant(grant);
    this.setState({user: {}});
    this.searchUser();
  }


  handleSubmit(e) {
    e.preventDefault();
    this.createGrant();
  }


  render() {
    const inputClasses = 'form-group '.concat(this.state.userFound ? 'has-success' : '');

    const application = this.props.application;

    return (
      <div style={{paddingTop: '30px', paddingBottom: '30px'}}>
        <h4>Search user</h4>
        <form onSubmit={this.handleSubmit}>
          <div className={inputClasses}>
            <input
              type="text"
              name="searchBox"
              onChange={this.onSearchChange}
              className="form-control"
              placeholder="Type email or ID to start search"
              ref={(searchBox) => this.searchBox = searchBox} />
          </div>
        </form>
        <div className="row">
          <div className="col-xs-12">
          { this.state.userFound && this.state.userHasGrant
            ? <GrantsTable
              grants={[this.state.grant]}
              scope={application.scope}
              updateGrant={this.props.updateGrant}
              expireGrant={this.props.expireGrant}
              reactivateGrant={this.props.reactivateGrant}
              deleteGrant={this.deleteGrant} />
            : null
          }
          { this.state.userFound && !this.state.userHasGrant
            ? <button type="button" className="btn btn-default" onClick={this.handleSubmit}>Create grant</button>
            : null
          }
          { this.state.userNotFound && this.state.userAndGrantCanBeCreated
            ? <button type="button" className="btn btn-default" onClick={this.createUserAndGrant}>Create user and grant</button>
            : null
          }
          { this.state.userNotFound && !this.state.userAndGrantCanBeCreated
            ? <div>User not found</div>
            : null
          }
          </div>
        </div>
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
        <h4>All grants</h4>
        <GrantsTable
          scope={this.props.scope}
          grants={this.props.grants}
          deleteGrant={this.props.deleteGrant}
          updateGrant={this.props.updateGrant}
          expireGrant={this.props.expireGrant}
          reactivateGrant={this.props.reactivateGrant} />
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
    this.props.getGrants({ skip: skip });
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

    const grants = this.props.grants.map(function(grant) {
      return (
        <Grant
          key={grant.id}
          grant={grant}
          scope={this.props.scope}
          deleteGrant={this.props.deleteGrant}
          updateGrant={this.props.updateGrant}
          expireGrant={this.props.expireGrant}
          reactivateGrant={this.props.reactivateGrant} />
      );
    }.bind(this));

    return (
      <table className="table">
        <tbody>
          <tr>
            <th className="col-xs-4">User</th>
            <th className="col-xs-2">Roles</th>
            <th className="col-xs-2">Expires</th>
            <th className="col-xs-2"></th>
            <th className="col-xs-2"></th>
          </tr>
          { this.props.grants !== null && this.props.grants.length > 0
            ? grants
            : null
          }
        </tbody>
      </table>
    );
  }
}


class Grant extends React.Component {
  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.addRoleToGrantScope = this.addRoleToGrantScope.bind(this);
    this.state = {
      value: 'N/A'
    };
  }

  onChange(e) {
    this.setState({ value: e.target.value });
  }

  addRoleToGrantScope(e) {
    const grant = this.props.grant;
    grant.scope.push(this.state.value);
    this.props.updateGrant(grant)
    .done((data, textStatus, jqXHR) => {
      this.setState({ value: 'N/A' });
    }).fail((jqXHR, textStatus, errorThrown) => {
    });
  }

  render() {

    const grant = this.props.grant;

    const grantIsExpired = grant.exp !== null && grant.exp < Date.now();

    const applicationRolePrefix = `role:${grant.app}:`;

    const applicationRoles = this.props.scope ? this.props.scope.filter(r => r.indexOf(applicationRolePrefix) === 0) : [];

    // This is the list over roles the user already have
    const userRoles = grant.scope ? grant.scope.filter(s => s.indexOf(applicationRolePrefix) === 0).filter(r => applicationRoles.indexOf(r) > -1) : [];
    const userRolesListItems = userRoles.map((role, index) => { return <li key={index}>{ role.substring(applicationRolePrefix.length) }</li> });
    const roleList = userRolesListItems.length > 0 ? <ul className="list-unstyled">{ userRolesListItems }</ul> : null;

    // This is the selector of the possible roles
    const roleOptions = applicationRoles.length > 0 ? applicationRoles
    .filter(r => userRoles.indexOf(r) === -1) // We only want to present the roles the user does not already have
    .map((role, index) => { return <option key={index} value={role}>{role.substring(applicationRolePrefix.length)}</option>; }) : [];

    const roleSelector = roleOptions.length > 0
      ? <select value={this.state.value} className="form-control input-sm" onChange={this.onChange} disabled={grantIsExpired}>
          <option key={-1} disabled value='N/A'>Select role</option>
          {roleOptions}
        </select>
      : null;

    const addRoleButton = this.state.value !== 'N/A' ? <button type="button" className="btn btn-info btn-xs" onClick={this.addRoleToGrantScope} style={{ marginTop: '2px' }}>Add role</button> : null;
    
    return (
      <tr>
        <td className="col-xs-4">
          <ApplicationUser grant={grant} />
        </td>
        <td className="col-xs-2">
          <div>{ roleList }</div>
          <div>{ roleSelector }</div>
          <div>{ addRoleButton }</div>
        </td>
        <td className="col-xs-2">
          {grant.exp
            ? <span>{grant.exp}</span>
            : <span>Never</span>
          }
        </td>
        <td className="col-xs-2">
          { grant.exp && grant.exp < Date.now()
            ? <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.props.deleteGrant.bind(this, grant)}>Delete grant</button>
            : null
          }
        </td>
        <td className="col-xs-2">
          { grant.exp && grant.exp < Date.now()
            ? <button type="button" className="btn btn-primary btn-sm btn-block" onClick={this.props.reactivateGrant.bind(this, grant)}>Reactivate grant</button>
            : <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.props.expireGrant.bind(this, grant)}>Expire grant</button>
          }
        </td>
      </tr>
    );
  }
}


class ApplicationUser extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      user: null
    };
  }
  
  getUser(grant) {
    return $.ajax({
      type: 'GET',
      url: `/_b/users/${grant.user}`
    }).done((data, textStatus, jqXHR) => {
      this.setState({
        user: data
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({
        user: null
      });
    });
  }

  componentDidMount() {
    this.getUser(this.props.grant);
  }

  render(){
    const grant = this.props.grant;
    const user = this.state.user;

    return (
      <div>
        { user && user.email
          ? <Link to={`/users?search=${user._id}`}>{user.email}</Link>
          : <span>{grant.user} <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span></span>
        }
      </div>
    );
  }
}