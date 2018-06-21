const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.getGrants = this.getGrants.bind(this);
    this.createGrant = this.createGrant.bind(this);
    this.deleteGrant = this.deleteGrant.bind(this);
    this.expireGrant = this.expireGrant.bind(this);
    this.reactivateGrant = this.reactivateGrant.bind(this);
    this.pagesizelimit = 30;
    this.state = {
      grantscount: 0,
      grants: []
    };
  }

  getGrantsCount() {
    return $.ajax({
      type: 'GET',
      url: `/_b/applications/${this.props.app}/grantscount`,
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
    let query;
    if (options && options.skip) {
      query = `limit=${this.pagesizelimit}&skip=${options.skip}`;
    } else {
      query = `limit=${this.pagesizelimit}&skip=0`;
    }

    return $.ajax({
      type: 'GET',
      url: `/_b/applications/${this.props.app}/grants?${query}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({
        grants: data
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  createGrant(user) {
    const newGrant = {
      user: user._id,
      scope: []
    };

    return $.ajax({
      type: 'POST',
      url: `/_b/applications/${this.props.app}/grants`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(newGrant)
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
      type: 'DELETE',
      url: `/_b/applications/${this.props.app}/grants/${grant.id}`
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

    return $.ajax({
      type: 'POST',
      url: `/_b/applications/${this.props.app}/grants/${grant.id}`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      const index = this.state.grants.findIndex(e => {
        return e.id === grant.id;
      });
      // TODO: I don't remember if this one is a findOneAndUpdate in MongoDB
      this.setState((prevState) => {
        grants: prevState.grants[index] = grant;
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  reactivateGrant(grant) {

    grant.exp = null;

    return $.ajax({
      type: 'POST',
      url: `/_b/applications/${this.props.app}/grants/${grant.id}`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant)
    }).done((data, textStatus, jqXHR) => {
      const index = this.state.grants.findIndex(e => {
        return e.id === grant.id;
      });
      this.setState((prevState) => {
        grants: prevState.grants[index] = grant;
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }
  
  componentDidMount() {
    this.getGrantsCount();
    this.getGrants();
  }
  
  render() {
    
    return (
      <div className="grants">
        <h3>Users</h3>
        <div>Total user count: {this.state.grantscount}</div>
        <UserSearch
          app={this.props.app}
          provider={this.props.provider}
          createGrant={this.createGrant}
          deleteGrant={this.deleteGrant}
          expireGrant={this.expireGrant}
          reactivateGrant={this.reactivateGrant} />
        <GrantsList
          app={this.props.app}
          grants={this.state.grants}
          deleteGrant={this.deleteGrant}
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
    this.state = {
      user: {},
      searchInProgress: false,
      searchTimer: null,
      searchSuccess: false,
      userHasGrant: false,
      grant: {}
    };
  }

  onSearchChange(e) {
    // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    this.setState({
      searchTimer: setTimeout(this.searchUser, 1000),
      searchSuccess: false
    });
  }


  searchUser() {
    if(this.state.searchInProgress){
      return false;
    }

    this.setState({
      userHasGrant: false,
      grant: {}
    });

    const searchText = encodeURIComponent(this.searchBox.value.trim());

    if (searchText.length === 0) {
      return false;
    }

    this.setState({searchInProgress: true});

    return $.ajax({
      type: 'GET',
      url: `/_b/users?provider=${this.props.provider}&id=${searchText}&email=${searchText}`
    }).done((data, textStatus, jqXHR) => {
      if (data.length === 1){

        $.ajax({
          type: 'GET',
          url: `/_b/applications/${this.props.app}/grants?user=${data[0]._id}`
        })
        .done((data, textStatus, jqXHR) => {
          if (data.length === 1){
            this.setState({
              userHasGrant: true,
              grant: data[0]
            });
          }
        });

        this.setState({
          searchSuccess: true,
          user: data[0]
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
    if (this.state.user !== {}) {
      this.props.createGrant(this.state.user)
      .done((data, textStatus, jqXHR) => {
        this.searchBox.value = '';
        this.setState({user: {}});
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.log('jqXHR', jqXHR);
        if (jqXHR.status === 409) {
          alert('User already have access');
          this.searchBox.value = '';
          this.setState({user: {}});
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
    const grant = this.state.grant;

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
              readOnly={this.state.searchInProgress}
              ref={(searchBox) => this.searchBox = searchBox} />
          </div>
        </form>
        <div className="row">
          <div className="col-xs-6">
            <button type="button" className="btn btn-default"
              onClick={this.handleSubmit}
              disabled={!this.state.searchSuccess || this.state.userHasGrant}>Create grant</button>
          </div>
          <div className="col-xs-2">
            {grant.exp || grant.exp === null
              ? <span>Expires: {grant.exp !== null ? grant.exp : 'Never'}</span>
              : null
            }
          </div>
          <div className="col-xs-2">
            {grant.exp && grant.exp < Date.now()
              ? <button type="button" className="btn btn-primary btn-sm btn-block"
                  onClick={this.props.reactivateGrant.bind(this, grant)}
                  disabled={!this.state.searchSuccess || !this.state.userHasGrant}>Reactivate grant</button>
              : <button type="button" className="btn btn-warning btn-sm btn-block"
                  onClick={this.props.expireGrant.bind(this, grant)}
                  disabled={!this.state.searchSuccess || !this.state.userHasGrant}>Expire grant</button>
            }
          </div>
          <div className="col-xs-2">
            <button type="button" className="btn btn-danger btn-sm btn-block"
              onClick={this.props.deleteGrant.bind(this, grant)}
              disabled={!this.state.searchSuccess || !this.state.userHasGrant}>Delete grant</button>
          </div>
        </div>
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


class GrantsList extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    const grants = this.props.grants.map(function(grant) {
      return (
        <tr key={grant.id}>
          <td className="col-xs-6">
            <ApplicationUser grant={grant} />
          </td>
          <td className="col-xs-2">
            {grant.exp
              ? <span>{grant.exp}</span>
              : <span>Never</span>
            }
          </td>
          <td className="col-xs-2">
            {grant.exp && grant.exp < Date.now()
             ? <button type="button" className="btn btn-primary btn-sm btn-block" onClick={this.props.reactivateGrant.bind(this, grant)}>Reactivate grant</button>
             : <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.props.expireGrant.bind(this, grant)}>Expire grant</button>
            }
          </td>
          <td className="col-xs-2">
            <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.props.deleteGrant.bind(this, grant)}>Delete grant</button>
          </td>
        </tr>
      );
    }.bind(this));

    return(
      <div style={{paddingTop: '30px', paddingBottom: '30px'}}>
        <h4>All grants</h4>
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-6">User</th>
              <th className="col-xs-2">Expires</th>
              <th className="col-xs-2"></th>
              <th className="col-xs-2"></th>
            </tr>
            { grants !== null && grants.length > 0
              ? grants
              : null
            }
          </tbody>
        </table>
      </div>
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
        { this.state.user && this.state.user.email
          ? this.state.user.email
          : <span>{grant.user} <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span></span>
        }
      </div>
    );
  }
}
