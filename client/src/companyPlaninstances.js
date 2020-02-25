const React = require('react');
const Link = require('react-router-dom').Link;
const Bpp = require('./components/bpp');
const Bpc = require('./components/bpc');


module.exports = class extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      planinstances: []
    }
  }


  componentDidMount() {
    if(this.props.ariaAccountNo) {
      Bpp.request(`/api/planinstances?ariaAccountNo=${ this.props.ariaAccountNo }`)
      .then(planinstances => this.setState({ planinstances }));
    }
  }


  render() {

    const planinstances = this.state.planinstances.map(planinstance => {
      return (
        <Planinstance
          key={planinstance._id}
          id={planinstance._id} />
      );
    });

    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Plan instances</strong>
          <div><em><small></small></em></div>
        </div>
        <div className="col-xs-10">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Subscription No</th>
                <th>Plan name</th>
                <th>Note</th>
                <th>Units</th>
                <th>Users</th>
              </tr>
            </thead>
            <tbody>
              { planinstances }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}


class Planinstance extends React.Component {
  constructor(props){
    super(props);
    this.savePlaninstance = this.savePlaninstance.bind(this);
    this.updatePlaninstanceState = this.updatePlaninstanceState.bind(this);
    this.validateEmailmask = this.validateEmailmask.bind(this);
    this.addEmailmask = this.addEmailmask.bind(this);
    this.removeEmailmask = this.removeEmailmask.bind(this);
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.state = {
      planinstance: null
    };
  }


  validateEmailmask(value) {
    // var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // return regex.test(String(value).toLowerCase());
    const atIndex = value.indexOf('@');
    const dotIndex = value.indexOf('.');
    const valid = value.length > 0 &&     // There is a value
      atIndex > -1 &&                     // There is an @
      (atIndex + 1) < dotIndex &&         // There is a domain
      value.length - dotIndex > 1;        // There is a top-level domain
    return Promise.resolve(valid);
  }


  addEmailmask(value) {
    let newPlaninstance = Object.assign({}, this.state.planinstance);
    newPlaninstance.emailMasks = newPlaninstance.emailMasks || [];
    newPlaninstance.emailMasks.push(value);
    return this.updatePlaninstanceState(newPlaninstance);
  }


  removeEmailmask(item) {
    let newPlaninstance = Object.assign({}, this.state.planinstance);
    const index = newPlaninstance.emailMasks.findIndex(i => i === item);
    newPlaninstance.emailMasks.splice(index, 1);
    return this.updatePlaninstanceState(newPlaninstance);
  }


  updatePlaninstanceState(planinstance) {
    return new Promise((resolve) => {
      return this.setState({ planinstance }, resolve);
    });
  }


  addUser(foundUser) {
    return this.updateUser({ add: { uid: foundUser.id } });
  }

  
  removeUser(user) {
    return this.updateUser({ remove: { uid: user.uid } });
  }


  updateUser(payload) {
    const id = this.props.id;
    return Bpp.request(`/api/planinstances/${ id }/users`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then((planinstance) => this.setState({ planinstance }));
  }


  savePlaninstance(planinstance) {
    const id = this.props.id;
    return Bpp.request(`/api/planinstances/${ id }`, {
      method: 'PUT',
      body: JSON.stringify(planinstance)
    })
    .catch((err) => {
      alert('Error when saving!');
    });
  }
  

  componentDidMount() {
    if(this.props.id) {
      Bpp.request(`/api/planinstances/${ this.props.id }`)
      .then(planinstance => this.setState({ planinstance }));
    }
  }


  render() {

    if(!this.state.planinstance) {
      return null;
    }

    const planinstance = this.state.planinstance;

    return (
      <tr>
        <td>{planinstance.instanceNo}</td>
        <td>{planinstance.planName}</td>
        <td><Note planinstance={planinstance} savePlaninstance={this.savePlaninstance} /></td>
        <td>{planinstance.units}</td>
        <td>
          <PlaninstancesUsers removeUser={this.removeUser} users={planinstance.users} />
          <AddPlaninstancesUser addUser={this.addUser} />
        </td>
      </tr>
    );
  }
}


class Note extends React.Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.saveNote = this.saveNote.bind(this);
    this.state = {
      note: '',
      saveTimer: null,
      saveInProgress: false
    };
  }
  
  handleChange(e) {
    clearTimeout(this.state.saveTimer);
    const note = e.target.value;
    this.setState({ note });
    this.setState({saveTimer: setTimeout(this.saveNote, 2500)});
  }

  onBlur(e) {
    clearTimeout(this.state.saveTimer);
    this.saveNote();
  }
  
  saveNote() {
    if(this.state.saveInProgress){
      return false;
    }

    const planinstance = this.props.planinstance;
    planinstance.note = this.state.note;
    this.setState({ saveInProgress: true }, () => {
      this.props.savePlaninstance(planinstance)
      .finally(() => {
        this.setState({ saveInProgress: false })
      })
    });
  }

  render() {

    const planinstance = this.props.planinstance;

    return (
      <textarea
        className="form-control"
        defaultValue={planinstance.note}
        rows="4"
        disabled={this.state.saveInProgress}
        onChange={this.handleChange}
        onBlur={this.onBlur}></textarea>
    );
  }
}


