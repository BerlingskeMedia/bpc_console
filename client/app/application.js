const $ = require('jquery');
const React = require('react');
const Grants = require('./grants');
const Link = require('react-router-dom').Link;
const Redirect = require('react-router-dom').Redirect;

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.deleteApplication = this.deleteApplication.bind(this)
    this.addScope = this.addScope.bind(this)
    this.removeScope = this.removeScope.bind(this)
    this.onChangeState = this.onChangeState.bind(this)
    this.onChangeApplication = this.onChangeApplication.bind(this)
    this.onChangeApplicationSettings = this.onChangeApplicationSettings.bind(this)
    this.state = {
      app: this.props.match.params.app,
      newScope: '',
      application: {
        settings: {}
      }
    };
  }

  getApplication() {
    return $.ajax({
      type: 'GET',
      url: '/admin/applications/'.concat(this.state.app),
      success: function(data, status){
        console.log('application', data);
        if(data.settings === undefined || data.settings === null){
          data.settings = {};
        }
        this.setState({application: data});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  updateApplication(application) {
    return $.ajax({
      type: 'PUT',
      url: '/admin/applications/'.concat(this.state.app),
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(application),
      success: function(data, status){
        this.setState({application: application});
        console.log('application updated');
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  warnDeleteApplicationToggle(){
    $('.warnDeleteApplication').toggle();
  }

  deleteApplication() {
    return $.ajax({
      type: 'DELETE',
      url: '/admin/applications/'.concat(this.state.app),
      contentType: "application/json; charset=utf-8",
      success: function(data, status){
        location.pathname = '/applications';
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  }

  addScope(e) {
    e.preventDefault();
    var application = Object.assign({}, this.state.application);
    var newLength = application.scope.push(this.state.newScope);
    this.updateApplication(application)
    .done(function(){
      this.setState({newScope: ''});
    }.bind(this))
    .fail(function(){
      console.log('fail');
      application.scope.splice(newLength - 1, 1);
    });
  }

  removeScope(index) {
    var application = Object.assign({}, this.state.application);
    application.scope.splice(index, 1);
    this.updateApplication(application);
  }

  onChangeState(e) {
    var temp = {};
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    temp[e.target.name] = value;
    this.setState(temp);
  }

  onChangeApplication(e) {
    var application = this.state.application;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    application[e.target.name] = value;
    this.setState({ application: application });
  }

  onChangeApplicationSettings(e) {
    var application = this.state.application;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    application.settings[e.target.name] = value;
    this.setState({ application: application });
  }

  componentDidMount() {
    this.getApplication();
  }

  render() {

    var scopeList = this.state.application !== undefined && this.state.application.scope !== undefined
      ? this.state.application.scope.map(function(s, i){
          return (
            <li key={i} style={{marginBottom: '2px'}}>
              <button type="button" className="btn btn-danger btn-xs" onClick={this.removeScope.bind(this, i)}>Remove scope</button>
              &nbsp;
              {s}
            </li>);
        }.bind(this))
      : null;

    return (
      <div style={{marginTop: '4px'}}>
        <div className="row">
          <div className="col-xs-2">
            <button type="button" className="btn btn-default btn-sm btn-block">
              <Link to={`/applications`}>Close</Link>
            </button>
          </div>
          <div className="col-xs-2 col-xs-offset-4">
            <div className="warnDeleteApplication text-right" style={{display: 'none'}}>
              Sure?
            </div>
          </div>
          <div className="col-xs-2">
            <div className="warnDeleteApplication" style={{display: 'none'}}>
              <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.deleteApplication}>Yes</button>
            </div>
          </div>
          <div className="col-xs-2">
            <div className="warnDeleteApplication">
              <button type="button" className="btn btn-danger btn-sm btn-block" onClick={this.warnDeleteApplicationToggle}>Delete app</button>
            </div>
            <div className="warnDeleteApplication" style={{display: 'none'}}>
              <button type="button" className="btn btn-success btn-sm btn-block" onClick={this.warnDeleteApplicationToggle}>No</button>
            </div>
          </div>
        </div>
        <h3>Credentials</h3>
        <div className="row">
          <div className="col-xs-12">
            <dl className="dl-horizontal">
              <dt>Application ID</dt>
              <dd>{this.state.application.id}</dd>
              <dt>Application Key</dt>
              <dd>{this.state.application.key}</dd>
            </dl>
          </div>
        </div>
        <h3>Settings</h3>
        <form className="form-horizontal">
          <div className="form-group">
            <label className="col-sm-2 control-label" htmlFor="inputProvider">Provider</label>
            <div className="col-sm-10">
              <select className="form-control" value={this.state.application.settings.provider} name="provider" id="inputProvider" onChange={this.onChangeApplicationSettings}>
                <option value=""></option>
                <option value="gigya">Gigya</option>
                <option value="google">Google</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="col-sm-2 control-label">Grants</label>
            <div className="col-sm-10">
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.settings.disallowAutoCreationGrants} name="disallowAutoCreationGrants" onChange={this.onChangeApplicationSettings}></input>
                  Only allow access to specified users.
                </label>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.settings.disallowGrants} name="disallowGrants" onChange={this.onChangeApplicationSettings}></input>
                  Do not allow access to any users (not implemented).
                </label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="col-sm-2 control-label">Delegate</label>
            <div className="col-sm-10">
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.delegate} name="delegate" onChange={this.onChangeApplication}></input>
                  Allow the application to delegate tickets to another applications.
                </label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-10 col-sm-offset-2">
              <button type="button" className="btn btn-primary btn-xs" onClick={this.updateApplication.bind(this, this.state.application)}>Save settings</button>
            </div>
          </div>
        </form>
        <h3>Scope</h3>
        <div className="row">
          <div className="col-xs-12">
            <form style={{paddingTop: '30px', paddingBottom: '30px'}} onSubmit={this.addScope} className="form-inline">
              <input
               type="text"
               name="newScope"
               className="form-control"
               value={this.state.newScope}
               onChange={this.onChangeState}
               placeholder="Add scope"/>
             </form>
            <ul className="list-unstyled">
              {scopeList}
            </ul>
            {scopeList === null || scopeList.length === 0
              ? <div>This app has no scopes.</div>
              : null
            }
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <Grants app={this.state.app} />
          </div>
        </div>
      </div>
    );
  }
}
