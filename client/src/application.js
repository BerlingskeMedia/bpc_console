const $ = require('jquery');
const React = require('react');
const ApplicationUsers = require('./applicationUsers');
const ApplicationAdmins = require('./applicationAdmins');
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
        settings: {
          includeScopeInPrivatExt: false,
          ticketDuration: ''
        }
      },
      savedSuccessMessageFadeOutTimeout: null
    };
  }

  getApplication() {
    return $.ajax({
      type: 'GET',
      url: '/_b/applications/'.concat(this.state.app)
    }).done((data, textStatus, jqXHR) => {
      if(data.settings === undefined || data.settings === null){
        data.settings = {};
      }
      this.setState({application: data});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
        alert(jqXHR.responseJSON.message);
      }
      if (jqXHR.status === 403) {
        window.location = "/applications"; 
      }
    });
  }

  updateApplication(application) {
    return $.ajax({
      type: 'PUT',
      url: '/_b/applications/'.concat(this.state.app),
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(application)
    }).done((data, textStatus, jqXHR) => {

      $('.savedSuccessMessage').fadeIn(100);
      if(this.state.savedSuccessMessageFadeOutTimeout) {
        clearTimeout(this.state.savedSuccessMessageFadeOutTimeout);
      }
      const newSavedSuccessMessageFadeOutTimeout = setTimeout(
        function() {
          $('.savedSuccessMessage').fadeOut(600);
        },
        3000
      );
      
      this.setState({
        application: application,
        savedSuccessMessageFadeOutTimeout: newSavedSuccessMessageFadeOutTimeout
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  warnDeleteApplicationToggle(){
    $('.warnDeleteApplication').toggle();
  }

  deleteApplication() {
    return $.ajax({
      type: 'DELETE',
      url: '/_b/applications/'.concat(this.state.app),
      contentType: "application/json; charset=utf-8"
    }).done((data, textStatus, jqXHR) => {
      location.pathname = '/applications';
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  addScope(e) {
    e.preventDefault();
    var application = Object.assign({}, this.state.application);
    var newLength = application.scope.push(this.state.newScope);
    this.updateApplication(application)
    .done((data, textStatus, jqXHR) => {
      this.setState({newScope: ''});
    }).fail((jqXHR, textStatus, errorThrown) => {
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
    this.updateApplication(application);
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
            <Link to={`/applications`}>
              <button type="button" className="btn btn-default btn-sm btn-block">Close</button>
            </Link>
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
              <dt>Algorithm</dt>
              <dd>{this.state.application.algorithm}</dd>
              <dt>Login provider</dt>
              <dd>{this.state.application.settings.provider}</dd>
            </dl>
          </div>
        </div>
        <h3>Settings</h3>
        <form className="form-horizontal">
          <div className="form-group">
            <label className="col-sm-2 control-label">Grants</label>
            <div className="col-sm-10">
            <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.settings.allowAutoCreationGrants} name="allowAutoCreationGrants" onClick={this.onChangeApplicationSettings}></input>
                  Allow grants to be created automatically.
                </label>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.settings.disallowAutoCreationGrants} name="disallowAutoCreationGrants" onClick={this.onChangeApplicationSettings}></input>
                  Only issue ticket to users with existing grant. If not, grants will be created automatically.
                </label>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.settings.disallowUserTickets} name="disallowUserTickets" onClick={this.onChangeApplicationSettings}></input>
                  Do not issue tickets to any users.
                </label>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.settings.allowAnonymousUsers} name="allowAnonymousUsers" onClick={this.onChangeApplicationSettings}></input>
                  Allow issue of anonymous tickets.
                </label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="col-sm-2 control-label">Ticket options</label>
            <div className="col-sm-10">
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.delegate} name="delegate" onClick={this.onChangeApplication}></input>
                  Allow the application to delegate tickets to another applications.
                </label>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" defaultChecked={this.state.application.settings.includeScopeInPrivatExt} name="includeScopeInPrivatExt" onClick={this.onChangeApplicationSettings}></input>
                  Store scope data in the encryptet private part of the ticket.
                </label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="col-sm-2 control-label">Ticket duration</label>
            <div className="col-sm-10">
              <p>Minutes until the user ticket needs to be reissued:</p>
              <input type="number" className="form-control" name="ticketDuration" value={this.state.application.settings.ticketDuration} min="1" placeholder="Default: 60 minutes" onChange={this.onChangeApplicationSettings}></input>
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-10 col-sm-offset-2">
              <button type="button" className="btn btn-primary btn-xs" onClick={this.updateApplication.bind(this, this.state.application)}>
                Save settings
              </button>
              <span className="savedSuccessMessage" style={{color: '#008000', verticalAlign: 'middle', marginLeft: '10px', display: 'none'}}>Saved successully</span>
            </div>
          </div>
        </form>
        <hr />
        <div className="row">
          <div className="col-xs-6">
            <h3>Scopes</h3>
            <div>Scopes the application is allow to read/write. And users can read.</div>
            <form style={{paddingTop: '30px', paddingBottom: '30px'}}>
              <div className="form-group">
                <input
                  type="text"
                  name="newScope"
                  className="form-control"
                  value={this.state.newScope}
                  onChange={this.onChangeState}
                  placeholder="Type scope name"/>
              </div>
              <button type="submit" onClick={this.addScope} className="btn btn-default">Add scope</button>
            </form>
            <ul className="list-unstyled">
              {scopeList}
            </ul>
            {scopeList === null || scopeList.length === 0
              ? <div>This app has no scopes.</div>
              : null
            }
          </div>
          <div className="col-xs-6">
            <ApplicationAdmins app={this.state.app} />
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-xs-12">
            <ApplicationUsers
              app={this.state.app}
              provider={this.state.application.settings.provider} />
          </div>
        </div>
      </div>
    );
  }
}
