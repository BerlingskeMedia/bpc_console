const React = require('react');
const Company = require('./company');
const Bpc = require('./components/bpc');
const Bpp = require('./components/bpp');

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getCompanies = this.getCompanies.bind(this);
    this.addNewCompany = this.addNewCompany.bind(this);
    this.state = {
      companies: [],
      accessrules: [],
      authorized: false
    };
    
    document.title = 'BPC - Companies';
  }
  
  
  getCompanies(query) {
    return Bpp.request(`/api/companies?customerType=B&&${ query || '' }`)
    // return Bpp.request(`/api/companies?customerType=B&title=DJ&${ query || '' }`)
    .then(companies => {
      const companyCount = companies.length;
      const userCount = companies.reduce((acc, cur) => {
        return acc + cur.userCount;
      }, 0);
      this.setState({ companies, companyCount, userCount });
    });
  }


  addNewCompany(company) {
    let companies = this.state.companies;
    companies.push(company)
    this.setState({ companies });
  }


  componentDidMount() {
    return Bpp.authorize()
    .then(() => this.setState({ authorized: true }))
    .then(this.getCompanies)
    .then(() => Bpp.request(`/api/accessrules`))
    .then(accessrules => this.setState({ accessrules }))
    .catch(err => {
      this.setState({ authorized: false });
    })
  }


  render() {
    const companies = this.state.companies.map(company => {

      return <Company
              key={company._id}
              company={company}
              accessrules={this.state.accessrules} />
    });

    if(!this.state.authorized) {
      return (
        <div className="companies" style={{ paddingTop: '50px' }}>
          <div style={{textAlign: 'center'}}><em>(forbidden)</em></div>
        </div>
      );
    }

    return (
      <div className="companies" style={{ paddingTop: '30px' }}>
        <CompanySearch getCompanies={this.getCompanies} accessrules={this.state.accessrules} />
        <CompanySearchStatistics companyCount={this.state.companyCount} userCount={this.state.userCount} />
        { companies }
        { companies.length === 0
          ? <div style={{textAlign: 'center'}}><em>(none)</em></div>
          : null
        }
        <CompanyCreate addNewCompany={this.addNewCompany} />
      </div>
    );
  }
};


class CompanySearch extends React.Component {
  constructor(props){
    super(props);
    this.onUserSearchChange = this.onUserSearchChange.bind(this);
    this.searchOnTextChange = this.searchOnTextChange.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.search = this.search.bind(this);
    this.state = {
      searchInProgress: false,
      searchTimer: null,
      searchUserInProgress: false,
      searchUserTimer: null,
      foundUser: null,
      userSearchBoxHasInput: false
    };
  }

  componentDidMount() {
    const searchText = getUrlParameter("search");
    console.log('searchText')
    console.log(searchText)
    // title=DJ&emailmask=dako
    // if(searchText.length > 0) {
    //   this.searchBox.value = decodeURIComponent(searchText);
    //   this.searchUser();
    // }
  }


  
  onUserSearchChange() {
    clearTimeout(this.state.searchUserTimer);
    this.setState({searchUserTimer: setTimeout(this.searchUser, 1000)});
  }
  

  searchUser() {
    const searchText = this.userSearchBox.value;
    if(searchText.length > 0) {
      const search = encodeURIComponent(searchText.length);
      const query = `?provider=gigya&email=${ search }&id=${ search }`;

      Bpc.request(`/users${ query }`)
      .then(users => {
        const foundUser = users.length === 1 ? users[0] : null;
        this.setState({ foundUser, userSearchBoxHasInput: true }, this.search);
      });      
    } else {
      this.setState({ foundUser: null, userSearchBoxHasInput: false }, this.search);
    }
  }


  searchOnTextChange(e) {
    clearTimeout(this.state.searchTimer);
    this.setState({searchTimer: setTimeout(this.search, 1000)});
  }


  search() {
    if(this.state.searchInProgress){
      return false;
    }

    const searchParams = [];

    if(this.titleSearchBox.value.length > 0) {
      searchParams.push(`title=${ encodeURIComponent(this.titleSearchBox.value) }`);
    }

    if(this.ariaAccountNoBox.value.length > 0) {
      searchParams.push(`ariaAccountNo=${ encodeURIComponent(this.ariaAccountNoBox.value) }`);
    }

    if(this.ipFilterSearchBox.value.length > 0) {
      searchParams.push(`ipFilter=${ encodeURIComponent(this.ipFilterSearchBox.value) }`);
    }

    if(this.state.foundUser) {
      searchParams.push(`uid=${ encodeURIComponent(this.state.foundUser.id) }`);
    } else if (this.userSearchBox.value.length > 0) {
      searchParams.push(`emailmask=${ encodeURIComponent(this.userSearchBox.value) }`);
    }


    if(this.accessFeatureSelect.value.length > 0) {
      searchParams.push(`accessFeature=${ encodeURIComponent(this.accessFeatureSelect.value) }`)
    }


    if(this.titleDomainSelect.value.length > 0) {
      searchParams.push(`titleDomain=${ encodeURIComponent(this.titleDomainSelect.value) }`)
    }
    
    const query = `${ searchParams.join('&') }`;

    const search = encodeURIComponent(query);
    window.history.pushState({ search: search }, "search", `/companies?search=${search}`);

    this.setState({ searchInProgress: true }, () => {
      this.props.getCompanies(query)
      .finally(() => this.setState({ searchInProgress: false }));
    })
  }


