var $ = require('jquery');
var React = require('react');

module.exports = React.createClass({
  getInitialState: function() {
    return {
      validScopes: [],
      grants: []
    };
  },
  getGrants: function() {
    return $.ajax({
      type: 'GET',
      // url: '/admin/grants',
      url: '/admin/applications/'.concat(this.props.app, '/grants'),
      contentType: "application/json; charset=utf-8",
      success: function(data, status){
        this.setState({grants: data});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  },
  createGrant: function(grant) {
    return $.ajax({
      type: 'POST',
      url: '/admin/applications/'.concat(this.props.app, '/grants'),
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant),
      success: function(data, status){
        var grants = this.state.grants;
        grants.push(data);
        this.setState({grants: grants});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  },
  updateGrant: function(grant, index) {
    return $.ajax({
      type: 'PUT',
      // url: '/admin/grants/'.concat(grant.id),
      url: '/admin/applications/'.concat(this.props.app, '/grants/', grant.id),
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(grant),
      success: function(data, status){
        var grants = this.state.grants;
        grants[index] = data;
        this.setState({grants: grants});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  },
  deleteGrant: function(grantId, index) {
    return $.ajax({
      type: 'DELETE',
      url: '/admin/applications/'.concat(this.props.app, '/grants/', grantId),
      success: function(data, status){
        var grants = this.state.grants;
        grants.splice(index, 1);
        this.setState({grants: grants});
      }.bind(this),
      error: function(jqXHR, textStatus, err) {
        console.error(textStatus, err.toString());
      }
    });
  },
  componentDidMount: function() {
    this.getGrants();
  },
  render: function() {

    var grants = this.state.grants.map(function(grant, index) {
      return (
        <Grant
          key={index}
          index={index}
          grant={grant}
          deleteGrant={this.deleteGrant} />
      );
    }.bind(this));

    return (
      <div className="grants">
        <h3>Grants</h3>
        <CreateGrant createGrant={this.createGrant} />
        <br />
        {grants}
      </div>
    );
  }
});

var Grant = React.createClass({
  deleteGrant: function() {
    this.props.deleteGrant(this.props.grant.id, this.props.index);
  },
  render: function() {
    return (
      <div className="row">
        <div className="col-xs-10"><div>{this.props.grant.user}</div></div>
        <div className="col-xs-2">
          <button className="btn btn-default" type="button" onClick={this.deleteGrant}>Delete grant</button>
        </div>
      </div>
    );
  }
});


var CreateGrant = React.createClass({
  getInitialState: function() {
    return {
      app: '',
      user: '',
      scope: []
    };
  },
  onChange: function(e) {
    var temp = {};
    temp[e.target.name] = e.target.value;
    this.setState(temp);
  },
  handleSubmit: function(e) {
    e.preventDefault();
    if (this.state.user !== '') {
      this.props.createGrant({user: this.state.user}).done(function() {
        this.setState({user: ''});
      }.bind(this));
    }
  },
  render: function() {
    return (
      <form style={{paddingTop: '30px', paddingBottom: '30px'}} onSubmit={this.handleSubmit} className="form-inline">
        <input
          type="text"
          name="user"
          className="form-control"
          placeholder="User"
          value={this.state.user}
          onChange={this.onChange} />
        <button type="submit" className="btn btn-default">Add user</button>
      </form>
    );
  }
});
