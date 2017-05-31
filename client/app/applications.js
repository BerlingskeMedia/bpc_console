const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      adminUsers: [],
      applications: []
    };
    this.getApplications = this.getApplications.bind(this);
    this.createApplication = this.createApplication.bind(this);
  }

  getApplications() {
    return $.ajax({
      type: 'GET',
      url: '/admin/applications',
      contentType: "application/json; charset=utf-8",
      success: function(data, status){
        this.setState({applications: data.filter((a) => {return a.id !== 'console';})});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  createApplication(application) {
    return $.ajax({
      type: 'POST',
      url: '/admin/applications',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(application),
      success: function(data, status){
        this.setState((prevState) => {
          applications: prevState.applications.push(data);
        });
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  componentDidMount() {
    this.getApplications();
  }

  render() {

    var applications = this.state.applications.map(function(application, index) {
      return (
        <tr key={index}>
          <td className="col-xs-10">
            <Link to={`/application/${application.id}`}>{application.id}</Link>
          </td>
          <td className="col-xs-2">
          </td>
        </tr>
      );
    }.bind(this));

    return (
      <div className="applications">

        <h3>Applications</h3>
        <CreateApplication createApplication={this.createApplication} />

        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-10">ID</th>
              <th className="col-xs-2"></th>
            </tr>
            {applications}
          </tbody>
        </table>
      </div>
    );
  }
}


class CreateApplication extends React.Component {

  constructor(props){
    super(props);
    this.state = {value: ''};
    this.onChange = this.onChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  onChange(e) {
    this.setState({value: e.target.value});
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.value !== '') {
      this.props.createApplication({id: this.state.value}).done(function() {
        this.setState({value: ''});
      }.bind(this));
    }
  }

  render() {
    return (
      <form style={{paddingTop: '30px', paddingBottom: '30px'}} onSubmit={this.handleSubmit} className="form-inline">
        <input
          type="text"
          name="id"
          className='form-control'
          placeholder="Application ID"
          value={this.state.value}
          onChange={this.onChange} />
        <button type="submit" className="btn btn-default">Create application</button>
      </form>
    );
  }
}
