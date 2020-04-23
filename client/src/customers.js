const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');
const Bpp = require('./components/bpp');

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getCustomer = this.getCustomer.bind(this);
    this.getCustomers = this.getCustomers.bind(this);
    this.clearSearchResults = this.clearSearchResults.bind(this);
    this.state = {
      customers: [],
      customer: null,
      accessrules: [],
      authorized: false,
      searchComplete: false
    };

    document.title = 'BPC - Customers';
  }


  getCustomers(query) {
    if(!query) {
      this.setState({
        customer: null,
        customers: [],
        searchComplete: false
      });
      return Promise.resolve();
    }

    return Bpp.request(`/api/accounts?${ query || '' }`)
    .then(customers => {
      if(customers.length === 1) {
        return this.getCustomer(customers[0]._id);
      } else {
        this.setState({
          customer: null,
          customers,
          searchComplete: true
        });
      }
    });
  }


  clearSearchResults() {
    return this.setState({ customer: null, customers: [], searchComplete: false });
  }


  getCustomer(id) {
    return Bpp.request(`/api/accounts/${ id }`)
    .then(customer => {
      this.setState({
        customer: customer,
        customers: []
      });
    });
  }


  componentDidMount() {
    return Bpp.authorize()
    .then(() => {
      this.setState({ authorized: true });
    })
    .then(() => Bpp.request(`/api/accessrules`))
    .then(accessrules => this.setState({ accessrules }))
    .catch(err => {
      this.setState({ authorized: false });
    })
  }


  render() {

    if(!this.state.authorized) {
      return (
        <div className="customers" style={{ paddingTop: '50px' }}>
          <div style={{textAlign: 'center'}}><em>(forbidden)</em></div>
        </div>
      );
    }

    const customers = this.state.customers.map(customer => {
      return <CustomerOverview key={customer._id} customer={customer} />
    });

    const emptyResult = this.state.searchComplete && customers.length === 0;

    return (
      <div className="customers" style={{ paddingTop: '30px' }}>
        <CustomerSearch getCustomers={this.getCustomers} clearSearchResults={this.clearSearchResults} accessrules={this.state.accessrules} />
        { emptyResult
          ? <div style={{textAlign: 'center'}}>(none)</div>
          : null
        }
        { this.state.customer
          ? <CustomerDetails key={this.state.customer._id} customer={this.state.customer} getCustomer={this.getCustomer} />
          : customers
        }
      </div>
    );
  }
};



class CustomerSearch extends React.Component {
  constructor(props){
    super(props);
    this.searchOnTextChange = this.searchOnTextChange.bind(this);
    this.search = this.search.bind(this);
    this.state = {
      searchInProgress: false,
      searchTimer: null
    };
  }


  componentDidMount() {
    const searchParams = getUrlParameter("search");
    if(searchParams.length > 0) {

      // Turning http://console.local:8086/companies?search=title%3Dberlingske%26uid%3De26a4c20f02b48baa1f1eb36fd7378c1
      // Into {title: "berlingske", uid: "e26a4c20f02b48baa1f1eb36fd7378c1"}
      const preloadedSearhParams = decodeURIComponent(searchParams).split('&').reduce((acc,cur) => {
        const temp = cur.split('=');
        if(temp.length !== 2) {
          return;
        }
        acc[temp[0]] = temp[1];
        return acc;
      }, {});


      if(Object.keys(preloadedSearhParams).length > 0) {
        this.titleSearchBox.value = preloadedSearhParams.title || '';
        this.ariaAccountNoBox.value = preloadedSearhParams.ariaAccountNo || '';
        this.ariaAccountIDBox.value = preloadedSearhParams.ariaAccountID || '';
        this.ariaEmailBox.value = preloadedSearhParams.email || '';

        this.searchOnTextChange();
      }
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

    if(this.ariaAccountIDBox.value.length > 0) {
      searchParams.push(`ariaAccountID=${ encodeURIComponent(this.ariaAccountIDBox.value) }`);
    }

    if(this.ariaEmailBox.value.length > 0) {
      searchParams.push(`email=${ encodeURIComponent(this.ariaEmailBox.value) }`);
    }
    
    if(searchParams.length === 0) {
      window.history.pushState({ search: "" }, "search", `/customers`);
      this.props.clearSearchResults();
      return;
    } else {
      // This params is only set if there is serching on other params.
      if(this.customerTypeSelect.value.length > 0) {
        searchParams.push(`customerType=${ this.customerTypeSelect.value }`);
      }
    }
    
    const query = `${ searchParams.join('&') }`;

    const search = encodeURIComponent(query);
    window.history.pushState({ search: search }, "search", `/customers?search=${search}`);

    this.setState({ searchInProgress: true }, () => {
      this.props.getCustomers(query)
      .finally(() => this.setState({ searchInProgress: false }));
    })
  }


  render() {

    return (
      <div style={{ marginBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-3">
            <input
              type="text"
              name="titleSearchBox"
              onChange={this.searchOnTextChange}
              className="form-control"
              placeholder="Type name start search"
              ref={(titleSearchBox) => this.titleSearchBox = titleSearchBox} />
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>^ marks the start of name</em></small></div>
            <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>$ marks the end of name</em></small></div>
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
            <input
              type="text"
              name="ariaAccountIDBox"
              onChange={this.searchOnTextChange}
              className="form-control"
              placeholder="Type account ID"
              ref={(ariaAccountIDBox) => this.ariaAccountIDBox = ariaAccountIDBox} />
          </div>
          <div className="col-xs-2">
            <input
              type="email"
              name="ariaEmailBox"
              onChange={this.searchOnTextChange}
              className="form-control"
              placeholder="Type email"
              ref={(ariaEmailBox) => this.ariaEmailBox = ariaEmailBox} />
          </div>
          <div className="col-xs-2">
            <select className="form-control input-sm" onChange={this.searchOnTextChange}
              ref={(customerTypeSelect) => this.customerTypeSelect = customerTypeSelect}>
                <option key={1} value='C'>Consumer</option>
                <option key={2} value='B'>Business</option>
                <option key={3} value=''>(all)</option>
          </select>
          </div>
        </div>
      </div>
    );
  }
}


class CustomerOverview extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div className="customer" style={{ paddingBottom: '4px' }}>
        <div className="row">
          <div className="col-xs-8">
            <h3>
              <div><small><strong>Title</strong></small></div>
              {this.props.customer.title || ''}
            </h3>
          </div>
          <div className="col-xs-4" style={{ textAlign: 'right' }}>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <pre>
              { JSON.stringify(this.props.customer, undefined, 2) }
            </pre>
          </div>
        </div>
      </div>
    );
  }
}


