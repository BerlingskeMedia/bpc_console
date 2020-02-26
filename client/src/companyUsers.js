
const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');

module.exports = class extends React.Component {
  constructor(props){
    super(props);
    this.validateEmail = this.validateEmail.bind(this);
    this.createUser = this.createUser.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.addRemoveUser = this.addRemoveUser.bind(this);
    this.onChangeAddUser = this.onChangeAddUser.bind(this);
    this.state = {
      hasInput: false,
      inputAddUserValid: false,
      inputCreateUserValid: false,
      creatingUser: false,
      searchUserInProgress: false,
      searchUserTimer: null,
      foundUser: null
    };
  }


  searchUser(input) {
    if(input.length > 0) {
      const encoded_input = encodeURIComponent(input);
      const query = `?provider=gigya&email=${ encoded_input }&id=${ encoded_input }`;

      return Bpc.request(`/users${ query }`)
      .then(users => {
        const foundUser = users.length === 1 ? users[0] : null;
        return Promise.resolve(foundUser);
      });
    } else {
      return Promise.resolve(null);
    }
  }


  onChangeAddUser() {
    const value = this.findUserInput.value;
    if(value.length > 0) {

      const inputCreateUserValid = this.validateEmail(value);

      // Setting the inputAddUserValid flag now, because there is one second delay
      //  before se start searching for users in BPC
      this.setState({ hasInput: true, inputAddUserValid: false, inputCreateUserValid }, () => {

        clearTimeout(this.state.searchUserTimer);

        this.setState({ searchUserInProgress: true, searchUserTimer: setTimeout(() => {
          this.searchUser(value)
          .then(foundUser => this.setState({ inputAddUserValid: foundUser !== null, foundUser, searchUserInProgress: false }));
        }, 1000)});

      });
    } else {
      this.setState({ hasInput: false, inputAddUserValid: false, inputCreateUserValid: false });
    }
  }


  validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }


  createUser() {
    const value = this.findUserInput.value;

    if(!this.validateEmail(value)) {
      return Promise.reject();
    }

    return this.setState({ creatingUser: true }, () => {
      return Bpc.request('/gigya/register', {
        method: 'POST',
        body: JSON.stringify({ email: value })
      })
      .then((response) => {

        this.setState({
          creatingUser: false,
          inputAddUserValid: true,
          hasInput: true,
          foundUser: {
            id: response.UID,
            email: response.profile.email || value
          }
        });
      })
      .catch((err) => {
        this.setState({ creatingUser: false });
      });
    });
  }


  addUser() {
    return this.addRemoveUser(this.props.addUser);
  }


  removeUser() {
    return this.addRemoveUser(this.props.removeUser);
  }


  addRemoveUser(addRemoveFunc) {
    const foundUser = this.state.foundUser;
    if(foundUser) {
      this.setState({ addingUser: true }, () => {
        addRemoveFunc(foundUser)
        .then(() => {
          this.findUserInput.value = '';
          this.setState({
            addingUser: false,
            inputAddUserValid: false, // Setting inputAddUserValid to false to disable the button
            inputCreateUserValid: false,
            hasInput: false,
            foundUser: null
          });
        });
      });
    }
  }


  render() {

    // In case of undefined
    let users = this.props.users || [];

    let foundUserIsAlreadyAdded = false;
    if(this.state.foundUser && users.length > 0) {
      // const foundUserIsAlreadyAdded = users.find((user) => user.uid === this.state.foundUser.id);
      foundUserIsAlreadyAdded = users.some((user) => user.uid === this.state.foundUser.id);
    }

    const originalUserCount = users.length;
    const maxUsersToShow = 100;
    const showTruncatedUserList = originalUserCount > maxUsersToShow;

    // Using "slice" to get a copy so the original array is not changed, as it will cause issues when re-rendering.
    users = showTruncatedUserList ? users.slice(0, maxUsersToShow) : users;

    // Using the props.removeUser instead of this.removeUser, since this component does not need to clear the input field
    let items = users.map((user) => <User key={user.uid} user={user} removeUser={this.props.removeUser} searchUser={this.searchUser} />)

    if(showTruncatedUserList) {
      items.push(
        <tr key={-20}>
          <td>
            <div>Showing {maxUsersToShow} out of {originalUserCount} users. <small>Use input below to find and remove a user.</small></div>
            <div></div>
            </td>
          <td></td>
        </tr>
      );
    }

    const inputClassName = this.state.hasInput && !this.state.inputAddUserValid ? 'form-group has-error' : 'form-group';

    // The "inputAddUserValid" means the user was already found.
    const createButtonDisabled = !this.state.inputCreateUserValid || this.state.creatingUser || this.state.inputAddUserValid || this.state.searchUserInProgress;
    const addButtonDisabled = !this.state.inputAddUserValid || this.state.addingUser || this.state.searchUserInProgress;

    items.push(
      <tr key={-1}>
        <td>
          {/* <div className="form-group has-feedback"> */}
          <div className={inputClassName}>
            <input
              type="text"
              name="findUserInput"
              className="form-control input-sm"
              onChange={this.onChangeAddUser}
              ref={(findUserInput) => this.findUserInput = findUserInput} />
          </div>
        </td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-default' onClick={this.createUser} disabled={createButtonDisabled} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-cloud-upload' aria-hidden="true"></span> <span>Create</span>
          </button>
          <span>&nbsp;</span>
          { foundUserIsAlreadyAdded
            ? <button type="button" className='btn btn-xs btn-danger' onClick={this.removeUser.bind(this, this.state.foundUser)} style={{ minWidth: '90px' }}>
                <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
              </button>
            : <button type="button" className='btn btn-xs btn-success' onClick={this.addUser} disabled={addButtonDisabled} style={{ minWidth: '90px' }}>
                <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
              </button>
          }
        </td>
      </tr>
    );

    return (
      <div style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="row">
          <div className="col-xs-2" style={{ textAlign: 'right' }}>
            <strong>{ this.props.label }</strong>
            <div><em><small>{this.props.note}</small></em></div>
            <p></p>
            <p>User count {users.length}</p>
          </div>
          <div className="col-xs-10">
            <table className="table table-condensed">
              <tbody>
                { items }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}


class User extends React.Component {
  constructor(props){
    super(props);
    this.getAddedByDetails = this.getAddedByDetails.bind(this);
    this.showAddedByDetails = this.showAddedByDetails.bind(this);
    this.state = {
      foundUser: null,
      addedByUser: null,
      showAddedByDetails: false
    };
  }


  getUserDetails() {
    return Bpc.request(`/users?provider=gigya&id=${ encodeURIComponent(this.props.user.uid) }`)
    .then((users) => {
      const foundUser = users.length === 1 ? users[0] : null;
      if(foundUser) {
        this.setState({ foundUser });
      } else {
        // Waiting on the Gigya webhook
        setTimeout(() => this.getUserDetails(), 3000);
      }
    });
  }


  showAddedByDetails() {
    this.getAddedByDetails()
    .then(() => this.setState({ showAddedByDetails: true }))
  }


  getAddedByDetails() {
    if(this.props.user.addedBy && this.props.user.addedBy.user) {
      return Bpc.request(`/users/${ encodeURIComponent(this.props.user.addedBy.user) }`)
      .then(addedByUser => this.setState({ addedByUser }));
    } else {
      return Promise.resolve();
    }
  }


  componentDidMount() {
    this.getUserDetails(this.props.user.uid);
  }


  render() {

    let item = <span>{ this.props.user.uid }</span>
    const foundUser = this.state.foundUser;

    if(foundUser) {
      item = <Link to={`/users?search=${ foundUser.id }`}>{ foundUser.email }</Link>
    }

    let addedByDetails = '';
    if(this.state.addedByUser) {
      addedByDetails = this.state.addedByUser.email;
    } else if(this.props.user.addedBy) {
      addedByDetails = this.props.user.addedBy.user || this.props.user.addedBy.system;
    } 

    return (
      <tr key={this.props.user.uid}>
        <td>
          <div style={{ marginTop: '3px', marginBottom: '3px' }}>
            { item }
            { this.state.showAddedByDetails
              ? <div>
                  <div><em><small>Added: {this.props.user.addedAt || ''}</small></em></div>
                  <div><em><small>Added by: { addedByDetails }</small></em></div>
                </div>
              : <button type="button" className="btn btn-sm btn-link" style={{marginLeft: '10px', padding: '0px'}} onClick={this.showAddedByDetails}>Details</button>
            }
          </div>
        </td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeUser.bind(this, this.props.user)} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
          </button>
        </td>
      </tr>
    );
  }
}
