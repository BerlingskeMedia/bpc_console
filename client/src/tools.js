const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

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
        <ParseHawkAuthHeader />
        <ParseTicketID />
      </div>
    );
  }
};


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
      this.parseRequest(value)
    } else {
      this.setState({result: null, error: null});
    }
  }

  parseRequest(header){
    const payload = {
      authorization: header
    };
    return $.ajax({
      type: 'POST',
      url: `/_b/parse`,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(payload)
    }).done((data, textStatus, jqXHR) => {
      this.setState({result: data, error: null});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({result: null, error: JSON.parse(jqXHR.responseText)});
    });
  }

  render() {



    return (
      <div>
        <h3>Parse Hawk Authorization header</h3>
        <textarea
          className="form-control"
          rows="6"
          cols="50"
          style={{fontFamily:"monospace", fontSize: "0.9em"}}
          onChange={this.onChange}
          placeholder="Insert Hawk Authorization header">
        </textarea>

        {this.state.result !== null && this.state.result.id !== null
          ?
          <div style={{margin: "10px 0px"}}>
            <dl className="dl-horizontal">
              <dt>id</dt>
              <dd style={{wordBreak: "break-word"}}>{this.state.result.id}</dd>
              <dt>key</dt>
              <dd>{this.state.result.key}</dd>
              <dt>algorithm</dt>
              <dd>{this.state.result.algorithm}</dd>
              <dt>exp</dt>
              <dd style={{color: this.state.result.exp < Date.now() ? 'red' : 'inherit'}}>{this.state.result.exp}</dd>
              <dt>app</dt>
              <dd>{this.state.result.app}</dd>
              <dt>scope</dt>
              <dd>{this.state.result.scope.join(', ')}</dd>
              <dt>grant</dt>
              <dd>{this.state.result.grant}</dd>
              <dt>user</dt>
              <dd>{this.state.result.user}</dd>
            </dl>
          </div>
          : null
        }

        {this.state.error !== null ?
          <p>Error: {this.state.error.message}</p>
          : null
        }
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
    } else {
      this.setState({result: null, error: null});
    }
  }

  parseRequest(ticketId){
    const payload = {
      id: ticketId
    };
    return $.ajax({
      type: 'POST',
      url: `/_b/parse`,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(payload)
    }).done((data, textStatus, jqXHR) => {
      this.setState({result: data, error: null});
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.error(jqXHR.responseText);
      this.setState({result: null, error: JSON.parse(jqXHR.responseText)});
    });
  }

  render() {

    return (
      <div>
        <h3>Parse BPC Ticket ID</h3>
        <textarea
          className="form-control"
          rows="6"
          cols="50"
          style={{fontFamily:"monospace", fontSize: "0.9em"}}
          onChange={this.onChange}
          placeholder="Insert BPC Ticket ID">
        </textarea>

        {this.state.result !== null && this.state.result.id !== null
          ?
          <div style={{margin: "10px 0px"}}>
            <dl className="dl-horizontal">
              <dt>id</dt>
              <dd style={{wordBreak: "break-word"}}>{this.state.result.id}</dd>
              <dt>key</dt>
              <dd>{this.state.result.key}</dd>
              <dt>algorithm</dt>
              <dd>{this.state.result.algorithm}</dd>
              <dt>exp</dt>
              <dd style={{color: this.state.result.exp < Date.now() ? 'red' : 'inherit'}}>{this.state.result.exp}</dd>
              <dt>app</dt>
              <dd>{this.state.result.app}</dd>
              <dt>scope</dt>
              <dd>{this.state.result.scope.join(', ')}</dd>
              <dt>grant</dt>
              <dd>{this.state.result.grant}</dd>
              <dt>user</dt>
              <dd>{this.state.result.user}</dd>
            </dl>
          </div>
          : null
        }

        {this.state.error !== null ?
          <p>Error: {this.state.error.message}</p>
          : null
        }
      </div>
    );
  }
}