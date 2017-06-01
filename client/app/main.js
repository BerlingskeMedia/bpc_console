const $ = require('jquery');
const React = require('react');
const ReactDOM = require('react-dom');
const ReactRouterDom = require('react-router-dom');
const Router = ReactRouterDom.BrowserRouter;
const Route = ReactRouterDom.Route;
const Link = ReactRouterDom.Link;
const Applications = require('./applications');
const Users = require('./users');
const AdminUsers = require('./adminUsers');
const Application = require('./application');
const GoogleLogin = require('react-google-login').default;

// Add the event handler

const gapiClientId = '844384284363-rattdu658pbu53csn5d9hmb65l8ml4gs.apps.googleusercontent.com';
const gapiScope = 'https://www.googleapis.com/auth/plus.login';

class ConsoleApp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      authenticated: false,
      authorized: false,
      missingGrant: false,
      accountInfo: {},
      userprofile: {},
      bpc_env: {}
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
          this.onSignIn(GoogleAuth.currentUser.get());
        }
      }.bind(this));
    }.bind(this));
  }

  componentDidMount() {
    $.ajax({
      type: 'GET',
      url: '/bpc_env',
    }).done((data, textStatus, jqXHR) => {
      console.log('GET bpc_env', data, textStatus);
      this.setState({ bpc_env: data });
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
    });
  }

  onSignIn(googleUser) {
    console.log('Google login success');
    // Useful data for your client-side scripts:
    var basicProfile = googleUser.getBasicProfile();
    var authResponse = googleUser.getAuthResponse();

    var profile = {
      ID: basicProfile.getId(),
      email: basicProfile.getEmail(),
      id_token: authResponse.id_token,
      access_token: authResponse.access_token,
      provider: 'google'
    };

    this.setState({ authenticated: true, profile: profile });

    this.getRsvp(profile).then(function(rsvp){
      console.log('getRsvp', rsvp);
      this.getUserTicket(rsvp);
    }.bind(this));
  }

  onSignInFailure(err) {
    console.log('Google Sign in error', err);
  }

  getRsvp(params) {

    var rsvpParams = Object.keys(params).map(function(k){
      return k.concat('=', params[k]);
    }).join('&');

    var url = this.state.bpc_env.href.concat('rsvp?app=', this.state.bpc_env.app_id, '&', rsvpParams)

    return $.ajax({
      type: 'GET',
      url: url
    }).done((data, textStatus, jqXHR) => {
      console.log('GET rsvp', data, textStatus);
    }).fail((jqXHR, textStatus, errorThrown) => {
      this.setState({ authorized: false, missingGrant: true });
      console.error(jqXHR.responseText);
    });
  }

  getUserTicket(rsvp){
    return $.ajax({
      type: 'POST',
      url: '/tickets',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({rsvp: rsvp})
    }).done((data, textStatus, jqXHR) => {
      console.log('POST tickets success', data, textStatus);
      this.setState({ authorized: true});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({ authorized: false });
    });
  }

  refreshUserTicket() {
    return $.ajax({
      type: 'GET',
      url: '/tickets',
      contentType: 'application/json; charset=utf-8'
    }).done((data, textStatus, jqXHR) => {
      console.log('GET tickets success', data, textStatus);
      this.setState({ authorized: true});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({ authorized: false });
    });
  }

  deleteUserTicket(){
    return $.ajax({
      type: 'DELETE',
      url: '/tickets'
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
                {this.state.missingGrant === true ? <p>Du har ikke de fornødne rettigheder</p> : null }
              </div>
            : <div>
                <GoogleLogin
                  clientId={gapiClientId}
                  scope={gapiScope}
                  buttonText="Login"
                  onSuccess={this.onSignIn}
                  onFailure={this.onSignInFailure} />
              </div>
          }
      </div>
    );
  }
}

class Main extends React.Component {
  render() {
    return (
      <Router>
        <div>
          <h1>BPC Console</h1>
          <ul className="nav nav-tabs">
            <li role="presentation" className="_active" onClick={this.changemenu}>
              <Link to={`/applications`}>Applications</Link>
            </li>
            <li role="presentation" onClick={this.changemenu}>
              <Link to={`/users`}>Users</Link>
            </li>
            <li role="presentation" onClick={this.changemenu}>
              <Link to={`/admins`}>Console users</Link>
            </li>
          </ul>
          <Route exact path="/" component={Applications}/>
          <Route path="/applications" component={Applications}/>
          <Route path="/users" component={Users}/>
          <Route path="/admins" component={AdminUsers}/>
          <Route path={`/application/:app`} component={Application}/>
        </div>
      </Router>
    )
  }
}

ReactDOM.render(
  <ConsoleApp />,
  document.getElementById('content')
);
