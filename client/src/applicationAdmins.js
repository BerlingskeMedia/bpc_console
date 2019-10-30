const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.makeAdmin = this.makeAdmin.bind(this);
    this.removeAdmin = this.removeAdmin.bind(this);
    this.state = {
      adminGrants: [],
      searchText: '',
      searchInProgress: false,
      searchTimer: null,
      searchSuccess: false,
      foundUser: {}
    };
  }

  getApplicationAdminUsers() {
    return $.ajax({
      type: 'GET',
      url: `/api/admins?app=${this.props.app}`
    }).done((data, textStatus, jqXHR) => {
      this.setState({adminGrants: data});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  onChange(e) {
    const value = e.target.value;
    this.setState({
      searchText: value,
      searchSuccess: false
    });
    // We're clearing the old timer
    clearTimeout(this.state.searchTimer);
    this.setState({searchTimer: setTimeout(this.searchUser, 1000)});
  }

  searchUser() {
    if(this.state.searchInProgress){
      return false;
    }

    var searchText = this.state.searchText;

    if (searchText.length === 0) {
      return false;
    }

    this.setState({searchInProgress: true});

    return $.ajax({
      type: 'GET',
      url: `/api/users?provider=google&id=${searchText}&email=${searchText}`
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

  removeAdmin(grant) {

    const payload = {
      app: this.props.app,
      user: grant.user
    };

    return $.ajax({
      type: 'PATCH',
      url: `/api/admins`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(payload)
    })
    .done((data, textStatus, jqXHR) => {
      const index = this.state.adminGrants.findIndex(e => {
        return e.id === grant.id;
      });
      this.setState((prevState) => {
        adminGrants: prevState.adminGrants.splice(index, 1);
      });
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR);
      if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
        alert(jqXHR.responseJSON.message);
      }
    });
  }

  makeAdmin(e) {
    e.preventDefault();

    const payload = {
      app: this.props.app,
      user: this.state.foundUser._id
    };

    return $.ajax({
      type: 'POST',
      url: `/api/admins`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(payload)
    })
    .done((data, textStatus, jqXHR) => {
      this.setState((prevState) => {
        adminGrants: prevState.adminGrants.push(data);
      });
      this.setState({
        searchText: '',
        searchSuccess: false
      });
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR);
    });
  }

  componentDidMount() {
    this.getApplicationAdminUsers();
  }

  render() {

    var adminUsers = this.state.adminGrants.map((grant, index) => {
      return <ApplicationAdmin
        key={grant.id}
        grant={grant}
        removeAdmin={this.removeAdmin} />
    });

    return (
      <div>
        <h3>Admins</h3>
        <div>
          Admins are not regular users, but users of this BPC Console and can access this page and change settings.
          Removing an admin user removes the users access to this page on BPC Console - not their entire access to BPC Console.<br/>
        </div>
        <div>Also, superadmins will always have access.</div>
        <form style={{paddingTop: '30px', paddingBottom: '30px'}}>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Type email or ID to start search"
              value={this.state.searchText}
              onChange={this.onChange} />
          </div>
          <button type="submit" className="btn btn-default" onClick={this.makeAdmin} disabled={!this.state.searchSuccess}>Make admin</button>
          <span className="savedSuccessMessage" style={{color: '#008000', verticalAlign: 'middle', marginLeft: '10px', display: 'none'}}>Saved successully</span>
        </form>
        <ul className="list-unstyled">
          {adminUsers}
        </ul>
        {adminUsers === null || adminUsers.length === 0
          ? <div>This app has no admin users.</div>
          : null
        }
      </div>
    );
  }
}


class ApplicationAdmin extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      foundUser: null
    };
  }
  
  getUser(grant) {
    return $.ajax({
      type: 'GET',
      url: `/api/users/${grant.user}`
    }).done((data, textStatus, jqXHR) => {
      this.setState({
        foundUser: data
      });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({
        foundUser: null
      });
    });
  }

  componentDidMount() {
    this.getUser(this.props.grant);
  }

  render(){
    const grant = this.props.grant;

    return (
      <li key={grant.id} style={{marginBottom: '2px'}}>
        <button type="button" className="btn btn-danger btn-xs" onClick={this.props.removeAdmin.bind(this, grant)}>Remove admin</button>
        &nbsp;
        { this.state.foundUser !== null
          ? this.state.foundUser.email
          : grant.user
        }
      </li>
    );
  }
}