class CustomerDetails extends React.Component {
  constructor(props){
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="customer" style={{ paddingBottom: '4px' }}>
        <div className="row">
          <div className="col-xs-8">
            <h3>
              <div><small><strong>Title</strong></small></div>
              {this.props.customer.title || ''}
            </h3>
          </div>
          <div className="col-xs-4" style={{ textAlign: 'right' }}>
            <button type="button" className="btn btn-sm btn-warning" onClick={this.props.getCustomer.bind(this, this.props.customer._id)}>
              <span className="glyphicon glyphicon-refresh" aria-hidden="true"></span>
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <pre>
              { JSON.stringify(this.props.customer, undefined, 2) }
            </pre>
          </div>
        </div>
        <ChangeAriaAccountID customer={this.props.customer} />
      </div>
    );
  }
}


class ChangeAriaAccountID extends React.Component {
  constructor(props){
    super(props);
    this.onUserSearchChange = this.onUserSearchChange.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.requestChangeAriaAccountID = this.requestChangeAriaAccountID.bind(this);
    this.state = {
      searchUserTimer: null,
      userSearchBoxHasInput: false,
      foundUser: null,
      messageSent: false
    };
  }


  onUserSearchChange() {
    this.setState({foundUser: null});
    clearTimeout(this.state.searchUserTimer);
    this.setState({searchUserTimer: setTimeout(this.searchUser, 1000)});
  }


  searchUser() {
    const searchText = this.userSearchBox.value;
    if(searchText.length > 0) {
      const search = encodeURIComponent(searchText);
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


  requestChangeAriaAccountID() {
    if(this.state.foundUser && this.props.customer && this.props.customer.ariaAccountNo) {
      const message = {
        "type": "updateEmail",
        "ariaAccountNo": this.props.customer.ariaAccountNo,
        "email": this.state.foundUser.email,
        "uid": this.props.customer.ariaAccountID,
        "newAriaAccountID": this.state.foundUser.id
      };

      return Bpp.request(`/api/queue/message`, {
        method: 'POST',
        body: JSON.stringify(message)
      }).then(() => this.setState({ messageSent: true }))
    }
  }

  render() {

    let userSearchFeedback = null;
    let userSearchBoxClass = 'form-group has-feedback';
    if(this.state.userSearchBoxHasInput) {
      if (this.state.foundUser) {
        userSearchFeedback = <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>;
        userSearchBoxClass += ' has-success'
      } else {
        userSearchFeedback = <span className="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>;
        userSearchBoxClass += ' has-error'
      }
    }

    const disableButton = this.state.messageSent || userSearchFeedback === null;

    return (
      <div>
        <div className="row">
          <div className="col-xs-12">
            <div><p>Change ariaAccountID and email on account.</p></div>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-10">
            <div className={ userSearchBoxClass }>
              <input
                type="text"
                name="userSearchBox"
                id="userSearchBox"
                className="form-control"
                aria-describedby="inputSuccess2Status"
                onChange={this.onUserSearchChange}
                placeholder="Type user email or ID start search"
                ref={(userSearchBox) => this.userSearchBox = userSearchBox}
                disabled={this.state.messageSent} />
                { userSearchFeedback }
            </div>
          </div>
          <div className="col-xs-2" style={{ textAlign: 'right' }}>
            <button type="button" className="btn btn-sm btn-default" onClick={this.requestChangeAriaAccountID} disabled={disableButton}>
              { this.state.messageSent
                ? <span>Request sent to ARIA</span>
                : <span>Send request to ARIA</span>
              }
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
