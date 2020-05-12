const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      applications: []
    };
    this.getApplications = this.getApplications.bind(this);
    this.createApplication = this.createApplication.bind(this);

    document.title = 'BPC - Applications';
  }

  getApplications() {
    return Bpc.request('/applications')
    .then(data => {
        this.setState({applications: data.filter((a) => {return a.id !== 'console';})});
    })
    .catch(err => {
      console.error(err);
    });
  }

  createApplication(application) {
    return Bpc.request('/applications', {
      method: 'POST',
      body: JSON.stringify(application)
    })
    .then(data => {
      location.pathname = `/applications/${data.id}`;
    });
  }

  componentDidMount() {
    this.getApplications();
  }

  render() {

    var applications = this.state.applications.map(function(application, index) {

      var scope = application.scope
      .filter((scope) => scope.indexOf('role:') !== 0 )
      .map((scope) => {
        return (
          <span key={index + '.' + scope}>
            <span>&nbsp;</span>
            <span className="scope label label-default">{scope}</span>
          </span>
        );
      });

      const provider = application.provider || (application.settings && application.settings.provider);
      const providerName = provider === 'google' ? 'Google' : provider === 'gigya'  ? 'Gigya' : '';

      return (
        <tr key={application.id} className="application">
          <td className="col-xs-4">
            <Link to={`/applications/${application.id}`}>{application.id}</Link>
          </td>
          <td className="col-xs-6">
            {scope}
          </td>
          <td className="col-xs-2">
            {providerName}
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
              <th className="col-xs-6">Scopes</th>
              <th className="col-xs-2">Provider</th>
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
    this.onChange = this.onChange.bind(this);
    this.showCreateForm = this.showCreateForm.bind(this);
    this.hideCreateForm = this.hideCreateForm.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      id: '',
      provider: 'gigya',
      showCreateForm: false
    };
  }

  onChange(e) {
    let s = this.state;
    s[e.target.name] = e.target.value;
    this.setState(s);
  }

  showCreateForm(e) {
    e.preventDefault();
    this.setState({ showCreateForm: true });
  }

  hideCreateForm(e) {
    e.preventDefault();
    this.setState({ showCreateForm: false });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.id !== '') {
      if(this.state.id.length < 3) {
        alert('Application ID too short');
        return;
      }
      this.props.createApplication({
        id: this.state.id,
        provider: this.state.provider
      }).done(function() {
        this.setState({
          id: '',
          provider: 'gigya',
          showCreateForm: false
        });
      }.bind(this));
    }
  }

  render() {

    const createForm = this.state.showCreateForm
    ? (
      <form onSubmit={this.handleSubmit} className="form-inline">
        <div className="form-group" style={{margin: '0px 10px'}}>
          <input
            type="text"
            name="id"
            className='form-control'
            placeholder="Application ID"
            value={this.state.id}
            onChange={this.onChange} />
        </div>
        <div className="form-group" style={{margin: '0px 10px'}}>
          <select
            className="form-control"
            value={this.state.provider}
            name="provider"
            onChange={this.onChange}>
            <option value="gigya">Provider: Gigya</option>
            <option value="google">Provider: Google</option>
          </select>
        </div>
        <button style={{margin: '0px 10px'}} type="submit" className="btn btn-primary">Create</button>
      </form>
      )
    : null;

    const openFormButton = this.state.showCreateForm
      ? <button type="button" className="btn btn-default" onClick={this.hideCreateForm}>Cancel</button>
      : <button type="button" className="btn btn-default" onClick={this.showCreateForm}>Create new application</button>

    return (
      <div style={{paddingBottom: '30px'}}>
        <div className="row">
          <div className="col-xs-2">{ openFormButton }</div>
          <div className="col-xs-10">{ createForm }</div>
        </div>
      </div>
    );
  }
}
