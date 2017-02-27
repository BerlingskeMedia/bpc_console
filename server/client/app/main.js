var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var Applications = require('./applications');
var Application = require('./application');
var Users = require('./users');
var AdminUsers = require('./adminUsers');

// Add the event handler


var ConsoleApp = React.createClass({
  getInitialState: function() {
    return {
      loggedIn: false,
      authenticated: false,
      accountInfo: {},
      userprofile: {},
      selectedAppId: null
    };
  },
  componentWillMount: function() {
  },
  componentDidMount: function() {

    gapi.signin2.render('g-signin2', {
      'scope': 'https://www.googleapis.com/auth/plus.login',
      'width': 200,
      'height': 50,
      'longtitle': true,
      'theme': 'dark',
      'onsuccess': this.onSignIn
    });

    // gigya.accounts.addEventHandlers({ onLogin: this.onLoginEventHandler});
    // gigya.accounts.addEventHandlers({ onLogout: this.onLogoutEventHandler});
    //
    // gigya.accounts.getAccountInfo({
    //   callback: function(response){
    //     console.log('accounts.getAccountInfo', response);
    //     if (response.status === 'OK') {
    //
    //       this.setState({ loggedIn: true, accountInfo: response });
    //
    //       this.getRsvp({ uid: response.UID, email: response.profile.email, provider: 'gigya' }, function(rsvp){
    //         console.log('getRsvp', rsvp);
    //         this.getUserTicket(rsvp, function(date){
    //         }.bind(this));
    //       }.bind(this));
    //
    //     } else if (response.status === 'FAIL') {
    //     }
    //   }.bind(this)
    // });
  },
  // onLoginEventHandler: function(response) {
  //   console.log('onLoginEventHandler', response);
  //   this.setState({ loggedIn: true });
  // },
  // onLogoutEventHandler: function(response) {
  //   console.log('onLogoutEventHandler', response);
  //   this.setState({ loggedIn: false });
  // },
  onSignIn: function(googleUser) {
    console.log('Google login success');
    // Useful data for your client-side scripts:
    var basicProfile = googleUser.getBasicProfile();
    var authReponse = googleUser.getAuthResponse();

    var profile = {
      ID: basicProfile.getId(),
      email: basicProfile.getEmail(),
      id_token: authReponse.id_token,
      access_token: authReponse.access_token,
      provider: 'google'
    };

    this.setState({ loggedIn: true, profile: profile });

    this.getRsvp(profile, function(rsvp){
      console.log('getRsvp', rsvp);
      this.getUserTicket(rsvp, function(date){
      }.bind(this));
    }.bind(this));
  },
  getRsvp: function(params, callback) {

    var rsvpParams = Object.keys(params).map(function(k){
      return k.concat('=', params[k]);
    }).join('&');

    $.ajax({
      type: 'GET',
      url: 'http://berlingske-poc-server.local:8085/rsvp?app=console&'.concat(rsvpParams),
      success: [
        function(userTicket, status, jqXHR) {
          console.log('GET rsvp', userTicket, status);
        }.bind(this),
        callback
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }.bind(this)
    });
  },
  getUserTicket: function(rsvp, callback){
    $.ajax({
      type: 'POST',
      url: '/tickets',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({rsvp: rsvp}),
      success: [
        function(userTicket, status, jqXHR) {
          console.log('POST tickets success', userTicket, status);
          this.setState({ authenticated: true, loggedIn: true });
        }.bind(this),
        callback
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
        // The user is logged in, but just not an admin
        this.setState({ insufficientPermissions: true });
        if(jqXHR.status === 403){
          this.setState({ loggedIn: true });
        }
      }.bind(this)
    });
  },
  refreshUserTicket: function(){
    return $.ajax({
      type: 'GET',
      url: '/tickets',
      contentType: 'application/json; charset=utf-8',
      success: [
        function(userTicket, status, jqXHR) {
          console.log('GET tickets success', userTicket, status);
          this.setState({ authenticated: true, loggedIn: true });
        }.bind(this)
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
        // The user is logged in, but just not an admin
        if(jqXHR.status === 403){
          this.setState({ loggedIn: true });
        }
      }.bind(this)
    });
  },
  deleteUserTicket: function(callback){
    $.ajax({
      type: 'DELETE',
      url: '/tickets',
      success: [
        function(data, status, jqXHR) {
          console.log('DELETE signout success', data, status);
          this.setState({ authenticated: false, loggedIn: false });
        }.bind(this),
        callback
      ],
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  },
  getSearchParameter: function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  },
  setSearchParameter: function (key, value) {
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
  },
  selectApplication: function(id){
    console.log('selectApplication', id);
    this.setState({ selectedAppId: id });
  },
  closeApplication: function(){
    console.log('closeApplication');
    this.setState({ selectedAppId: null });
  },
  showLoginScreen: function() {
    gigya.accounts.showScreenSet({screenSet:'Default-RegistrationLogin'});
  },
  render: function() {

    return (
      <div className="container">

        <h1>SSO POC - Oz Admin</h1>

        <div id="g-signin2" className="g-signin2" data-onsuccess={this.onSignIn} data-theme="dark"></div>

        <div>
          {this.state.insufficientPermissions === true
            ? <p>Du har ikke de fornødne rettigheder</p>
            : null
          }
        </div>

        <br />

        {this.state.authenticated === true
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
});

ReactDOM.render(
  <ConsoleApp />,
  document.getElementById('content')
);