  render() {

    let userSearchFeedback = null;
    let userSearchBoxClass = 'form-group has-feedback';
    let userSearchFeedbackReadable = '';
    if(this.state.userSearchBoxHasInput) {
      if (this.state.foundUser) {
        userSearchFeedback = <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>;
        userSearchBoxClass += ' has-success'
        userSearchFeedbackReadable = 'Searching in users'
      // } else {
        // userSearchFeedback = <span className="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span>;
        // userSearchBoxClass += ' has-error'
      } else {
        userSearchFeedbackReadable = 'Searching in email masks'
      }
    }

    const accessrules = this.props.accessrules || [];

    const accessFeatures = [...new Set(accessrules.map((a) => a.accessFeature))];
    const accessFeaturesOptions = accessFeatures.map((accessFeature) => {
      return <option key={accessFeature} value={accessFeature}>{accessFeature}</option>;
    });

    const titleDomains = [...new Set( accessrules.map((a) => a.titleDomain) )];
    const titleDomainsOptions = titleDomains.map((titleDomain) => {
      return <option key={titleDomain} value={titleDomain}>{titleDomain}</option>;
    });

    return (
      <div style={{ marginBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-3">
            <input
              type="text"
              name="titleSearchBox"
              onChange={this.searchOnTextChange}
              className="form-control"
              placeholder="Type title start search"
              ref={(titleSearchBox) => this.titleSearchBox = titleSearchBox} />
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>^ marks the start</em></small></div>
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>$ marks the end</em></small></div>
          </div>
          <div className="col-xs-2">
            <input
              type="text"
              name="ariaAccountNoBox"
              onChange={this.searchOnTextChange}
              className="form-control"
              placeholder="Type account number"
              ref={(ariaAccountNoBox) => this.ariaAccountNoBox = ariaAccountNoBox} />
          </div>
          <div className="col-xs-3">
            <div className={ userSearchBoxClass }>
              <input
                type="text"
                name="userSearchBox"
                id="userSearchBox"
                className="form-control"
                aria-describedby="inputSuccess2Status"
                onChange={this.onUserSearchChange}
                placeholder="Type user email or ID start search"
                ref={(userSearchBox) => this.userSearchBox = userSearchBox} />
                { userSearchFeedback }
                <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>{ userSearchFeedbackReadable }</em></small></div>
            </div>
          </div>
          <div className="col-xs-2">
            <input
              type="text"
              name="ipFilterSearchBox"
              onChange={this.searchOnTextChange}
              className="form-control"
              placeholder="Type IP start search"
              ref={(ipFilterSearchBox) => this.ipFilterSearchBox = ipFilterSearchBox} />
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>^ marks the start</em></small></div>
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>$ marks the end</em></small></div>
          </div>
          <div className="col-xs-2">
            <div className="row">
              <div className="col-xs-12">
                <select
                  className="form-control"
                  onChange={this.search}
                  ref={(accessFeatureSelect) => this.accessFeatureSelect = accessFeatureSelect}>
                  <option value=""></option>
                  { accessFeaturesOptions }
                </select>
                <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>accessFeature</em></small></div>
              </div>
              <div className="col-xs-12">
                <select
                  className="form-control"
                  onChange={this.search}
                  ref={(titleDomainSelect) => this.titleDomainSelect = titleDomainSelect}>
                  <option value=""></option>
                  { titleDomainsOptions }
                </select>
                <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>titleDomain</em></small></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


class CompanySearchStatistics extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return(
      <div style={{ marginBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-12">
            <div><em><small>Companies: { this.props.companyCount || '-' }</small></em></div>
            <div><em><small>Users: { this.props.userCount || '-' }</small></em></div>
          </div>
        </div>
      </div>
    );
  }
}


class CompanyCreate extends React.Component {
  constructor(props){
    super(props);
    this.onClickCreateCompany = this.onClickCreateCompany.bind(this);
    this.createCompany = this.createCompany.bind(this);
    this.state = {
      canCreateCompanies: false
    };
  }


  onClickCreateCompany() {
    const title = this.companyTitleBox.value;
    if(title.length > 0) {
      return this.setState({ creatingCompany: true }, () => {
        return this.createCompany({ title }, () => {
          return this.setState({ creatingCompany: false });
        });
      });
    }
  }


  createCompany(company) {
    company.customerType = 'B';
    return Bpp.request(`/api/companies`, {
      method: 'POST',
      body: JSON.stringify(company)
    })
    .then(company => this.props.addNewCompany(company));
    // .then(company => {
    //   let companies = this.state.companies;
    //   companies.push(company)
    //   this.setState({ companies });
    // });
  }


  componentDidMount() {
    const canCreateCompanies = Bpp.isCompanyUser() || Bpp.isCompanyAdmin();
    this.setState({ canCreateCompanies });
  }


  render() {

    if(!this.state.canCreateCompanies) {
      return (null);
    }

    const createButtonDisabled = this.state.creatingCompany;

    return(
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-12">
            <h4>Create new</h4>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-8">
            <input
                type="text"
                name="companyTitleBox"
                className="form-control"
                placeholder="Type company name to create"
                ref={(companyTitleBox) => this.companyTitleBox = companyTitleBox} />
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>Min. 3 chars. Max. 100 chars.</em></small></div>
          </div>
          <div className="col-xs-4" style={{ textAlign: 'left' }}>
            <button type="button" className="btn btn-default" onClick={this.onClickCreateCompany} disabled={createButtonDisabled}>
              <span className="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> <span>Create</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}


function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
