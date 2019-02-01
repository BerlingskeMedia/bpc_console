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
        <p>These tools are helpful when learning BPC or debugging tickets.</p>
        <ParseTicketID />
        <ParseHawkAuthHeader />
      </div>
    );
  }
};


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

      var parseOperation;
      
      // It's a ticket ID
      if(value.substring(0, 8) === "Fe26.2**") {
        parseOperation = this.parseRequest(value)

        // It's a cookie
      } else {
        parseOperation = this.parseCookie(value)
      }
      
      parseOperation
      .done((data, textStatus, jqXHR) => {
        this.setState({result: data, error: null});
      }).fail((jqXHR, textStatus, errorThrown) => {
        // It could an error from the parseRequest or the parseCookie
        const errorText = jqXHR.responseText ? JSON.parse(jqXHR.responseText) : jqXHR;
        this.setState({result: null, error: errorText});
      });

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
    });
  }

  parseCookie(value){
    var dfd = jQuery.Deferred();
    try {
      const decodedTicket = window.atob(value);
      const parsedTicket = JSON.parse(decodedTicket);
      dfd.resolve(parsedTicket)
    } catch (ex) {
      dfd.reject(ex)
    }
    return dfd.promise();
  }

  render() {

    return (
      <div>
        <h3>Parse BPC Ticket ID or base64 cookie</h3>
        <textarea
          className="form-control"
          rows="8"
          cols="50"
          style={{fontFamily:"monospace", fontSize: "0.9em"}}
          onChange={this.onChange}
          placeholder="Paste ID or cookie">
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
          cols="55"
          style={{fontFamily:"monospace", fontSize: "0.9em"}}
          onChange={this.onChange}
          placeholder="Paste Hawk Authorization header">
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
      </div>
    );
  }
}