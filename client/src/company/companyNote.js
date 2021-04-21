import React from 'react';

export default class CompanyNote extends React.Component {
  constructor(props) {
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
    this.setState({saveInProgress: true}, () => {
      this.props.saveNote()
          .then(() => {
            this.setState({saveInProgress: false});
          });
    })
  }


  render() {
    return (
        <div className="row" style={{marginTop: '40px', minHeight: '10px'}}>
          <div className="col-xs-2" style={{textAlign: 'right'}}>
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
        </div>
    );
  }
}
