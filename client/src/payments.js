const React = require('react');
const Payment = require('./payment');
const Bpc = require('./components/bpc');
const PM = require('./components/pm');

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getPayments = this.getPayments.bind(this);
    this.clearSearchResults = this.clearSearchResults.bind(this);
    this.state = {
      payments: [],
      authorized: false,
      searchCleared: true
    };

    document.title = 'BPC - Payments';
  }


  getPayments(query = '', path = '') {
    const requestPath = path || '/admin/order';
    return PM.request(`${ requestPath }${ query }`)
    .then(payments => {
      const paymentsCount = payments.length;
      this.setState({ payments, paymentsCount, searchCleared: false });
    });
  }


  clearSearchResults() {
    this.setState({ payments: [], paymentsCount: 0, searchCleared: true });
  }

  componentDidMount() {
    return PM.authorize()
    .then(() => this.setState({ authorized: true }))
    .then(() => {
      const preloaded_id = getUrlParameter("id");
      if(preloaded_id) {
        return this.getPayments(`/${ preloaded_id }`);
      } else {
        return this.getPayments();
      }
    })
    .catch(err => {
      this.setState({ authorized: false });
    })
  }


  render() {

    const isTheOnlyPaymentFound = this.state.paymentsCount === 1;

    const payments = this.state.payments.map(payment => {

      return <Payment
              key={payment.orderId}
              payment={payment}
              autoLoadDetails={isTheOnlyPaymentFound} />
    });

    if(!this.state.authorized) {
      return (
        <div className="payments" style={{ paddingTop: '50px' }}>
          <div style={{textAlign: 'center'}}><em>(forbidden)</em></div>
        </div>
      );
    }

    return (
      <div className="payments" style={{ paddingTop: '30px' }}>
        <PaymentSearch getPayments={this.getPayments} clearSearchResults={this.clearSearchResults} />
        <PaymentSearchStatistics paymentsCount={this.state.paymentsCount}/>
        { payments }
        { this.state.searchCleared !== true && payments.length === 0
          ? <div style={{textAlign: 'center'}}><em>(none)</em></div>
          : null
        }
      </div>
    );
  }
};

class PaymentSearch extends React.Component {
  constructor(props){
    super(props);
    this.onUserSearchChange = this.onUserSearchChange.bind(this);
    this.searchOnTextChange = this.searchOnTextChange.bind(this);
    this.searchUser = this.searchUser.bind(this);
    this.search = this.search.bind(this);
    this.showAll = this.showAll.bind(this);
    this.setAgreement = this.setAgreement.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.setTicket = this.setTicket.bind(this);
    this.setPlanID = this.setPlanID.bind(this);
    this.setStatus = this.setStatus.bind(this);
    this.setPaymentType = this.setPaymentType.bind(this);
    this.setTitleCode = this.setTitleCode.bind(this);
    this.state = {
      searchInProgress: false,
      searchTimer: null,
      searchUserInProgress: false,
      searchUserTimer: null,
      foundUser: null,
      userSearchBoxHasInput: false,
      searchFields: {
        agreement_id: '',
        orderId: '',
        ticket: '',
        ariaPlanID: '',
        status: 1,
        paymentType: '',
        titleCode: '',
      }
    };
  }

  componentDidMount() {
    const searchParams = getUrlParameter("search");
    if(searchParams.length > 0) {
      const preloadedSearchParams = decodeURIComponent(searchParams).split('&').reduce((acc,cur) => {
        const temp = cur.split('=');
        if(temp.length !== 2) {
          return;
        }
        acc[temp[0]] = temp[1];
        return acc;
      }, {});

      if(Object.keys(preloadedSearchParams).length > 0) {
        this.userSearchBox.value = preloadedSearchParams.uid || preloadedSearchParams.emailmask || '';

        if(preloadedSearchParams.uid) {
          this.searchUser();
        }

        this.searchOnTextChange();
      }
    }
  }

  onUserSearchChange() {
    clearTimeout(this.state.searchUserTimer);
    this.setState({searchUserTimer: setTimeout(this.searchUser, 1000)});
  }

