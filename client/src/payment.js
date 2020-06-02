
const React = require('react');
const Link = require('react-router-dom').Link;
const PM = require('./components/pm');

module.exports = class extends React.Component {
  constructor(props){
    super(props);
    this.getPayment = this.getPayment.bind(this);
    this.showPaymentDetails = this.showPaymentDetails.bind(this);
    this.showHidePaymentDetails = this.showHidePaymentDetails.bind(this);
    this.state = {
      payment: null,
      showDetails: false,
      showLoader: false
    };
  }

  getPayment() {
    const id = this.props.payment.orderId;
    return PM.request(`/api/orders/${ id }`)
    .then(payment => {
      this.setState({ payment })
      return Promise.resolve(payment);
    });
  }

  showPaymentDetails() {
    this.setState({ showLoader: true }, () => {
      this.getPayment()
      .then(() => this.setState({
        showDetails: true,
        showLoader: false
      }));
    });
  }

  showHidePaymentDetails() {
    if(this.state.showDetails) {
      this.setState({ showDetails: false });
    } else {
      this.showPaymentDetails();
    }
  }


  componentDidMount() {
    if(this.props.autoLoadDetails) {
      this.showPaymentDetails();
    }
  }


  render() {

    const payment = this.state.payment || this.props.payment;
    const userLink = payment.userId ? <Link to={`/users?search=${ payment.userId }`}>{ payment.userId }</Link> : null;

    return (
      <div style={{ paddingBottom: '4px' }}>
        <div className="row">
          <div className="col-xs-4">
            <div className="text-wrap" style={{ textDecorationLine: '' }}>
              <h4>
                <div><small><em>Order ID</em></small></div>
                { payment.orderId || ''}
              </h4>
              <div>
                { payment.email
                  ? <small><span className="label label-info">email</span> { payment.email }</small>
                  : null
                }
              </div>
              <div>
                { payment.plan
                  ? <small><span className="label label-info">Plan</span> { payment.plan }</small>
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
            : <PaymentOverview payment={payment} />
          }
          </div>
          <div className="col-xs-4" style={{ textAlign: 'right' }}>
            { this.state.showDetails
              ? <button type="button" className="btn btn-sm btn-info" onClick={this.showHidePaymentDetails}>
                  <span><span className="glyphicon glyphicon-resize-small" aria-hidden="true"></span> <span>Close</span></span>
                </button>
              : <button type="button" className="btn btn-sm btn-default" onClick={this.showHidePaymentDetails}>
                  <span className="glyphicon glyphicon-resize-full" aria-hidden="true"></span> <span>Open</span>
                </button>
            }
          </div>
        </div>
        <hr />
      </div>
    );
  }
}

class PaymentOverview extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    if(!this.props.payment) {
      return null;
    }

    return (
      <div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Payment Type: {this.props.payment.paymentType || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Plan Description: {this.props.payment.description || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>User ID: {this.props.payment.userId || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Price/Frequency Price: {this.props.payment.price || ''}/{this.props.payment.frequencyPrice || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Status: {this.props.payment.status || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Transaction: {this.props.payment.transaction || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>Agreement: {this.props.payment.agreement || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small>ariaBillingGroupID: {this.props.payment.ariaBillingGroupID || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <pre><em><small>Offer: {this.props.payment.offer || ''}</small></em></pre>
        </div>
      </div>
    );
  }
}
