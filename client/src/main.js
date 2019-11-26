const $ = require('jquery');
const React = require('react');
const ReactDOM = require('react-dom');
const ReactRouterDom = require('react-router-dom');
const BrowserRouter = ReactRouterDom.BrowserRouter;
const Route = ReactRouterDom.Route;
const Link = ReactRouterDom.Link;
const Redirect = ReactRouterDom.Redirect;
const Applications = require('./applications');
const Users = require('./users');
const ConsoleUsers = require('./consoleUsers');
const Application = require('./application');
const Tools = require('./tools');
const Companies = require('./companies');
const GoogleLogin = require('react-google-login').default;
const Bpc = require('./components/bpc');

// Add the event handler

const gapiClientId = '844384284363-rattdu658pbu53csn5d9hmb65l8ml4gs.apps.googleusercontent.com';
const gapiScope = 'https://www.googleapis.com/auth/plus.login';

class ConsoleApp extends React.Component {

  constructor(props) {
    super(props);
    this.onGoogleSignIn = this.onGoogleSignIn.bind(this);
    this.getUserTicket = this.getUserTicket.bind(this);
    this.state = {
      authenticated: false,
      authenticationNeeded: false,
      authorized: false,
      accountInfo: {},
      userprofile: {}
    };
  }

  componentDidMount() {
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

  onGoogleSignIn(googleUser) {

    this.setState({
      authenticated: true,
      authenticationNeeded: false
    });

    return this.getUserTicket(googleUser);
  }

  onGoogleSignInFailure(err) {
    console.log('Google Sign in error', err);
  }

  getUserTicket(googleUser) {

    var basicProfile = googleUser.getBasicProfile();
    var authResponse = googleUser.getAuthResponse();

    const payload = {
      id_token: authResponse.id_token,
      access_token: authResponse.access_token,
      app: 'console'
    };

    return Bpc.request('/rsvp', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then(rsvp => Bpc.authorize(rsvp))
    .then((ticket) => {
      this.setState({ authorized: true });
    })
    .catch((err) => {
      this.setState({ authorized: false });
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

  render() {

    return (
      <div className="container">
          {this.state.authenticated
            ? <div>
                {this.state.authorized === true ? <Main /> : null }
                {this.state.authorized === false ? <p>Du har ikke de fornødne rettigheder.</p> : null }
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


class MainMenu extends React.Component {

  render() {

    const tabs = [
      { linkTo: '/users', label: 'Users' },
      { linkTo: '/applications', label: 'Applications' },
      { linkTo: '/companies', label: 'Companies' },
      { linkTo: '/admins', label: 'Admins' }
    ].map((tab, index) => {

      return (
        <li role="presentation" key={index}>
          <Link to={ tab.linkTo }>{ tab.label }</Link>
        </li>
      );
    });

    return (
      <ul className="nav nav-tabs">
       { tabs }
      </ul>
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
          <MainMenu />
          <Route exact path="/" component={Users} />
          <Route path="/users" component={Users}/>
          <Route exact path="/applications" component={Applications} />
          <Route path="/admins" component={ConsoleUsers}/>
          <Route path={`/applications/:app`} component={Application}/>
          <Route path={`/application/:app`} component={Application}/>
          <Route path={`/companies`} component={Companies}/>
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
