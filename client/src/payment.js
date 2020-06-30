
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
    return PM.request(`/admin/order/${ id }`)
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
        <div className="row" style={{ display: "flex", flexWrap: "wrap" }}>
          <div className="col" style={{ flex: 1 }}>
            <div className="text-wrap" style={{ textDecorationLine: '' }}>
              <h4>
                <div><small><em>Order ID</em></small></div>
                { payment.orderId || ''}
              </h4>
              <div>
                { payment.email
                  ? <small><span className="label label-info">{ payment.email }</span> { userLink }</small>
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
          </div>
          <div className="col" style={{ flex: 1 }}>
          { this.state.showDetails
            ? <PaymentOverview payment={payment} />
            : null
          }
          </div>
          <div className="col" style={{ textAlign: 'right', flex: 1 }}>
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
          <em><small><strong>Payment Type:</strong> {this.props.payment.paymentType || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>Changed at:</strong> {this.props.payment.changedAt || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>Plan Description:</strong> {this.props.payment.description || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>User ID:</strong> {this.props.payment.userId || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>Price/Frequency Price:</strong> {this.props.payment.price || ''}/{this.props.payment.frequencyPrice || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>Status:</strong> {this.props.payment.status || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>Transaction:</strong>
            <div style={{ paddingLeft: '22px',border: '1px solid',marginLeft: '10px' }}>
              {
                Object.keys(this.props.payment.transaction).map((key, i) => (
                  <p key={i}>
                    <span><strong>{key}:</strong> {JSON.stringify(this.props.payment.transaction[key], null, 2)}</span>
                  </p>
                ))
              }</div></small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>Agreement:</strong>
            <div style={{ paddingLeft: '22px',border: '1px solid',marginLeft: '10px' }}>
              {
                Object.keys(this.props.payment.agreement).map((key, i) => (
                  <p key={i}>
                    <span><strong>{key}:</strong> {this.props.payment.agreement[key]}</span>
                  </p>
                ))
              }</div></small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>ariaBillingGroupID:</strong> {this.props.payment.ariaBillingGroupID || ''}</small></em>
        </div>
        <div style={{ paddingLeft: '4px' }}>
          <em><small><strong>Offer:</strong>
          <div style={{ paddingLeft: '22px',border: '1px solid',marginLeft: '10px' }}>
            {
            Object.keys(this.props.payment.offer).map((key, i) => (
              <p key={i}>
                <span><strong>{key}:</strong> {this.props.payment.offer[key]}</span>
              </p>
            ))
            }</div></small></em>
        </div>
      </div>
    );
  }
}
