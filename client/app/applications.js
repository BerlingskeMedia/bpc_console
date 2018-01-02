const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      applications: []
    };
    this.getApplications = this.getApplications.bind(this);
    this.createApplication = this.createApplication.bind(this);
  }

  getApplications() {
    return $.ajax({
      type: 'GET',
      url: '/_b/applications',
      contentType: "application/json; charset=utf-8",
      success: function(data, status){
        this.setState({applications: data.filter((a) => {return a.id !== 'console';})});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(jqXHR.responseText);
      }
    });
  }

  createApplication(application) {
    return $.ajax({
      type: 'POST',
      url: '/_b/applications',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(application),
      success: function(data, status){
        document.cookie = 'console_ticket=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        location.pathname = `/application/${data.id}`;
        // this.setState((prevState) => {
        //   applications: prevState.applications.push(data);
        // });
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(jqXHR.responseText);
      }
    });
  }

  componentDidMount() {
    this.getApplications();
  }

  render() {

    var applications = this.state.applications.map(function(application, index) {
      var scope = application.scope.map(function(scope) {
        return (
          <span key={index + '.' + scope}>
            <span>&nbsp;</span>
            <span className="scope label label-default">{scope}</span>
          </span>
        );
      });
      return (
        <tr key={index} className="application">
          <td className="col-xs-4">
            <Link to={`/application/${application.id}`}>{application.id}</Link>
          </td>
          <td className="col-xs-8">
            {scope}
          </td>
        </tr>
      );
    }.bind(this));

    return (
      <div className="applications" style={{paddingTop: '30px'}}>
        <CreateApplication createApplication={this.createApplication} />
        <table className="table">
          <tbody>
            <tr>
              <th className="col-xs-4">ID</th>
              <th className="col-xs-8">Scopes</th>
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
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
      <form style={{paddingBottom: '30px'}} onSubmit={this.handleSubmit} className="form-inline">
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
