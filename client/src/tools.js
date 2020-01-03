const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;
const Bpc = require('./components/bpc');

module.exports = class extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <div className="consoleTools">
        <h1>Tools</h1>
        <p>These tools are helpful when learning BPC or debugging tickets.</p>
        <GetGoogleRsvp />
        <GenerateHawkAuthHeader />
        <ParseHawkAuthHeader />
        <ParseTicketID />
        <ParseBase64Cookie />
      </div>
    );
  }
};

class ParseBase64Cookie extends React.Component {
  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.state = {
      result: null,
      error: null
    };
  }

  onChange(e) {
    const value = e.target.value;
    if(value.length > 0) {
      
      this.parseCookie(value)
      .then(data => {
        this.setState({result: data, error: null});
      })
      .catch(err => {
        this.setState({result: null, error: err});
      });

    } else {
      this.setState({result: null, error: null});
    }
  }

  parseCookie(value){
    try {
      const decodedTicket = window.atob(value);
      const parsedTicket = JSON.parse(decodedTicket);
      return Promise.resolve(parsedTicket);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  render() {

    return (
      <div style={{margin: '60px 0px'}}>
        <hr />
        <h3>Parse base64 cookie</h3>
        <textarea
          className="form-control"
          rows="8"
          cols="50"
          style={{fontFamily:"monospace", fontSize: "0.9em"}}
          onChange={this.onChange}
          placeholder="Paste base64 cookie">
        </textarea>

        <div style={{ marginTop: '5px' }}>        
          { this.state.result
            ? <pre>{ JSON.stringify(this.state.result, null, 2) }</pre>
            : null
          }

          { this.state.error
            ? <div>Error: {this.state.error.message}</div>
            : null
          }
        </div>

        <div className="bg-info">
          <small style={{ paddingLeft: '5px' }}>
            <em>Note: </em>
            Parsing a base64 cookie will work with cookies from other BPC instances.
          </small>
        </div>
      </div>
    );
  }
}

class ParseTicketID extends React.Component {
  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.state = {
      result: null,
      error: null
    };
  }

  onChange(e) {
    const value = e.target.value;
    if(value.length > 0) {

      this.parseRequest(value)
      .then(data => {
        this.setState({result: data, error: null});
      })
      .catch(err => {
        this.setState({result: null, error: err});
      });

    } else {
      this.setState({result: null, error: null});
    }
  }

  parseRequest(ticketId){
    const payload = {
      id: ticketId
    };
    return Bpc.request('/parse', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  render() {

    return (
      <div style={{margin: '60px 0px'}}>
        <hr />
        <h3>Parse BPC Ticket ID</h3>
        <textarea
          className="form-control"
          rows="8"
          cols="50"
          style={{fontFamily:"monospace", fontSize: "0.9em"}}
          onChange={this.onChange}
          placeholder="Paste ticket ID eg. Fe26.2**2f387bfa86a67ffbc8b6Ng2ZPLqB24">
        </textarea>

        <div style={{ marginTop: '5px' }}>        
          { this.state.result
            ? <pre>{ JSON.stringify(this.state.result, null, 2) }</pre>
            : null
          }

          { this.state.error
            ? <div>Error: {this.state.error.message}</div>
            : null
          }
        </div>

        <div className="bg-info">
          <small style={{ paddingLeft: '5px' }}>
            <em>Note: </em>
            Parsing a ticket ID must be from the this instance of BPC.
          </small>
        </div>
      </div>
    );
  }
}


class GenerateHawkAuthHeader extends React.Component {
  constructor(props){
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.generateHawkAuthHeader = this.generateHawkAuthHeader.bind(this);
    this.state = {
      result: null,
      error: null
    };
    
    this.setUriInputRef = element => {
      this.uri = element;
    };

    this.setMethodInputRef = element => {
      this.method = element;
    };
    
    this.setIdInputRef = element => {
      this.id = element;
    };
    
    this.setKeyInputRef = element => {
      this.key = element;
    };
    
    this.setAppInputRef = element => {
      this.app = element;
    };
  }

  handleSubmit(e) {
    e.preventDefault();
    this.onChange();
  }

  onChange(e) {
    e.preventDefault();
    this.generateHawkAuthHeader();
  }

  generateHawkAuthHeader() {
    
    const uri = this.uri.value;
    const method = this.method.value || 'GET';
    const id = this.id.value;
    const key = this.key.value;
    const app = this.app.value;

    
    if(uri && method && id && key) {
      
      const options = { credentials: { id, key, algorithm: 'sha256' }, app };

      try {
        const result = hawk.client.header(uri, method, options);
        this.setState({ result: result, error: null });
      } catch (ex) {
        this.setState({ result: null, error: ex });
      }
    } else {
      this.setState({ result: null, error: null });
    }
  }

  render() {

    return (
      <div style={{margin: '60px 0px'}}>
        <hr />
        <h3>Generate Hawk Authorization header</h3>
        <form onSubmit={this.handleSubmit}>
          <div className="form-group" style={{ marginLeft: '25px' }}>
            <label>URI</label>
            <input type="text" className="form-control" ref={this.setUriInputRef} onChange={this.onChange} />
            <label>Method</label>
            <input type="text" className="form-control" ref={this.setMethodInputRef} onChange={this.onChange} placeholder="GET" />
            <label>ID</label>
            <input type="text" className="form-control" ref={this.setIdInputRef} onChange={this.onChange} placeholder="Application ID or Ticket ID" />
            <label>Key</label>
            <input type="text" className="form-control" ref={this.setKeyInputRef} onChange={this.onChange} />
            <label>App</label>
            <input type="text" className="form-control" ref={this.setAppInputRef} onChange={this.onChange} placeholder="Only needed when using Ticket ID above" />
            <label>Algoritm</label>
            <input type="text" className="form-control" placeholder="sha256" disabled="disabled" />
          </div>
        </form>

        <div style={{ marginTop: '5px' }}>        
          { this.state.result
            ? <pre>{ this.state.result.header }</pre>
            : null
          }

          { this.state.error
            ? <div>Error: {this.state.error.message}</div>
            : null
          }
        </div>

        <div className="bg-info">
          <small style={{ paddingLeft: '5px' }}>
            <em>Note: </em>
            The Hawk Authorization header is generated only from the ID and key above.
            It is therefore not tied to this specific instance of BPC.
          </small>
        </div>
      </div>
    );
  }
}


class ParseHawkAuthHeader extends React.Component {
  constructor(props){
    super(props);
    this.onChange = this.onChange.bind(this);
    this.state = {
      result: null,
      error: null
    };
  }

  onChange(e) {
    const value = e.target.value;
    if(value.length > 0) {
      this.parseRequest(value);
    } else {
      this.setState({result: null, error: null});
    }
  }

  parseRequest(header){
    const payload = {
      authorization: header
    };
    return Bpc.request('/parse', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then(data => {
      this.setState({result: data, error: null});
    })
    .catch(err => {
      this.setState({result: null, error: err});
    });
  }

  render() {

    return (
      <div style={{margin: '60px 0px'}}>
        <hr />
        <h3>Parse Hawk Authorization header</h3>
        <textarea
          className="form-control"
          rows="6"
          cols="55"
          style={{fontFamily:"monospace", fontSize: "0.9em"}}
          onChange={this.onChange}
          placeholder="Paste Hawk Authorization header eg. Hawk id='Fe26.2**...LqB24', ts='1578055320', nonce='Kz0cSz', mac='+CHqerG3JJC7LI=', app='someapp'">
        </textarea>

        <div style={{ marginTop: '5px' }}>
          { this.state.result
            ? <pre>{ JSON.stringify(this.state.result, null, 2) }</pre>
            : null
          }

          { this.state.error
            ? <div>Error: {this.state.error.message}</div>
            : null
          }
        </div>

        <div className="bg-info">
          <small style={{ paddingLeft: '5px' }}>
            <em>Note: </em>
            Parsing Hawk Authorization header must be from the this instance of BPC.
          </small>
        </div>
      </div>
    );
  }
}


class GetGoogleRsvp extends React.Component {
  constructor(props){
    super(props);
    this.getRsvp = this.getRsvp.bind(this);
    this.input = React.createRef();
    this.state = {
      payload: null
    };
  }

  getRsvp() {
    const auth = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();
    const payload = {
      id_token: auth.id_token,
      access_token: auth.access_token,
      app: this.input.current.value
    };
    this.setState({ payload });
  }

  render() {

    return (
      <div style={{margin: '60px 0px'}}>
        <hr />
        <h3>Generate payload for /rsvp (for Google apps)</h3>
        <input type="text" className="form-control" placeholder="Insert app ID" ref={this.input} />
        <button type="button" className="btn btn-default btn-sm" onClick={this.getRsvp}>Get RSVP</button>
        
        { this.state.payload
          ? <pre>{ JSON.stringify(this.state.payload, null, 2) }</pre>
          : null
        }

        <div className="bg-info" style={{ marginTop: '5px' }}>
          <small style={{ paddingLeft: '5px' }}>
            <em>Note: </em>
            The rsvp only works with Google apps.
          </small>
        </div>
      </div>
    );
  }
}