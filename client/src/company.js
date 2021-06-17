
const React = require('react');
const Link = require('react-router-dom').Link;
const Netmask = require('netmask').Netmask
const Bpc = require('./components/bpc');
const Bpp = require('./components/bpp');
const Planinstances = require('./companyPlaninstances');
const Users = require('./companyUsers');
const ArrayItems = require('./components/arrayItems');
const backend = require('./components/backend');

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
    this.confirmRemoveIps = this.confirmRemoveIps.bind(this);
    this.addEmailmask = this.addEmailmask.bind(this);
    this.removeEmailmask = this.removeEmailmask.bind(this);
    this.getIpFilterLabels = this.getIpFilterLabels.bind(this);
    this.state = {
      company: null,
      showDetails: false,
      showLoader: false,
      users: [],
      ipsToRemove: [],
      ipFilterGeo: [],
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
    const regex = RegExp('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-9]|3[0-2]))?$');
    const valid = regex.test(value);
    return Promise.resolve(valid);
  }

  getGeoForInput(value, isValid) {
    if (!isValid) {
      return '';
    }
    return backend.geoLookup([value]);
  }

  validateEmailmask(value) {
    const atIndex = value.indexOf('@');
    const dotIndex = value.indexOf('.');
    const valid = value.length > 0 &&     // There is a value
      atIndex > -1 &&                     // There is an @
      (atIndex + 1) < dotIndex &&         // There is a domain
      value.length - dotIndex > 1;        // There is a top-level domain
    return Promise.resolve(valid);
  }

  addIp(value) {
    let newCompany = Object.assign({}, this.state.company);
    newCompany.ipFilter = newCompany.ipFilter || [];
    newCompany.ipFilter.push(value);
    return this.saveCompany(newCompany);
  }


  removeIp(item) {
    if (this.state.ipsToRemove.includes(item)) {
      this.setState({ipsToRemove: [...this.state.ipsToRemove.filter(ip => ip !== item)]});
    } else {
      this.setState({ipsToRemove: [...this.state.ipsToRemove, item]});
    }
  }

  confirmRemoveIps() {
    if (this.state.ipsToRemove.length) {
      const company = {
        ...this.state.company,
        ipFilter: this.state.company.ipFilter.filter(ip => !this.state.ipsToRemove.includes(ip))
      };
      return this.saveCompany(company);
    }
  }

  addEmailmask(value) {
    let newCompany = Object.assign({}, this.state.company);
    newCompany.emailMasks = newCompany.emailMasks || [];
    newCompany.emailMasks.push(value);
    return this.saveCompany(newCompany);
  }


  removeEmailmask(item) {
    let newCompany = Object.assign({}, this.state.company);
    const index = newCompany.emailMasks.findIndex(i => i === item);
    newCompany.emailMasks.splice(index, 1);
    return this.saveCompany(newCompany);
  }


  getCompany() {
    const id = this.props.company._id;
    let company = null;
    let users = [];
    return Bpp.request(`/api/companies/${ id }`)
      .then(fetchedCompany => {
        company = fetchedCompany;
        let ids = [];
        if (company.users) {
          ids = company.users.map(user => user.uid);
        }
        if(ids.length) {
          const chunker = function* (arr, n) {
            for (let i = 0; i < arr.length; i += n) {
              yield arr.slice(i, i + n);
            }
          }
          const chunks = [...chunker(ids, 200)];
          const promises = chunks.map(chunk => Bpc.request(`/users?provider=gigya&id=${encodeURIComponent(chunk.join())}`));
          return Promise.all(promises);
        }

        return [];
      })
      .then(fetchedUsers => {
        fetchedUsers = fetchedUsers.flat();
        if (fetchedUsers.length) {
          users = company.users.map(user => {
            const fetchedUser = fetchedUsers.find(fUser => fUser.id === user.uid);
            if (fetchedUser) {
              return {...user, ...fetchedUser};
            }
            return user;
          });
        }
        return Promise.resolve(users);
      })
      .then(() => this.getIpFilterGeo(company))
      .then(ipFilterGeo => {
        this.setState({company, ipFilterGeo, users});
      });
  }

  getIpFilterGeo(company) {
    if (company.ipFilter && company.ipFilter.length) {
      return backend.geoLookup(company.ipFilter)
    }
    return [];
  }


  saveCompany(company) {
    const id = this.props.company._id;
    return Bpp.request(`/api/companies/${ id }`, {
      method: 'PUT',
      body: JSON.stringify(company)
    })
    .then((response) => {
      company = response;
      return this.getIpFilterGeo(company);
    })
    .then(ipFilterGeo => this.setState({company, ipFilterGeo}))
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

  getIpFilterLabels() {
    if (this.state.company.ipFilter && this.state.company.ipFilter.length > 0) {
      return new Map(this.state.company.ipFilter.map(ip => {
        const geo = this.state.ipFilterGeo.find(geoEntry => ip.includes(geoEntry.ip));
        if (geo === undefined) {
          return [ip, ''];
        }
        let block
        try {
          block = new Netmask(ip);
        } catch (e) {
          return [ip, '']
        }
        if (block.bitmask === 32) {
          return [ip, `1 host, ${geo.city}, ${geo.country}`];
        }
        return [ip, `${block.first} - ${block.last} ${block.size} hosts, ${geo.city}, ${geo.country}`];
      }));
    }
    return new Map();
  }

  render() {

    const company = this.state.company || this.props.company;

    const userLink = company.ariaAccountID ? <Link to={`/users?search=${ company.ariaAccountID }`}>{ company.ariaAccountID }</Link> : null;

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
                  ? <small><span className="label label-info">ariaAccountID</span> { userLink }</small>
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

              <CompanyIDsAndDates company={this.state.company} />

              <CompanyNote
                note={this.state.company.note}
                addCompanyNote={this.addCompanyNote}
                saveNote={this.saveCompanyNote} />

              <AccessRules
                data={this.state.company.accessRules}
                accessrules={this.props.accessrules} />

              <ArrayItems
                data={this.state.company.ipFilter}
                dataLabels={this.getIpFilterLabels()}
                label="IP filter"
                note="Accepts single IPs and CIDR."
                removeItem={this.removeIp}
                confirmRemoval={this.confirmRemoveIps}
                addItem={this.addIp}
                validateItem={this.validateIp}
                validationInfo={this.getGeoForInput}/>

              <Users
                users={this.state.users}
                label="Users"
                note="Users that receive access according to all the access rules above."
                removeUser={this.removeUser}
                addUser={this.addUser} />

              <ArrayItems
                data={this.state.company.emailMasks}
                label="Email Masks"
                note="Email Masks that receive access according to all the access rules above."
                addItem={this.addEmailmask}
                removeItem={this.removeEmailmask}
                validateItem={this.validateEmailmask} />

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


class CompanyIDsAndDates extends React.Component {
  constructor(props){
    super(props);
    this.retrieveAccountDetailsRequest = this.retrieveAccountDetailsRequest.bind(this);
    this.state = {
      createdByUser: null,
      messageSent: false
    };
  }


  retrieveAccountDetailsRequest() {

    const company = this.props.company;
    const ariaAccountNo = company.ariaAccountNo;

    if(ariaAccountNo) {
      const message = {
        "type": "retrieveAccountDetails",
        ariaAccountNo
      };

      return Bpp.request(`/api/queue/message`, {
        method: 'POST',
        body: JSON.stringify(message)
      }).then(() => this.setState({ messageSent: true }))
    }
  }


  componentDidMount() {

    if(this.props.company.createdBy && this.props.company.createdBy.user) {
      Bpc.request(`/users/${ encodeURIComponent(this.props.company.createdBy.user) }`)
      .then(createdByUser => this.setState({ createdByUser }));
    }
  }


  render() {

    const company = this.props.company;

    const createdTitle = (this.state.createdByUser ? this.state.createdByUser.email : null ) || (company.createdBy ? company.createdBy.user : '');
    const created = <span title={ createdTitle }>{ company.createdAt || '-' }</span>;

    const status = company.status >= 1
      ? <span title={company.status} className="glyphicon glyphicon-ok" style={{color: 'lightgreen'}} aria-hidden="true"></span>
      : <span title={company.status} className="glyphicon glyphicon-minus" style={{color: 'red'}} aria-hidden="true"></span>;

    return(
      <div>
        <div className="row">
          <div className="col-xs-10 col-xs-offset-2">
            <table className="table table-condensed">
              <thead>
                <tr>
                  <th>Internal ID</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><Link to={`/companies?id=${ company._id }`}>{ company._id }</Link></td>
                  <td>{ created }</td>
                  <td>{ status }</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        { company.ariaAccountNo ?
          <div className="row">
            <div className="col-xs-10 col-xs-offset-2">
            <table className="table table-condensed">
                <thead>
                  <tr>
                    <th><small>Last update from ARIA</small></th>
                    <th style={{ textAlign: 'right' }}><small>Request latest contact information from ARIA</small></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><small>{ company.lastUpdatedAt || '' }</small></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-default"
                        onClick={this.retrieveAccountDetailsRequest}
                        disabled={this.state.messageSent}
                        style={{ minWidth: '90px' }}>
                        <span className='glyphicon glyphicon-send' aria-hidden="true"></span>
                        <span> </span>
                        { this.state.messageSent
                          ? <span>Request sent</span>
                          : <span>Send request</span>
                        }
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        : null }
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
