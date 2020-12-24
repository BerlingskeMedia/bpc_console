import React from 'react';

export default class CompanyPlaninstancesNote extends React.Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.saveNote = this.saveNote.bind(this);
    this.state = {
      note: '',
      saveTimer: null,
      saveInProgress: false
    };
  }

  handleChange(e) {
    clearTimeout(this.state.saveTimer);
    const note = e.target.value;
    this.setState({ note });
    this.setState({saveTimer: setTimeout(this.saveNote, 2500)});
  }

  onBlur(e) {
    clearTimeout(this.state.saveTimer);
    this.saveNote();
  }

  saveNote() {
    if(this.state.saveInProgress){
      return false;
    }

    const planinstance = this.props.planinstance;
    planinstance.note = this.state.note;
    this.setState({ saveInProgress: true }, () => {
      this.props.savePlaninstance(planinstance)
      .finally(() => {
        this.setState({ saveInProgress: false })
      })
    });
  }

  render() {
    const planinstance = this.props.planinstance;

    return (
      <textarea
        className="form-control"
        defaultValue={planinstance.note}
        rows="4"
        disabled={this.state.saveInProgress}
        onChange={this.handleChange}
        onBlur={this.onBlur}>
      </textarea>
    );
  }
}


