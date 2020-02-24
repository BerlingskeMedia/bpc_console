
const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');
const Bpp = require('./components/bpp');
const Planinstances = require('./companyPlaninstances');
const Users = require('./companyUsers');
const ArrayItems = require('./components/arrayItems');

module.exports = class extends React.Component {
  constructor(props){
    super(props);
    this.getCompany = this.getCompany.bind(this);
    this.saveCompany = this.saveCompany.bind(this);
    this.showCompanyDetails = this.showCompanyDetails.bind(this);
    this.showHideCompanyDetails = this.showHideCompanyDetails.bind(this);
    this.addCompanyNote = this.addCompanyNote.bind(this);
    this.saveCompanyNote = this.saveCompanyNote.bind(this);
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.addIp = this.addIp.bind(this);
    this.removeIp = this.removeIp.bind(this);
    this.state = {
      company: null,
      showDetails: false,
      showLoader: false
    };
  }


  addCompanyNote(note) {
    let company = Object.assign({}, this.state.company);
    company.note = note;
    this.setState({ company });
  }

  saveCompanyNote(e) {
    return this.saveCompany(this.state.company);
  }


  addUser(foundUser) {
    return this.updateUser({ add: { uid: foundUser.id } });
  }

  
  removeUser(user) {
    return this.updateUser({ remove: { uid: user.uid } });
  }


  updateUser(payload) {
    const id = this.props.company._id;
    return Bpp.request(`/api/companies/${ id }/users`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then((company) => this.setState({ company }));
  }


  validateIp(value) {
    // Regex for IP incl. CIDR validation
    // var regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))?$/g;
    // var found = value.match(regex);
    // return found != null;
    var regex = RegExp('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))?$');
    const valid = regex.test(value);
    return Promise.resolve(valid);
  }


  addIp(value) {
    let newCompany = Object.assign({}, this.state.company);
    newCompany.ipFilter = newCompany.ipFilter || [];
    newCompany.ipFilter.push(value);
    return this.saveCompany(newCompany);
  }


  removeIp(item) {
    let newCompany = Object.assign({}, this.state.company);
    const index = newCompany.ipFilter.findIndex(i => i === item);
    newCompany.ipFilter.splice(index, 1);
    return this.saveCompany(newCompany);
  }


  getCompany() {
    const id = this.props.company._id;
    return Bpp.request(`/api/companies/${ id }`)
    .then(company => this.setState({ company }));
  }


  saveCompany(company) {
    const id = this.props.company._id;
    return Bpp.request(`/api/companies/${ id }`, {
      method: 'PUT',
      body: JSON.stringify(company)
    })
    .then((response) => this.setState({
      company: response,
    }))
    .catch((err) => {
      alert('Error when saving!');
      this.getCompany();
    });
  }


  showCompanyDetails() {
    this.setState({ showLoader: true }, () => {
      this.getCompany()
      .then(() => this.setState({
        showDetails: true,
        showLoader: false
      }));
    });
  }

  showHideCompanyDetails() {
    if(this.state.showDetails) {
      this.setState({ showDetails: false });
    } else {
      this.showCompanyDetails();
    }
  }


  componentDidMount() {
    if(this.props.autoLoadDetails) {
      this.showCompanyDetails();
    }
  }
  
  
  render() {

    const company = this.state.company || this.props.company;

    return (
      <div style={{ paddingBottom: '4px' }}>
        <div className="row">
          <div className="col-xs-4">
            <div className="text-wrap" style={{ textDecorationLine: '' }}>
              <h4>
                <div><small><em>Title</em></small></div>
                { company.title || ''}
              </h4>
              <div>
                { company.ariaAccountNo
                  ? <small><span className="label label-info">ariaAccountNo</span> { company.ariaAccountNo }</small>
                  : null
                }
              </div>
              <div>
                { company.ariaAccountID
                  ? <small><span className="label label-info">ariaAccountID</span> { company.ariaAccountID }</small>
                  : null
                }
              </div>
            </div>
            {/* { this.state.showLoader
              ? (<div className="loadSpinner">
                  <img src="/assets/load_spinner.gif" />
                </div>)
              : null
            } */}
          </div>
          <div className="col-xs-4">
          { this.state.showDetails
            ? null
            : <CompanyOverview company={company} />
          }
          </div>
          <div className="col-xs-4" style={{ textAlign: 'right' }}>
            { this.state.showDetails
              ? <button type="button" className="btn btn-sm btn-info" onClick={this.showHideCompanyDetails}>
                  <span><span className="glyphicon glyphicon-resize-small" aria-hidden="true"></span> <span>Close</span></span>
                </button>
              : <button type="button" className="btn btn-sm btn-default" onClick={this.showHideCompanyDetails}>
                  <span className="glyphicon glyphicon-resize-full" aria-hidden="true"></span> <span>Open</span>
                </button>
            }
          </div>
        </div>

        { this.state.showDetails
          ?  <div style={{ marginTop: '10px', marginBottom: '100px', minHeight: '100px' }}>

              <CompanyCreatedDetails company={this.state.company} />
              
              <CompanyNote
                note={this.state.company.note}
                addCompanyNote={this.addCompanyNote}
                saveNote={this.saveCompanyNote} />
              
              <AccessRules
                data={this.state.company.accessRules}
                accessrules={this.props.accessrules} />

              {/* <AddAccessRules accessrules={this.props.accessrules} addAccessRule={this.addAccessRule} /> */}
              
              <ArrayItems
                data={this.state.company.ipFilter}
                label="IP filter"
                note="Accepts single IPs and CIDR."
                removeItem={this.removeIp}
                addItem={this.addIp}
                validateItem={this.validateIp} />

              <Users
                users={this.state.company.users}
                label="Users"
                note="Users that receive access according to Access rules."
                removeUser={this.removeUser}
                addUser={this.addUser} />

              <Planinstances
                planinstances={company.planinstances}
                accessrules={this.props.accessrules} />

            </div>  
          : null
        }
        <hr />
      </div>
    );
  }
}


class CompanyOverview extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const planinstances = this.props.company.planinstances || [];
    // const planinstancesOverview = planinstances.map((planinstance, index) => {

    //   const userCount = planinstance.users instanceof Array ? planinstance.users : 0;
    //   const units = planinstance.units || NaN;

    //   let userCountbackgroundColor = 'inherit';

    //   if(isNaN(units)) {
    //     // Nothing
    //   } else if(userCount > units) {
    //     userCountbackgroundColor = 'inhcrimsonerit';
    //   } else if(userCount === units) {
    //     userCountbackgroundColor = 'coral';
    //   }

    //   return(
    //     <div key={planinstance._id} style={{ backgroundColor: userCountbackgroundColor }}>
    //       <em><small>{planinstance.planName}</small></em>
    //       <span> </span>
    //       <em><small>(Users: {userCount}/{units})</small></em>
    //     </div>
    //   );
    // });

    return (
      <div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Note: {this.props.company.note || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>IP count: {this.props.company.ipFilterCount || '-'}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>User count: {this.props.company.userCount || '-'}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Plan instances: {planinstances.length}</small></em>
        </div>
      </div>
    );
  }
}


