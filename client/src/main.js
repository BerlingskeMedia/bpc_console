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
const Customers = require('./customers');
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
      unauthorized: false,
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
    return Bpc.authorize()
    .then((ticket) => {
      this.setState({ authorized: true, unauthorized: false });
    })
    .catch((err) => {
      this.setState({ authorized: false, unauthorized: true });
    });
  }

  render() {

    return (
      <div className="container">
          {this.state.authenticated
            ? <div>
                {this.state.authorized === true ? <Main /> : null }
                {this.state.unauthorized === true ? <p>Du har ikke de fornødne rettigheder.</p> : null }
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
      { linkTo: '/customers', label: 'Customers' },
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
      window.location.hostname === 'console.berlingskemedia-staging.net' ? { backgroundColor: 'coral', borderRadius: '10px', padding: '10px' } :
      window.location.hostname === 'console.berlingskemedia-testing.net' ? { backgroundColor: 'palegreen', borderRadius: '10px', padding: '10px' } :
      null;

    return (
      <BrowserRouter>
        <div>
          <h1 style={environment_style}>Permissions Console</h1>
          <MainMenu />
          <Route exact path="/" component={Users} />
          <Route path="/users" component={Users}/>
          <Route exact path="/applications" component={Applications} />
          <Route path="/admins" component={ConsoleUsers}/>
          <Route path={`/applications/:app`} component={Application}/>
          <Route path={`/application/:app`} component={Application}/>
          <Route path={`/companies`} component={Companies}/>
          <Route path={`/customers`} component={Customers}/>
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
