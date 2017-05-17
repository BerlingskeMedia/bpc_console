var $ = require('jquery');
var React = require('react');
var Grants = require('./grants');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      newScope: '',
      application: {
        settings: {}
      }
    };
  }

  getApplication() {
    return $.ajax({
      type: 'GET',
      url: '/admin/applications/'.concat(this.props.app),
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
      url: '/admin/applications/'.concat(this.props.app),
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

  deleteApplication() {
    return $.ajax({
      type: 'DELETE',
      url: '/admin/applications/'.concat(this.props.app),
      contentType: "application/json; charset=utf-8",
      success: function(data, status){
        this.props.closeApplication();
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

  onChangeApplicationSetting(e) {
    var application = this.state.application;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    application.settings[e.target.name] = value;
    this.setState({ application: application });
  }

  componentWillMount() {
    this.getApplication();
  }

  render() {

    var scopeList = this.state.application !== undefined && this.state.application.scope !== undefined
      ? this.state.application.scope.map(function(s, i){
          return (
            <li key={i}>
              <button type="button" className="btn btn-danger btn-xs" onClick={this.removeScope.bind(this, i)}>Remove scope</button>
              &nbsp;
              {s}
            </li>);
        }.bind(this))
      : null;

    return (
      <div>
        <div className="row">
          <div className="col-xs-2">
            <button type="button" className="btn btn-default" onClick={this.props.closeApplication}>Back</button>
          </div>
          <div className="col-xs-2">
          </div>
          <div className="col-xs-2 col-xs-offset-6">
            {['console'].indexOf(this.state.application.id) === -1
              ? <button type="button" className="btn btn-danger" onClick={this.deleteApplication}>Delete app</button>
              : null
            }
          </div>
        </div>
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
        <h2>Settings</h2>
        <form className="form-horizontal">
          <div className="form-group">
            <label className="col-sm-2 control-label" htmlFor="inputProvider">Provider</label>
            <div className="col-sm-10">
              <select className="form-control" value={this.state.application.settings.provider} name="provider" id="inputProvider" onChange={this.onChangeApplicationSetting}>
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
                  <input type="checkbox" defaultChecked={this.state.application.settings.disallowAutoCreationGrants} name="disallowAutoCreationGrants" onChange={this.onChangeApplicationSetting}></input>
                  Only allow access to specified users.
                </label>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.settings.disallowGrants} name="disallowGrants" onChange={this.onChangeApplicationSetting}></input>
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
                  Allowed the application to delegate a ticket to another application.
                </label>
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-xs" onClick={this.updateApplication.bind(this, this.state.application)}>Save settings</button>
        </form>
        <div className="row">
          <div className="col-xs-12">
            <h2>Scope</h2>
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
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <Grants app={this.props.app} />
          </div>
        </div>
      </div>
    );
  }
}