class CompanyCreatedDetails extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      createdByUser: null
    };
  }


  componentDidMount() {

    if(this.props.company.createdBy && this.props.company.createdBy.user) {
      Bpc.request(`/users/${ encodeURIComponent(this.props.company.createdBy.user) }`)
      .then(createdByUser => this.setState({ createdByUser }));
    }
  }


  render() {

    const company = this.props.company;

    let ths = [];
    let tds = [];

    if(company.createdBy) {

      ths = [
        <th key="1">Created</th>,
        <th key="2">Created by</th>
      ];

      tds = [
        <td key="1">{this.props.company.createdAt || ''}</td>,
        <td key="2">{(this.state.createdByUser ? this.state.createdByUser.email : null ) || (company.createdBy ? company.createdBy.user : '')}</td>
      ];

    } else {

      ths = [
        <th key="1">ARIA Account No</th>,
        <th key="2">ARIA Account ID</th>,
        <th key="3">cid</th>
      ];

      const idLink = company.ariaAccountID ? <Link to={`/users?search=${ company.ariaAccountID }`}>{ company.ariaAccountID }</Link> : null;

      tds = [
        <td key="1">{ company.ariaAccountNo || '-' }</td>,
        <td key="2">{ idLink || '-' }</td>,
        <td key="3">{ company.cid }</td>,
        <td key="4">{ company.active || '-' }</td>
      ];
    }

    return(
      <div className="row">
        <div className="col-xs-10 col-xs-offset-2">
          <table className="table table-condensed">
            <thead>
              <tr>
                { ths }
              </tr>
            </thead>
            <tbody>
              <tr>
                { tds }
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}


class CompanyNote extends React.Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.saveNote = this.saveNote.bind(this);
    this.state = {
      saveButtonDisabled: false
    };
  }

  handleChange(e) {
    const note = e.target.value;
    this.props.addCompanyNote(note);
  }

  saveNote() {
    this.setState({ saveButtonDisabled: true }, () => {
      this.props.saveNote()
      .then(() => {
        this.setState({ saveButtonDisabled: false });
      });
    })
  }

  render() {

    const saveButtonDisabled = this.state.saveButtonDisabled;

    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Note</strong>
          <div><em><small></small></em></div>
        </div>
        <div className="col-xs-9">
          <textarea
            className="form-control"
            defaultValue={this.props.note}
            rows="2"
            onChange={this.handleChange}></textarea>
        </div>
        <div className="col-xs-1" style={{ textAlign: 'right' }}>
          <button type="button" className="btn btn-sm btn-warning" onClick={this.saveNote} disabled={saveButtonDisabled}>
            <span className="glyphicon glyphicon-save" aria-hidden="true"></span> <span>Save</span>
          </button>
        </div>
      </div>
    );
  }
}




