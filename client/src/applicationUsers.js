const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
  }
  
  componentDidMount() { 
  }
  
  render() {
    
    return (
      <div className="grants">
        <h3>Users</h3>
        <GrantSearch app={this.props.app} />
        <GrantsPages app={this.props.app} limit={30} />
      </div>
    );
  }
}


class GrantSearch extends React.Component {

  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
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
      url: `/_b/users?provider=${this.props.provider}&id=${searchText}&email=${searchText}`
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
          alert('User already have access');
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
      <form style={{paddingTop: '30px', paddingBottom: '30px'}} onSubmit={this.handleSubmit}>
        <div className={inputClasses}>
          <input
            type="text"
            name="user"
            className="form-control"
            placeholder="Search for user"
            value={this.state.searchText}
            onChange={this.onChange} />
        </div>
        <button type="submit" className="btn btn-default" disabled={!this.state.searchSuccess}>Grants access</button>
        <button type="submit" className="btn btn-default" disabled={!this.state.searchSuccess}>Revoke access</button>
      </form>
    );
  }
}



class GrantsPages extends React.Component {

  constructor(props){
    super(props);
    this.deleteGrant = this.deleteGrant.bind(this);
    this.expireGrant = this.expireGrant.bind(this);
    this.reactivateGrant = this.reactivateGrant.bind(this);
    this.state = {
      grantscount: 0,
      grants: [],
      activePage: 1
    };
  }

  getGrantsCount() {
    return $.ajax({
      type: 'GET',
      url: '/_b/applications/'.concat(this.props.app, '/grantscount'),
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({grantscount: data.count});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  getGrants(skip) {
    return $.ajax({
      type: 'GET',
      url: `/_b/applications/${this.props.app}/grants?limit=${this.props.limit}&skip=${skip}`,
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({
        grants: data.grants,
        skip: data.skip
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  setActivePage(page){
    this.setState({
      activePage: page
    });

    const skip = (page * this.props.limit) - this.props.limit;
    this.getGrants(skip);
  }

  createGrant(user) {
    var grant = {
      user: user._id,
      scope: []
    };

    return $.ajax({
      type: 'POST',
      url: '/_b/applications/'.concat(this.props.app, '/grants'),
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

  deleteGrant(grant) {
    return $.ajax({
      type: 'DELETE',
      url: '/_b/applications/'.concat(this.props.app, '/grants/', grant.id)
    }).done((data, textStatus, jqXHR) => {
      const index = this.state.grants.findIndex(e => {
        return e.id === grant.id;
      });
      if(data.status === 'ok' && index){
        this.setState((prevState) => {
          grantscount: prevState.grantscount - 1;
          grants: prevState.grants.splice(index, 1);
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
      url: '/_b/applications/'.concat(this.props.app, '/grants/', grant.id),
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
      url: '/_b/applications/'.concat(this.props.app, '/grants/', grant.id),
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
    this.getGrants(0);
  }

  render() {
    const pagesCount = Math.ceil(this.state.grantscount / this.props.limit);

    let pages = [];
    for(var i = 1; i <= pagesCount; i++){
      pages.push(
        <button key={i} name={i} type="button" className="btn btn-default" onClick={this.setActivePage.bind(this, i)}>{i}</button>
      );
    }

    return (
      <div>
        <div>Total user count: {this.state.grantscount}</div>
        <GrantsPage
          app={this.props.app}
          grants={this.state.grants}
          deleteGrant={this.deleteGrant}
          expireGrant={this.expireGrant}
          reactivateGrant={this.reactivateGrant} />
        <div className="btn-group" role="group">
          {pages}
        </div>
      </div>
    );
  }
}


class GrantsPage extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    const grants = this.props.grants.map(function(grant) {
      return (
        <tr key={grant.id}>
          <td className="col-xs-8">
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
      <div>
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
              : <tr><td colSpan="4">(This app has no grants.)</td></tr>
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
