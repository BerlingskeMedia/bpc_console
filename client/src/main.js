const $ = require('jquery');
const React = require('react');
const ReactDOM = require('react-dom');
const ReactRouterDom = require('react-router-dom');
const BrowserRouter = ReactRouterDom.BrowserRouter;
const Route = ReactRouterDom.Route;
const Link = ReactRouterDom.Link;
const Redirect = ReactRouterDom.Redirect;
const Applications = require('./applications');
const Permissions = require('./permissions');
const ConsoleUsers = require('./consoleUsers');
const Application = require('./application');
const Gigya = require('./gigya');
const Tools = require('./tools');
const GoogleLogin = require('react-google-login').default;

// Add the event handler

const gapiClientId = '844384284363-rattdu658pbu53csn5d9hmb65l8ml4gs.apps.googleusercontent.com';
const gapiScope = 'https://www.googleapis.com/auth/plus.login';

class ConsoleApp extends React.Component {

  constructor(props) {
    super(props);
    this.onGoogleSignIn = this.onGoogleSignIn.bind(this);
    this.setReissueUserTicketTimeout = this.setReissueUserTicketTimeout.bind(this);
    this.getUserTicket = this.getUserTicket.bind(this);
    this.reissueUserTicket = this.reissueUserTicket.bind(this);
    this.getUserTicketDone = this.getUserTicketDone.bind(this);
    this.getUserTicketFail = this.getUserTicketFail.bind(this);
    this.deleteUserTicket = this.deleteUserTicket.bind(this);
    this.state = {
      authenticated: false,
      authenticationNeeded: false,
      authorized: false,
      missingGrant: false,
      ticketReissueFailed: false,
      accountInfo: {},
      userprofile: {}
    };
  }

  componentWillMount() {
    window.gapi.load('auth2', function () {
      window.gapi.auth2.init({
        clientId: gapiClientId,
        cookiePolicy: 'single_host_origin',
        scope: gapiScope
      }).then(function (GoogleAuth) {
        if (GoogleAuth.isSignedIn.get()) {
          this.onGoogleSignIn(GoogleAuth.currentUser.get());
        } else {
          this.setState({ authenticationNeeded: true });
        }
      }.bind(this));
    }.bind(this));
  }

  componentDidMount() {
  }

  onGoogleSignIn(googleUser) {
    // Useful data for your client-side scripts:
    var basicProfile = googleUser.getBasicProfile();
    var authResponse = googleUser.getAuthResponse();

    this.setState({
      authenticated: true,
      authenticationNeeded: false
    });

    const getUserTicketPayload = {
      ID: basicProfile.getId(),
      id_token: authResponse.id_token,
      access_token: authResponse.access_token
    };


    this.getUserTicket(getUserTicketPayload);
  }

  onGoogleSignInFailure(err) {
    console.log('Google Sign in error', err);
  }

  setReissueUserTicketTimeout(ticket) {
    setTimeout(function () {
      this.reissueUserTicket();
    }.bind(this), ticket.exp - Date.now() - 10000);
  }

  getUserTicket(payload){
    return $.ajax({
      type: 'POST',
      url: '/authenticate',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(payload)
    })
    .done((ticket, textStatus, jqXHR) => this.getUserTicketDone(ticket, textStatus, jqXHR))
    .fail((jqXHR, textStatus, errorThrown) => this.getUserTicketFail(jqXHR, textStatus, errorThrown));
  }

  reissueUserTicket() {
    return $.ajax({
      type: 'GET',
      url: '/authenticate',
      contentType: 'application/json; charset=utf-8'
    })
    .done((ticket, textStatus, jqXHR) => this.getUserTicketDone(ticket, textStatus, jqXHR))
    .fail((jqXHR, textStatus, errorThrown) => this.getUserTicketFail(jqXHR, textStatus, errorThrown));
  }

  getUserTicketDone(ticket, textStatus, jqXHR) {
    this.setState({ authorized: true });
    this.setReissueUserTicketTimeout(ticket);
  }

