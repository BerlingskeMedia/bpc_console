
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
    return this.updateUser({ remove: { uid: user.uid || user.id } });
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
    .then(company => {
      this.setState({ company })
      return Promise.resolve(company);
    });
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
                note="Users that receive access according to all the access rules above."
                removeUser={this.removeUser}
                addUser={this.addUser} />

              <Planinstances
                ariaAccountNo={company.ariaAccountNo}
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

    if(!this.props.company) {
      return null;
    }

    const ipFilter = this.props.company.ipFilter || [];
    const ipFilterCount = this.props.company.ipFilterCount || ipFilter.length;

    const users = this.props.company.users || [];
    const userCount = this.props.company.userCount || users.length;
    
    const planinstances = this.props.company.planinstances || [];
    const planinstanceCount = this.props.company.planinstanceCount || planinstances.length;

    return (
      <div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Note: {this.props.company.note || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>IP count: {ipFilterCount}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>User count: {userCount}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Plan instances: {planinstanceCount}</small></em>
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

    let ths = [
      <th key="1">Internal ID</th>
    ];
    let tds = [
      <td key="1"><Link to={`/companies?id=${ company._id }`}>{ company._id }</Link></td>
    ];

    if(company.createdBy || !company.ariaAccountNo) {

      ths.push(<th key="2">Created</th>);
      tds.push(<td key="2">{company.createdAt || ''}</td>);

      ths.push(<th key="3">Created by</th>);
      tds.push(<td key="3">{(this.state.createdByUser ? this.state.createdByUser.email : null ) || (company.createdBy ? company.createdBy.user : '')}</td>);

    } else {

      ths.push(<th key="2">ARIA Account No</th>);
      tds.push(<td key="2">{ company.ariaAccountNo || '-' }</td>);

      ths.push(<th key="3">ARIA Account ID</th>);
      const idLink = company.ariaAccountID ? <Link to={`/users?search=${ company.ariaAccountID }`}>{ company.ariaAccountID }</Link> : null;
      tds.push(<td key="3">{ idLink || '-' }</td>)
      
    }

    ths.push(<th key="4">Status</th>);
    const status = company.status >= 1
      ? <span title={company.status} className="glyphicon glyphicon-ok" style={{color: 'lightgreen'}} aria-hidden="true"></span>
      : <span title={company.status} className="glyphicon glyphicon-minus" style={{color: 'red'}} aria-hidden="true"></span>;
    tds.push(<td key="4">{ status }</td>);

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
    this.onBlur = this.onBlur.bind(this);
    this.saveNote = this.saveNote.bind(this);
    this.state = {
      saveInProgress: false
    };
  }


  handleChange(e) {
    const note = e.target.value;
    this.props.addCompanyNote(note);
  }


  onBlur(e) {
    this.saveNote();
  }


  saveNote() {
    this.setState({ saveInProgress: true }, () => {
      this.props.saveNote()
      .then(() => {
        this.setState({ saveInProgress: false });
      });
    })
  }


  render() {
    return (
      <div className="row" style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="col-xs-2" style={{ textAlign: 'right' }}>
          <strong>Note</strong>
          <div><em><small></small></em></div>
        </div>
        <div className="col-xs-10">
          <textarea
            className="form-control"
            defaultValue={this.props.note}
            rows="4"
            disabled={this.state.saveInProgress}
            onChange={this.handleChange}
            onBlur={this.onBlur}></textarea>
        </div>
        {/* <div className="col-xs-1" style={{ textAlign: 'right' }}>
          <button type="button" className="btn btn-sm btn-warning" onClick={this.saveNote} disabled={this.state.saveInProgress}>
            <span className="glyphicon glyphicon-save" aria-hidden="true"></span> <span>Save</span>
          </button>
        </div> */}
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
    const allAccessRules = this.props.accessrules || [];

    // Mapping each if the company accessRules up against the accessRules in BPP
    const items = data
    // Reducing to unique accessRules (Aria sends a long list of duplicated accessRule)
    .reduce((acc, cur) => {
      let a = acc || [];
      const temp = a.findIndex(existing => {
        return cur.accessFeature === existing.accessFeature && cur.eligibleForSharing === existing.eligibleForSharing && cur.titleDomain === existing.titleDomain;
      });
      if(temp === -1) {
        a.push(cur);
      }
      return a;
    }, [])
    .map(accessRule => {

      const matchedAccessRules = allAccessRules.find((a) => {
        return a.accessFeature === accessRule.accessFeature && a.titleDomain === accessRule.titleDomain
      });

      let accessRoles = '';

      if(matchedAccessRules && matchedAccessRules.access) {
        accessRoles = Object.keys(matchedAccessRules.access).map((k, index) => {
          return (<div key={index}>
            <span>{k}:</span> <span>{matchedAccessRules.access[k].join(', ')}</span>
          </div>);
        });
      }

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
