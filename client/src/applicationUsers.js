const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      validScopes: [],
      grants: []
    };
  }

  getGrants() {
    return $.ajax({
      type: 'GET',
      // url: '/_b/grants',
      url: '/_b/applications/'.concat(this.props.app, '/grants'),
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      this.setState({grants: data});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
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
      if(data.n > 0 && index){
        this.setState((prevState) => {
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
      // TODO: I don't remember is this one is a findOneAndUpdate in MongoDB
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
    this.getGrants();
  }

  render() {

    var grants = this.state.grants.map(function(grant) {
      return (
        <tr key={grant.id}>
          <td className="col-xs-8">{grant.user}</td>
          <td className="col-xs-2">
            {grant.exp
              ? <span>{grant.exp}</span>
              : <span>Never</span>
            }
          </td>
          <td className="col-xs-2">
            {grant.exp && grant.exp < Date.now()
             ? <button type="button" className="btn btn-primary btn-sm btn-block" onClick={this.reactivateGrant.bind(this, grant)}>Reactivate grant</button>
             : <button type="button" className="btn btn-warning btn-sm btn-block" onClick={this.expireGrant.bind(this, grant)}>Expire grant</button>
            }
          </td>
          <td className="col-xs-2">
            <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.deleteGrant.bind(this, grant)}>Delete grant</button>
          </td>
        </tr>
      );
    }.bind(this));

    return (
      <div className="grants">
        <h3>Users</h3>
        <CreateGrant createGrant={this.createGrant.bind(this)} />
        <p>We cannot show all the users right now, as they might break the page.</p>
        <p>Soon you can search a user.</p>
        <p>And also revoke their access.</p>
      </div>
    );
    // <table className="table">
    // <tbody>
    // <tr>
    // <th className="col-xs-6">User</th>
    // <th className="col-xs-2">Expires</th>
    // <th className="col-xs-2"></th>
    // <th className="col-xs-2"></th>
    // </tr>
    // {grants}
    // {grants === null || grants.length === 0
    //   ? <tr><td colSpan="4">(This app has no grants.)</td></tr>
    //   : null
    // }
    // </tbody>
    // </table>
  }
}


class CreateGrant extends React.Component {

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
      url: '/_b/users?'.concat('email=', searchText)
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
        <button type="submit" className="btn btn-default" disabled={!this.state.searchSuccess}>Add user</button>
      </form>
    );
  }
}