  getUserTicketFail(jqXHR, textStatus, errorThrown) {
    console.error(jqXHR);
    console.error(jqXHR.responseText);
    this.setState({
      authorized: false,
      ticketReissueFailed: true
    });
  }

  deleteUserTicket(){
    return $.ajax({
      type: 'DELETE',
      url: '/authenticate'
    }).done((data, textStatus, jqXHR) => {
      console.log('DELETE signout success', data, status);
      this.setState({ authenticated: false, authorized: false});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  getSearchParameter(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  setSearchParameter(key, value) {
    // remove the hash part before operating on the uri
    var uri = window.location.href;
    var i = uri.indexOf('#');
    var hash = i === -1 ? ''  : uri.substr(i);
         uri = i === -1 ? uri : uri.substr(0, i);

    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (value === undefined || value === null) {
      uri = uri.replace(re, '$1' + '$2').replace('?&', '?');
      if (uri.endsWith('&')) {
        uri = uri.slice(0, -1);
      }
    } else if (uri.match(re)) {
      uri = uri.replace(re, '$1' + key + "=" + value + '$2');
    } else {
      uri = uri + separator + key + "=" + value;
    }
    var href = uri + hash;
    if (window.history.pushState) {
      window.history.pushState({path:href},'',href)
    }
  }

  showLoginScreen() {
    gigya.accounts.showScreenSet({screenSet:'Default-RegistrationLogin'});
  }

  render() {

    return (
      <div className="container">
          {this.state.authenticated
            ? <div>
                {this.state.authorized === true ? <Main /> : null }
                {this.state.ticketReissueFailed === true ? <p>Din session kunne ikke forlænges.</p> : null }
                {this.state.missingGrant === true ? <p>Du har ikke de fornødne rettigheder.</p> : null }
              </div>
            : null
          }

          {this.state.authenticationNeeded
            ? <div style={{marginTop: '15px'}}>
                <GoogleLogin
                  clientId={gapiClientId}
                  scope={gapiScope}
                  buttonText="Login"
                  onSuccess={this.onGoogleSignIn}
                  onFailure={this.onGoogleSignInFailure} />
              </div>
            : null
          }
      </div>
    );
  }
}

class Main extends React.Component {
  render() {

    const environment_style =
      window.location.hostname === 'console.berlingskemedia.net' ? null :
      // window.location.hostname === 'console.berlingskemedia.net' ? { backgroundColor: 'crimson', borderRadius: '10px', padding: '10px' } :
      window.location.hostname === 'console.berlingskemedia-staging.net' ? { backgroundColor: 'coral', borderRadius: '10px', padding: '10px' } :
      window.location.hostname === 'console.berlingskemedia-testing.net' ? { backgroundColor: 'palegreen', borderRadius: '10px', padding: '10px' } :
      window.location.hostname === 'localhost' ? { backgroundColor: 'aqua', borderRadius: '10px', padding: '10px' } :
      null;

    return (
      <BrowserRouter>
        <div>
          <h1 style={environment_style}>BPC Console</h1>
          <ul className="nav nav-tabs">
            <li role="presentation" className="_active" onClick={this.changemenu}>
              <Link to={`/permissions`}>Permissions</Link>
            </li>
            <li role="presentation" onClick={this.changemenu}>
              <Link to={`/applications`}>Applications</Link>
            </li>
            <li role="presentation" onClick={this.changemenu}>
              <Link to={`/admins`}>BPC Console users</Link>
            </li>
          </ul>
          <Route exact path="/" component={Permissions} />
          <Route path="/permissions" component={Permissions}/>
          <Route exact path="/applications" component={Applications} />
          <Route path="/admins" component={ConsoleUsers}/>
          <Route path={`/applications/:app`} component={Application}/>
          <Route path={`/application/:app`} component={Application}/>
          <Route path={`/gigya`} component={Gigya}/>
          <Route path={`/tools`} component={Tools}/>
        </div>
      </BrowserRouter>
    )
  }
}

ReactDOM.render(
  <ConsoleApp />,
  document.getElementById('content')
);


function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function readTicket(){
  var ticket = readCookie('console_ticket');
  return ticket !== null ? JSON.parse(window.atob(ticket)): null;
}