class PlaninstancesUsers extends React.Component {
  constructor(props){
    super(props);
  }


  render() {
    if(!this.props.users || !this.props.users instanceof Array) {
      return null;
    }

    const _users = this.props.users || [];
    const users = _users.map((user) => {
      return <PlaninstancesUser key={user.uid} user={user} removeUser={this.props.removeUser.bind(this, user)} />;
    });
    return (
      <table className="table table-striped">
        <tbody>
          {users}
        </tbody>
      </table>
    );
  }
}


class PlaninstancesUser extends React.Component {
  constructor(props){
    super(props);
    this.getUserDetails = this.getUserDetails.bind(this);
    this.state = {
      foundUser: null
    };
  }


  getUserDetails() {
    const user = this.props.user;
    if(user && user.uid) {
      const query = `?provider=gigya&id=${ encodeURIComponent(user.uid) }`;
    
      return Bpc.request(`/users${ query }`)
      .then(users => {
        const foundUser = users.length === 1 ? users[0] : null;
        this.setState({ foundUser,});
      });
    }
  }


  componentDidMount() {
    this.getUserDetails();
  }


  render() {
    const user = this.state.foundUser || this.props.user;

    return (
      <tr>
        <td>
          <Link to={`/users?search=${ user.id || user.uid }`}>{user.email || user.id || user.uid}</Link>
        </td>
        <td>
          <div style={{textAlign: 'right'}}>
            <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeUser} style={{ minWidth: '30px' }}>
              <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
            </button>
          </div>
        </td>
      </tr>
    );
  }
}


class AddPlaninstancesUser extends React.Component {
  constructor(props){
    super(props);
    this.searchUser = this.searchUser.bind(this);
    this.onChangeAddUser = this.onChangeAddUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.state = {
      searchUserTimer: null,
      userSearchCompleted: false,
      foundUser: null
    };
  }


  searchUser() {
    const input = this.addUserInput.value;
    if(input.length > 0) {
      const encoded_input = encodeURIComponent(input);
      const query = `?provider=gigya&email=${ encoded_input }&id=${ encoded_input }`;

      return Bpc.request(`/users${ query }`)
      .then(users => {
        const foundUser = users.length === 1 ? users[0] : null;
        this.setState({ foundUser, userSearchCompleted: true });
      });
    }
  }


  onChangeAddUser() {
    this.setState({ foundUser: null, userSearchCompleted: false });
    clearTimeout(this.state.searchUserTimer);
    this.setState({searchUserTimer: setTimeout(this.searchUser, 1000)});
  }

  
  addUser() {
    const foundUser = this.state.foundUser;
    if(foundUser) {
      this.setState({ addingUser: true }, () => {
        this.props.addUser(foundUser);
          this.addUserInput.value = '';
          this.setState({
            addingUser: false,
            userSearchCompleted: false,
            foundUser: null
          });
      });
    }
  }


  componentDidMount() {
  }


  render() {

    let userSearchFeedback = null;
    let userSearchBoxClass = 'form-group has-feedback';
    if(this.state.userSearchCompleted) {
      if (this.state.foundUser) {
        userSearchFeedback = <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>;
        userSearchBoxClass += ' has-success'
      } else {
        userSearchFeedback = <span className="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>;
        userSearchBoxClass += ' has-error'
      }
    }

    const addButtonDisabled = !this.state.userSearchCompleted || this.state.addingUser || !this.state.foundUser;

    return (
      <div className={ userSearchBoxClass } style={{marginTop: '5px'}}>
        <input
          type="text"
          name="addUserInput"
          className="form-control input-sm"
          onChange={this.onChangeAddUser}
          ref={(addUserInput) => this.addUserInput = addUserInput} />
          { userSearchFeedback }
          <div style={{ textAlign: 'right', marginTop: '3px' }}>
            <button type="button" className='btn btn-xs btn-success' onClick={this.addUser} disabled={addButtonDisabled} style={{ minWidth: '90px' }}>
              <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
            </button>
          </div>
      </div>
    );
  }
}