  searchUser() {
    const searchText = this.userSearchBox.value;
    if(searchText.length > 0) {
      const search = encodeURIComponent(searchText);
      const query = `?provider=gigya&email=${ search }&id=${ search }`;

      return Bpc.request(`/users${ query }`)
      .then(users => {
        const foundUser = users.length === 1 ? users[0] : null;
        this.setState({ foundUser, userSearchBoxHasInput: true }, this.search);
      });
    } else {
      this.setState({ foundUser: null, userSearchBoxHasInput: false }, this.search);
      return Promise.resolve();
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

    if(this.state.foundUser) {
      searchParams.push(`uid=${ encodeURIComponent(this.state.foundUser.id) }`);
    } else {
      Object.keys(this.state.searchFields).map(current => {
        if (this.state.searchFields[current] !== '') {
          searchParams.push(`${current}=${ encodeURIComponent(this.state.searchFields[current]) }`);
        }
      })
    }


    if(!this.state.foundUser && this.userSearchBox.value.length > 0 || searchParams.length === 0) {
      window.history.pushState({ search: "" }, "search", `/payments`);
      this.props.clearSearchResults();
      return;
    }

    const search = encodeURIComponent(`${ searchParams.join('&') }`);
    window.history.pushState({ search: search }, "search", `/payments?search=${search}`);
    if(this.state.foundUser) {
    this.setState({ searchInProgress: true }, () => {
      this.props.getPayments('', `/admin/user/${this.state.foundUser.id}/order`)
      .finally(() => this.setState({ searchInProgress: false }));
    })
    } else {
      this.setState({ searchInProgress: true }, () => {
        this.props.getPayments('', `/admin/order?${search}`)
          .finally(() => this.setState({ searchInProgress: false }));
      })
    }
  }

  showAll() {
    this.userSearchBox.value = '';
    this.setState({ foundUser: null, userSearchBoxHasInput: false }, this.search);
    this.props.getPayments();
  }

  setAgreement(e) {
    this.setState({searchFields: { ...this.state.searchFields, agreement_id: e.target.value}});
  }
  setOrder(e) {
    this.setState({searchFields: { ...this.state.searchFields, orderId: e.target.value }});
  }
  setTicket(e) {
    this.setState({searchFields: { ...this.state.searchFields, ticket: e.target.value }});
  }
  setPlanID(e) {
    this.setState({searchFields: { ...this.state.searchFields, ariaPlanID: e.target.value }});
  }
  setStatus(e) {
    this.setState({searchFields: { ...this.state.searchFields, status: e.target.value }});
  }
  setPaymentType(e) {
    this.setState({searchFields: { ...this.state.searchFields, paymentType: e.target.value }});
  }
  setTitleCode(e) {
    this.setState({searchFields: { ...this.state.searchFields, titleCode: e.target.value }});
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
      } else {
        userSearchFeedbackReadable = 'Searching in email masks'
      }
    }

    return (
      <div style={{ marginBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-4">
            <div className={ userSearchBoxClass }>
              <input
                type="text"
                name="userSearchBox"
                id="userSearchBox"
                className="form-control"
                aria-describedby="inputSuccess2Status"
                onChange={this.onUserSearchChange}
                placeholder="User email/ID to start search"
                ref={(userSearchBox) => this.userSearchBox = userSearchBox} />
                { userSearchFeedback }
                <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>{ userSearchFeedbackReadable }</em></small></div>
            </div>
          </div>
          <PaymentSearchInput type="text" name="agreement_id" id="agreement_id" onChange={this.setAgreement} placeholder="MobilePay agreement ID" />
          <PaymentSearchInput type="text" name="orderId" id="orderId" onChange={this.setOrder} placeholder="Order Id" />
          <PaymentSearchInput type="text" name="ticket" id="ticket" onChange={this.setTicket} placeholder="Dibs ticket" />
          <PaymentSearchInput type="text" name="ariaPlanID" id="ariaPlanID" onChange={this.setPlanID} placeholder="Aria Plan Id" />
          <PaymentSearchSelect
            options={[{ label: 'success', value: 1 },{ label: 'fail', value: 0 }]}
            defaultValue={"1"}
            onChange={this.setStatus} />
          <PaymentSearchSelect
            options={[{ label: 'Dibs', value: 'dibs' },{ label: 'MobilePay', value: 'mobilepay' }]}
            defaultValue={""}
            label="Gateway"
            onChange={this.setPaymentType} />
          <PaymentSearchSelect
            options={[{ value: 'BTA' },{ value: 'BER' },{ value: 'WEA' }]}
            defaultValue={""}
            label="TitleCode"
            onChange={this.setTitleCode} />
          <div className="col-xs-2">
            <button type="button" className="btn btn-sm btn-primary" onClick={this.search}>
              <span><span className="glyphicon"></span> <span>Search</span></span>
            </button>
            <button type="button" className="btn btn-sm btn-warning" onClick={this.showAll}>
              <span><span className="glyphicon"></span> <span>Show All</span></span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

class PaymentSearchInput extends React.Component {

  render() {
    return (
      <div className="col-xs-2">
        <div className={ this.props.class }>
          <input
            type={this.props.type}
            name={this.props.name}
            id={this.props.id}
            className="form-control"
            onChange={this.props.onChange}
            placeholder={this.props.placeholder}
            ref={(value) => this.props.name = value} />
          { this.props.feedback }
          <div style={{ paddingLeft: '4px', color: 'darkgrey' }}><small><em>{ this.props.feedbackReadable }</em></small></div>
        </div>
      </div>
    );
  }
}

class PaymentSearchSelect extends React.Component {
  render() {
    const { options } = this.props;
    return(
      <div className="col-xs-2">
        <select className="form-control" defaultValue={this.props.defaultValue} onChange={this.props.onChange}>
          {(this.props.defaultValue === "")
            ? <option syle="color:grey" value="" disabled hidden>{this.props.label}</option> : null}
          {options.map(id =>
            <option key={id.value} value={id.value}>{id.label || id.value}</option>
          )}
        </select>
      </div>
    )
  }
}

class PaymentSearchStatistics extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return(
      <div style={{ marginBottom: '20px' }}>
        <div className="row">
          <div className="col-xs-12">
            <div><em><small>Payments: { this.props.paymentsCount || '-' }</small></em></div>
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
