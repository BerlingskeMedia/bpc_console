
const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');

module.exports = class extends React.Component {
  constructor(props){
    super(props);
    this.createUser_ = this.createUser_.bind(this);
    this.createUser = this.createUser.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.onChangeAddUser = this.onChangeAddUser.bind(this);
    this.state = {
      hasInput: false,
      inputValid: false,
      searchUserInProgress: false,
      searchUserTimer: null,
      foundUser: null
    };
  }


  createUser_(email) {
    if(email.length === 0) {
      return Promise.reject();
    }

    return Bpc.request('/gigya/register', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
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
    const value = this.addUserInput.value;
    if(value.length > 0) {
      // Setting the inputValid flag now, because there is one second delay
      //  before se start searching for users in BPC
      this.setState({ hasInput: true, inputValid: false }, () => {

        clearTimeout(this.state.searchUserTimer);

        this.setState({ searchUserInProgress: true, searchUserTimer: setTimeout(() => {
          this.searchUser(value)
          .then(foundUser => this.setState({ inputValid: foundUser !== null, foundUser, searchUserInProgress: false }));
        }, 1000)});

      });
    } else {
      this.setState({ hasInput: false, inputValid: false });
    }
  }


  createUser() {
    const value = this.addUserInput.value;
    if(value.length > 0) {
      return this.setState({ creatingUser: true }, () => {
        return this.props.createUser(value)
        .then((response) => {

          this.setState({
            creatingUser: false,
            inputValid: true,
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
  }


  addUser() {
    const foundUser = this.state.foundUser;
    if(foundUser) {
      this.setState({ addingUser: true }, () => {
        console.log('this.props')
        console.log(this.props)
        this.props.addUser(foundUser);
          this.addUserInput.value = '';
          this.setState({
            addingUser: false,
            inputValid: false, // Setting inputValid to false to disable the button
            hasInput: false
          });
      });
    }
  }


  render() {

    // In case of undefined
    const users = this.props.users || [];

    let items = users.map((user) => <User key={user.uid} user={user} removeUser={this.props.removeUser} searchUser={this.searchUser} />)

    const inputClassName = this.state.hasInput && !this.state.inputValid ? 'form-group has-error' : 'form-group';

    // The "inputValid" means the user was already found.
    const createButtonDisabled = this.state.creatingUser || !this.state.hasInput || this.state.inputValid || this.state.searchUserInProgress;
    const addButtonDisabled = !this.state.inputValid || this.state.addingUser || this.state.searchUserInProgress;

    items.push(
      <tr key={-1}>
        <td>
          {/* <div className="form-group has-feedback"> */}
          <div className={inputClassName}>
            <input
              type="text"
              name="addUserInput"
              className="form-control input-sm"
              onChange={this.onChangeAddUser}
              ref={(addUserInput) => this.addUserInput = addUserInput} />
          </div>
        </td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-default' onClick={this.createUser} disabled={createButtonDisabled} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-cloud-upload' aria-hidden="true"></span> <span>Create</span>
          </button>
          <span>&nbsp;</span>
          <button type="button" className='btn btn-xs btn-success' onClick={this.addUser} disabled={addButtonDisabled} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
          </button>
        </td>
      </tr>
    );

    return (
      <div style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="row">
          <div className="col-xs-2" style={{ textAlign: 'right' }}>
            <strong>{ this.props.label }</strong>
            <div><em><small>{this.props.note}</small></em></div>
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
    this.state = {
      foundUser: null,
      addedByUser: null
    };
  }


  getUserDetails() {
    this.props.searchUser(this.props.user.uid)
    .then((foundUser) => {
      if(foundUser) {
        this.setState({ foundUser });
      } else {
        // Waiting on the Gigya webhook
        setTimeout(() => this.getUserDetails(), 3000);
      }
    });
  }


  getAddedByDetails() {
    if(this.props.user.addedBy && this.props.user.addedBy.user) {
      Bpc.request(`/users/${ encodeURIComponent(this.props.user.addedBy.user) }`)
      .then(addedByUser => this.setState({ addedByUser }));
    }
  }


  componentDidUpdate(prevProps) {
    const fieldIsHereNow = this.props.user.addedBy && this.props.user.addedBy.user;
    const fieldWasHereBefore = prevProps.user.addedBy && prevProps.user.addedBy.user;

    if(fieldIsHereNow !== undefined && fieldWasHereBefore !== undefined && fieldIsHereNow !== fieldWasHereBefore) {
      this.getAddedByDetails();
    }
  }
  
  
  componentDidMount() {
    this.getUserDetails(this.props.user.uid);
    this.getAddedByDetails();    
  }

  render() {

    let item = <span>{ this.props.user.uid }</span>
    const foundUser = this.state.foundUser;

    if(foundUser) {
      item = <Link to={`/users?search=${ foundUser.id }`}>{ foundUser.email }</Link>
    }

    return (
      <tr key={this.props.user.uid}>
        <td>
          <div style={{ marginTop: '3px', marginBottom: '3px' }}>
            { item }
            <div><em><small>Added: {this.props.user.addedAt || ''}</small></em></div>
            <div><em><small>Added by: {(this.state.addedByUser ? this.state.addedByUser.email : null ) || (this.props.user.addedBy ? this.props.user.addedBy.user : '')}</small></em></div>
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
