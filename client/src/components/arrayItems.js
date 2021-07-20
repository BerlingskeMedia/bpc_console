const React = require('react');

module.exports = class extends React.Component {
  constructor(props){
    super(props);
    this.addItem = this.addItem.bind(this);
    this.onChangeAddItem = this.onChangeAddItem.bind(this);
    this.showFullList = this.showFullList.bind(this);
    this.getDataLabel = this.getDataLabel.bind(this);
    this.state = {
      hasInput: false,
      inputValid: false,
      showTruncatedList: false,
      validationInfo: '',
    };
  }


  onChangeAddItem() {
    const value = this.addItemInput.value;
    if(value.length > 0) {
      // Setting the invalid flag now, because there is one second delay
      //  before se start searching for users in BPC
      this.props.validateItem(value)
      .then(inputValid => {
        this.setState({ hasInput: true, inputValid });
        if (this.props.validationInfo) {
          return this.props.validationInfo(value, inputValid);
        }
        return [];
      })
      .then(validationInfo => {
        if (validationInfo.length) {
          this.setState({validationInfo: `${validationInfo[0].city}, ${validationInfo[0].country}`});
        } else {
          this.setState({validationInfo: ''});
        }
      });
    } else {
      this.setState({ hasInput: false, inputValid: false, validationInfo: '' });
    }
  }


  addItem() {
    const value = this.addItemInput.value;
    if(value.length > 0) {

      // Setting inputValid to false to disable the button
      this.setState({ addingItem: true }, () => {
        this.props.addItem(value)
        .then(() => {
          this.addItemInput.value = '';
          this.setState({
            addingItem: false,
            inputValid: false,
            hasInput: false
          });
        })
        .catch(() => {
          this.setState({ addingItem: false });
        });
      });
    }
  }


  showFullList() {
    this.setState({ showTruncatedList: false });
  }


  componentDidMount() {
    if(this.props.data && this.props.data.length > 5) {
      this.setState({ showTruncatedList: true });
    }
  }

  getDataLabel(item) {
    let dataLabel = '';
    if (this.props.dataLabels) {
      dataLabel = this.props.dataLabels.get(item) || '';
    }
    return dataLabel;
  }


  render() {

    // In case of undefined
    let data = this.props.data || [];

    if(this.state.showTruncatedList) {
      data = data.slice(0, 5);
    }

    let items = data.map((item) => <ArrayItem key={item} data={item} label={this.getDataLabel(item)} removeItem={this.props.removeItem} translateItem={this.props.translateItem} isCheckbox={this.props.confirmRemoval !== undefined} />)

    if (this.props.confirmRemoval) {
      items.push(
        <tr key={-2}>
          <td></td>
          <td style={{textAlign: 'right'}}>
            <button type="button" className='btn btn-xs btn-danger' onClick={this.props.confirmRemoval} style={{ minWidth: '90px' }}>
              <span>Remove</span>
            </button>
          </td>
        </tr>
      )
    }

    const inputClassName = this.state.hasInput && !this.state.inputValid ? 'form-group has-error' : 'form-group';

    if(this.state.showTruncatedList) {
      items.push(
        <tr key={-1}>
          <td>
            <button type="button" className="btn btn-sm btn-link" style={{marginLeft: '0px', padding: '0px'}} onClick={this.showFullList}>
              <span>Show all {this.props.data.length} items </span>
            </button>
          </td>
          <td></td>
        </tr>
      );
    } else {
      items.push(
        <tr key={-1}>
          <td>
            {/* <div className="form-group has-feedback"> */}
            <div className={inputClassName}>
              <input
                type="text"
                name="addItemInput"
                className="form-control input-sm"
                onChange={this.onChangeAddItem}
                ref={(addItemInput) => this.addItemInput = addItemInput} />
            </div>
          </td>
          <td>{this.state.validationInfo}</td>
          <td style={{ textAlign: 'right'}}>
            <button type="button" className='btn btn-xs btn-success' onClick={this.addItem} disabled={!this.state.inputValid || this.state.addingItem} style={{ minWidth: '90px' }}>
              <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
            </button>
          </td>
        </tr>
      );
    }

    return (
      <div style={{ marginTop: '40px', minHeight: '10px' }}>
        <div className="row">
          <div className="col-xs-2" style={{ textAlign: 'right' }}>
            <strong>{ this.props.label }</strong>
            <div><em><small>{this.props.note}</small></em></div>
          </div>
          <div className="col-xs-10">
            <table className="table table-condensed">
              <tbody>
                { items }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}


class ArrayItem extends React.Component {
  constructor(props){
    super(props);
  }

  render() {

    const data = this.props.data || [];
    let item;
    if (this.props.isCheckbox) {
      item = <input type="checkbox" onClick={this.props.removeItem.bind(this, data)} style={{ minWidth: '90px' }}/>
    } else {
      item = <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem.bind(this, data)} style={{ minWidth: '90px' }}>
        <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
      </button>;
    }

    return (
      <tr key={ data }>
        <td>{ data } { this.props.label ? <span>({ this.props.label })</span> : '' }</td>
        <td style={{ textAlign: 'right'}}>
          { item }
        </td>
      </tr>
    );
  }
}
