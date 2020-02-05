const React = require('react');

module.exports = class extends React.Component {
  constructor(props){
    super(props);
    this.addItem = this.addItem.bind(this);
    this.onChangeAddItem = this.onChangeAddItem.bind(this);
    this.state = {
      hasInput: false,
      inputValid: false
    };
  }


  onChangeAddItem() {
    const value = this.addItemInput.value;
    if(value.length > 0) {
      // Setting the invalid flag now, because there is one second delay
      //  before se start searching for users in BPC
      this.props.validateItem(value)
      .then(inputValid => this.setState({ hasInput: true, inputValid }));
    } else {
      this.setState({ hasInput: false, inputValid: false });
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


  render() {

    // In case of undefined
    const data = this.props.data || [];

    let items = data.map((item) => <ArrayItem key={item} data={item} removeItem={this.props.removeItem} translateItem={this.props.translateItem} />)

    const inputClassName = this.state.hasInput && !this.state.inputValid ? 'form-group has-error' : 'form-group';

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
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-success' onClick={this.addItem} disabled={!this.state.inputValid || this.state.addingItem} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
          </button>
        </td>
      </tr>
    );

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

    return (
      <tr key={ data }>
        <td>{ data }</td>
        <td style={{ textAlign: 'right'}}>
          <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem.bind(this, data)} style={{ minWidth: '90px' }}>
            <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
          </button>
        </td>
      </tr>
    );
  }
}
