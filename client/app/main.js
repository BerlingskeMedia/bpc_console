var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var Applications = require('./applications');
var Application = require('./application');
var Users = require('./users');
var AdminUsers = require('./adminUsers');
var GoogleLogin = require('react-google-login').default;

// Add the event handler

const gapiClientId = '844384284363-rattdu658pbu53csn5d9hmb65l8ml4gs.apps.googleusercontent.com';
const gapiScope = 'https://www.googleapis.com/auth/plus.login';

class ConsoleApp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      authenticated: false,
      authorized: false,
      accountInfo: {},
      userprofile: {},
      selectedAppId: null,
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
      success: [
        function(bpc_env, status, jqXHR) {
          console.log('GET bpc_env', bpc_env, status);
          this.setState({ bpc_env: bpc_env });
        }.bind(this)
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }.bind(this)
    });
  }

  onSignIn (googleUser) {
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

    this.getRsvp(profile, function(rsvp){
      console.log('getRsvp', rsvp);
      this.getUserTicket(rsvp, function(date){
      }.bind(this));
    }.bind(this));
  }

  onSignInFailure (err) {
    console.log('Google Sign in error', err);
  }

  getRsvp (params, callback) {

    var rsvpParams = Object.keys(params).map(function(k){
      return k.concat('=', params[k]);
    }).join('&');

    var url = this.state.bpc_env.href.concat('rsvp?app=', this.state.bpc_env.app_id, '&', rsvpParams)

    return $.ajax({
      type: 'GET',
      url: url,
      success: [
        function(userTicket, status, jqXHR) {
          console.log('GET rsvp', userTicket, status);
        }.bind(this),
        callback
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
        this.setState({ authorized: false });
      }.bind(this)
    });
  }

  getUserTicket (rsvp, callback){
    return $.ajax({
      type: 'POST',
      url: '/tickets',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({rsvp: rsvp}),
      success: [
        function(userTicket, status, jqXHR) {
          console.log('POST tickets success', userTicket, status);
          this.setState({ authorized: true});
        }.bind(this),
        callback
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
        this.setState({ authorized: false });
      }.bind(this)
    });
  }

  refreshUserTicket() {
    return $.ajax({
      type: 'GET',
      url: '/tickets',
      contentType: 'application/json; charset=utf-8',
      success: [
        function(userTicket, status, jqXHR) {
          console.log('GET tickets success', userTicket, status);
          this.setState({ authorized: true});
        }.bind(this)
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
        this.setState({ authorized: false });
      }.bind(this)
    });
  }

  deleteUserTicket(callback){
    return $.ajax({
      type: 'DELETE',
      url: '/tickets',
      success: [
        function(data, status, jqXHR) {
          console.log('DELETE signout success', data, status);
          this.setState({ authenticated: false, authorized: false});
        }.bind(this),
        callback
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
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

  setSearchParameter (key, value) {
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

  selectApplication(id){
    console.log('selectApplication', id);
    this.setState({ selectedAppId: id });
  }

  closeApplication(){
    console.log('closeApplication');
    this.setState({ selectedAppId: null });
  }

  showLoginScreen() {
    gigya.accounts.showScreenSet({screenSet:'Default-RegistrationLogin'});
  }

  render() {

    var bpc_env = <div>
                    <small>Using BPC on <em>{this.state.bpc_env.href}</em></small>
                  </div>;

    return (
      <div className="container">

        <h1>BPC Console</h1>

        {bpc_env}

        {!this.state.authenticated
          ? <GoogleLogin
          clientId={gapiClientId}
          scope={gapiScope}
          buttonText="Login"
          onSuccess={this.onSignIn}
          onFailure={this.onSignInFailure}
          /> : <div></div>}

        <br />

        {this.state.authorized === false
          ? <div>
              <p>Du har ikke de fornødne rettigheder</p>
            </div>
          : null
        }


        {this.state.authorized === true
          ? <div>
              {this.state.selectedAppId === null
                ? <div>
                    <Applications selectApplication={this.selectApplication} />
                    <AdminUsers />
                    <Users />
                  </div>
                : <Application app={this.state.selectedAppId} closeApplication={this.closeApplication} />
              }

            </div>
          : null
        }

      </div>
    );
  }
}

ReactDOM.render(
  <ConsoleApp />,
  document.getElementById('content')
);
