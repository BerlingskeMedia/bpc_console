var $ = require('jquery');
var React = require('react');

module.exports = React.createClass({
  getInitialState: function() {
    return {
      adminUsers: [],
      applications: []
    };
  },
  getApplications: function() {
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
  },
  createApplication: function(application) {
    return $.ajax({
      type: 'POST',
      url: '/admin/applications',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(application),
      success: function(data, status){
        var apps = this.state.applications;
        apps.push(data);
        this.setState({applications: apps});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  },
  componentDidMount: function() {
    this.getApplications();
  },
  render: function() {
    var applications = this.state.applications.map(function(application, index) {
      return (
        <tr key={index}>
          <td className="col-xs-10">{application.id}</td>
          <td className="col-xs-2">
            <input className="btn btn-default" type="button" value="Edit" onClick={this.props.selectApplication.bind(null, application.id)} />
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
});


var CreateApplication = React.createClass({
  getInitialState: function() {
    return {
      value: ''
    };
  },
  onChange: function(e) {
    this.setState({value: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    if (this.state.value !== '') {
      this.props.createApplication({id: this.state.value}).done(function() {
        this.setState({value: ''});
      }.bind(this));
    }
  },
  render: function() {
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
});
