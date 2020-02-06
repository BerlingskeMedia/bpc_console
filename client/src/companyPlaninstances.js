const React = require('react');
const Bpp = require('./components/bpp');
const Users = require('./companyUsers');
const ArrayItems = require('./components/arrayItems');


module.exports = class extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    if(!this.props.planinstances || !(this.props.planinstances instanceof Array)) {
      return null;
    }

    const planinstances = this.props.planinstances.map(planinstance => {
      return (
        <Planinstance
          key={planinstance._id}
          planinstance={planinstance} />
      );
    });

    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Plan instances</strong>
          <div><em><small></small></em></div>
        </div>
        <div className="col-xs-10">
          { planinstances }
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
    this.addUser = this.addUser.bind(this);
    this.validateEmailmask = this.validateEmailmask.bind(this);
    this.addEmailmask = this.addEmailmask.bind(this);
    this.removeEmailmask = this.removeEmailmask.bind(this);
    this.state = {
      planinstance: null,
      usersToAdd: [],
      usersToRemove: [],
      hasAnyChanges: false
    };
  }


  addUser(foundUser) {
    const planinstance = this.props.planinstance;

    newCompany.users = newCompany.users || [];
    // const existingUsersIndex = newCompany.users.indexOf(foundUser.id);
    const existingUsersIndex = newCompany.users.findIndex((u) => u.uid === foundUser.id);
    if(existingUsersIndex === -1) {
      
      // For the visual 
      newCompany.users.push({
        uid: foundUser.id
      });

      this.setState({
        company: newCompany,
        hasAnyChanges: true
      });


      // If the user was removed but not saved
      // const removedUsersIndex = this.state.usersToRemove.indexOf(foundUser.id);
      const removedUsersIndex = this.state.usersToRemove.findIndex((u) => u.uid === foundUser.id);
      if(removedUsersIndex > -1) {
        this.setState((prevState) => {
          usersToRemove: prevState.usersToRemove.splice(removedUsersIndex, 1)
        });
      } else {
        this.setState((prevState) => {
          usersToAdd: prevState.usersToAdd.push({ uid: foundUser.id })
        });
      }
    }

    return Promise.resolve();
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
      return this.setState({
        planinstance,
        hasAnyChanges: true
      }, resolve);
    });
  }

  
  savePlaninstance() {
    const id = this.props.planinstance._id;

    const updateCompanyUsers = (payload) => {
      return Bpp.request(`/api/planinstance/${ id }/users`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    };

    const usersToAddPayloads = this.state.usersToAdd.map((user) => { return { add: user }});
    const usersToAddRequests = usersToAddPayloads.map((payload) => updateCompanyUsers(payload));
    
    const usersToRemovePayloads = this.state.usersToRemove.map((user) => { return { remove: user }});
    const usersToRemoveRequests = usersToRemovePayloads.map((payload) => updateCompanyUsers(payload));

    this.setState({ confirmSave: false });
    clearTimeout(this.state.confirmTimeout);

    Promise.all(usersToAddRequests.concat(usersToRemoveRequests))
    .then(() => {
      return Bpp.request(`/api/planinstance/${ id }`, {
        method: 'PUT',
        body: JSON.stringify(this.state.company)
      })
    })
    .then((response) => this.setState({
      company: response,
      usersToAdd: [],
      usersToRemove: [],
      hasAnyChanges: false
    }))
    .then(() => {
      this.setState({ showSaveSuccesful: true}, () => {
        setTimeout(function() {
          this.setState({ showSaveSuccesful: false });
        }.bind(this), 2000);
      });
    })
    .catch((err) => {
      alert('Error when saving!');
      this.getCompany();
    });
  }


  render() {

    const planinstance = this.props.planinstance;

    const _services = planinstance.services || [];
    const services = _services.map(service => {

      // const access = this.props.accessrules.find((accessrule) => {
      //   return accessrule.accessFeature === service.accessFeature && accessrule.titleDomain === service.titleDomain
      // });

      // const accessRoles = Object.keys(access.access).map((k, index) => {
      //   return (<div key={index}>
      //     <span>- {k}:</span> <span>{access.access[k].join(', ')}</span>
      //   </div>);
      // });

      // return (
      //   <div className="row" key={service.serviceNo} style={{ padding: '4px' }}>
      //     <div className="col-xs-11 col-xs-offset-1">
      //       <div>Access Feature: {service.accessFeature}</div>
      //       <div>Service Desc: {service.serviceDesc}</div>
      //       <div>Service ID: {service.serviceId}</div>
      //       <div>Service No: {service.serviceNo}</div>
      //     </div>
      //   </div>
      // )

      return service.accessFeature
    }).join(', ');

    return (
      <div className="row" key={planinstance.instanceNo}>
        <div className="col-xs-8">
          <div className="panel panel-default">
            <div className="panel-body">
              <div>
                <div><small><em>Plan instance ID</em></small></div>
                {planinstance.instanceId}
              </div>
              <div>
                <div><small><em>Plan name</em></small></div>
                {planinstance.planName}
              </div>
              <div>
                <div><small><em>Plan ID</em></small></div>
                {planinstance.planId}
              </div>
              <div>
                <div><small><em>Units</em></small></div>
                {planinstance.units}
              </div>
              <div>
                <div><small><em>Title Domain</em></small></div>
                {planinstance.titleDomain}
              </div>
              <div>
                <div><small><em>Services</em></small></div>
                {services}
              </div>
              <p></p>
              <p>No email domain masks yet.</p>
              <p>No users yet.</p>


              {/* <ArrayItems
                data={this.props.planinstance.emailMasks}
                label="Email masks"
                note="Users with matching email will automatically be included under Users."
                removeItem={this.removeEmailmask}
                addItem={this.addEmailmask}
                validateItem={this.validateEmailmask} />

              <Users
                users={this.props.planinstance.users}
                label="Users"
                note="Users that receive access according to Access rules."
                removeUser={this.removeUser}
                addUser={this.addUser}
                apiRoute="planinstances" /> */}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
