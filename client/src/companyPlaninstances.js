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

    if(this.state.planinstances.length === 0) {
      return null;
    }

    const planinstances = this.state.planinstances
    // Only show planinstances with status -1 or higher
    .filter(planinstance => planinstance.status > -2)
    .map(planinstance => {
      return (
        <Planinstance
          key={planinstance._id}
          id={planinstance._id}
          accessrules={this.props.accessrules}/>
      );
    });

    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Plan instances</strong>
          <div><em><small>Only showing status -1 or higher</small></em></div>
        </div>
        <div className="col-xs-10">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Subscription No</th>
                <th>Plan</th>
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
    this.addEmailmask = this.addEmailmask.bind(this);
    this.removeEmailmask = this.removeEmailmask.bind(this);
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.state = {
      planinstance: null
    };
  }


  addEmailmask(value) {
    let newPlaninstance = Object.assign({}, this.state.planinstance);
    newPlaninstance.emailMasks = newPlaninstance.emailMasks || [];
    newPlaninstance.emailMasks.push(value);
    return this.updatePlaninstanceState(newPlaninstance).then(() => (this.savePlaninstance(this.state.planinstance)));
  }


  removeEmailmask(item) {
    let newPlaninstance = Object.assign({}, this.state.planinstance);
    const index = newPlaninstance.emailMasks.findIndex(i => i === item);
    newPlaninstance.emailMasks.splice(index, 1);
    return this.updatePlaninstanceState(newPlaninstance).then(() => (this.savePlaninstance(this.state.planinstance)));
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

    let alerts = [];

    if(!planinstance.titleDomain) {
      alerts.push(<span key={-1} className='glyphicon glyphicon-warning-sign' title="Missing titleDomain" aria-hidden="true"></span>);
    }

    if(!planinstance.services instanceof Array) {
      alerts.push(<span key={-1} className='glyphicon glyphicon-warning-sign' title="No services" aria-hidden="true"></span>);
    }

    const accessRules = this.props.accessrules || [];
    if(planinstance.services instanceof Array) {
      const everyServiceIsInvalid = planinstance.services.every((service) => {
        let isAValidService = false;

        // If the planinstance does not have titleDomain, there's already one warning-sign for this. (See above.)
        // In this case we only need to show an additional warning-sign, if there no generel valid services on the planinstance.
        if(planinstance.titleDomain) {
          isAValidService = accessRules.some(accessRule => accessRule.titleDomain === planinstance.titleDomain && accessRule.accessFeature === service.accessFeature)
        } else {
          isAValidService = accessRules.some(accessRule => accessRule.accessFeature === service.accessFeature)
        }

        // Not a valid service
        return !isAValidService;
      });

      if(everyServiceIsInvalid) {
        alerts.push(<span key={-1} className='glyphicon glyphicon-warning-sign' title="No valid services" aria-hidden="true"></span>);
      }
    }


    return (
      <tr>
        <td>{planinstance.instanceNo}</td>
        <td>
          <div>{planinstance.planName}</div>
          <div>{ alerts }</div>
          <div>Activation date: { planinstance.activationDate }</div>
          <div>Termination date: { planinstance.terminationDate || '' }</div>
        </td>
        <td>
          <Note planinstance={planinstance} savePlaninstance={this.savePlaninstance} />
          <PlaninstancesMasks addEmailmask={this.addEmailmask} removeEmailmask={this.removeEmailmask} masks={planinstance.emailMasks} />
        </td>
        <td>{planinstance.users && planinstance.users.length || '0'}/{planinstance.units}</td>
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

class PlaninstancesMasks extends React.Component {
  constructor(props){
    super(props);
    this.validateEmailmask = this.validateEmailmask.bind(this);
    this.addEmailmask = this.addEmailmask.bind(this);
    this.onChangeAddMask = this.onChangeAddMask.bind(this);
    this.state = {
      validMask: null,
      userInput: false,
      maskTimer: null
    };
  }

  onChangeAddMask() {
    this.setState({ userInput: true });

    clearTimeout(this.state.maskTimer);
    this.setState({maskTimer: setTimeout(this.validateEmailmask(this.addMaskInput.value), 2000)});
  }

  validateEmailmask(value) {
    const atIndex = value.indexOf('@');
    const dotIndex = value.indexOf('.');
    const valid = value.length > 0 &&     // There is a value
      atIndex > -1 &&                     // There is an @
      (atIndex + 1) < dotIndex &&         // There is a domain
      value.length - dotIndex > 1;        // There is a top-level domain
    this.setState({validMask: valid});
    return valid;
  }

  addEmailmask() {
    const input = this.addMaskInput.value;
    if(this.validateEmailmask(input)) {
      this.props.addEmailmask(input).then(() => {
        this.addMaskInput.value = '';
        this.setState({ userInput: false });
      });
    }
  }


  render() {
    let userSearchFeedback = null;
    let userSearchBoxClass = 'form-group has-feedback';
    if(this.state.userInput) {
      if (this.state.validMask) {
        userSearchFeedback = <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>;
        userSearchBoxClass += ' has-success'
      } else {
        userSearchFeedback = <span className="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>;
        userSearchBoxClass += ' has-error'
      }
    }
    const _masks = this.props.masks || [];
    const masks = _masks.map((mask) => {
      return (
        <tr>
          <td>
            {mask}
          </td>
          <td>
            <div style={{textAlign: 'right'}}>
              <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeEmailmask} style={{ minWidth: '30px' }}>
                <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
              </button>
            </div>
          </td>
        </tr>
      );
    });
    return (
      <table className="table table-striped" style={{marginTop: '25px'}}>
        <div><strong>Email Masks</strong></div>
        <tbody>
        {masks}
        <tr>
          <div className={ userSearchBoxClass } style={{marginTop: '5px'}}>
            <input
              type="text"
              name="addMaskInput"
              onChange={this.onChangeAddMask}
              className="form-control input-sm"
              ref={(addMaskInput) => this.addMaskInput = addMaskInput}
            />
            { userSearchFeedback }
            <div style={{ textAlign: 'right', marginTop: '3px' }}>
              <button type="button" className='btn btn-xs btn-success' onClick={this.addEmailmask} style={{ minWidth: '90px' }}>
                <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
              </button>
            </div>
          </div>
        </tr>
        </tbody>
      </table>
    );
  }
}
