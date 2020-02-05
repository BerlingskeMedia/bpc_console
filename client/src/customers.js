const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');
const Bpp = require('./components/bpp');

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.getCustomers = this.getCustomers.bind(this);
    this.state = {
      customers: [],
      customer: null,
      accessrules: [],
      authorized: false
    };

    document.title = 'BPC - Customers';
  }


  getCustomers(query) {
    if(!query) {
      this.setState({
        customer: null,
        customers: []
      });
      return Promise.resolve();
    }

    return Bpp.request(`/api/companies?customerType=C&${ query || '' }`)
    .then(customers => {
      if(customers.length === 1) {
        return Bpp.request(`/api/companies/${ customers[0]._id }`)
        .then(customer => {
          this.setState({
            customer: customer,
            customers: []
          });
        })
      } else {
        this.setState({
          customer: null,
          customers
        });
      }
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
    const customers = this.state.customers.map(customer => {

      return <Customer
              key={customer._id}
              data={customer}
              accessrules={this.state.accessrules}
              />
    });

    if(!this.state.authorized) {
      return (
        <div className="customers" style={{ paddingTop: '50px' }}>
          <div style={{textAlign: 'center'}}><em>(forbidden)</em></div>
        </div>
      );
    }

    return (
      <div className="customers" style={{ paddingTop: '30px' }}>
        <CustomerSearch getCustomers={this.getCustomers} accessrules={this.state.accessrules} />
        { this.state.customer
          ? <Customer key={this.state.customer._id} data={this.state.customer} />
          : null
        }
        { customers }
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
    
    const query = `${ searchParams.join('&') }`;

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
            <input
              type="text"
              name="ariaAccountIDBox"
              onChange={this.searchOnTextChange}
              className="form-control"
              placeholder="Type account ID"
              ref={(ariaAccountIDBox) => this.ariaAccountIDBox = ariaAccountIDBox} />
          </div>
        </div>
      </div>
    );
  }
}


class Customer extends React.Component {
  constructor(props){
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="customer" style={{ paddingBottom: '4px' }}>
        <div className="row">
          <div className="col-xs-12">
            {/* <h2><span className="label label-success">Title</span> {this.props.data.title || ''}</h2> */}
            
            <h3>
              <div><small><strong>Title</strong></small></div>
              {this.props.data.title || ''}
            </h3>
            <pre>
              { JSON.stringify(this.props.data, undefined, 2) }
            </pre>
          </div>
        </div>
      </div>
    );
  }
}