class AccessRules extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const data = this.props.data || [];

    const items = data.map(accessRule => {

      const access = this.props.accessrules.find((a) => {
        return a.accessFeature === accessRule.accessFeature && a.titleDomain === accessRule.titleDomain
      });

      const accessRoles = Object.keys(access.access).map((k, index) => {
        return (<div key={index}>
          <span>{k}:</span> <span>{access.access[k].join(', ')}</span>
        </div>);
      });


      return (
        <tr key={accessRule.accessFeature + accessRule.titleDomain + Math.random() }>
          <td>{accessRule.accessFeature}</td>
          <td>{accessRule.titleDomain}</td>
          <td>{ accessRoles }</td>
          <td style={{ textAlign: 'right' }}>
            {/* <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem} style={{ minWidth: '90px'}}>
              <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
            </button> */}
          </td>
        </tr>
      );
    });


    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Access rules</strong>
          <div><em><small>Access rules for this account are managed in Aria.</small></em></div>
        </div>
        <div className="col-xs-10">
          { items.length > 0
          ? <table className="table table-condensed">
            <thead>
              <tr>
                <th>accessFeature</th>
                <th>titleDomain</th>
                <th>Access ( -> BPC)</th>
                <th></th>
              </tr>
            </thead>
              <tbody>
                { items }
              </tbody>
            </table>
            : <div>-</div>
          }
        </div>
      </div>
    );
  }
}


class AddAccessRules extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const accessFeaturesOptions = this.props.accessrules.map((a, index) => {
      return (
        <option key={index} value={a.accessFeature}>{a.accessFeature}</option>
      );
    });


    const titleDomainOptions = this.props.accessrules.map((a, index) => {
      return (
        <option key={index} value={a.titleDomain}>{a.titleDomain}</option>
      );
    });


    // const titleDomainOptions = this.props.accessrules.map((a, index) => {
    //   return (
    //     <option key={index} value={index}>{a.accessFeature + '/' + a.titleDomain}</option>
    //   );
    // });

    return(
      <div className="row" style={{ marginTop: '5px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Add Access rules</strong>
        </div>
        <div className="col-xs-3">
          <select className="form-control input-sm">
            <option key={-1} disabled value='N/A'>Select accessFeature</option>
            { accessFeaturesOptions }
          </select>
        </div>
        <div className="col-xs-3">
          <select className="form-control input-sm">
            <option key={-1} disabled value='N/A'>Select titleDomain</option>
            { titleDomainOptions }
          </select>
        </div>
        <div className="col-xs-2">

        </div>
      </div>
    );
  }
}
