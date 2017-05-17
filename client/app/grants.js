var $ = require('jquery');
var React = require('react');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      validScopes: [],
      grants: []
    };
  }

  getGrants() {
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
  }

  createGrant(grant) {
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
  }

  updateGrant(grant, index) {
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
  }

  deleteGrant(grantId, index) {
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
  }

  componentDidMount() {
    this.getGrants();
  }

  render() {

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
}

class Grant extends React.Component {
  deleteGrant() {
    this.props.deleteGrant(this.props.grant.id, this.props.index);
  }

  render() {
    return (
      <div className="row">
        <div className="col-xs-10"><div>{this.props.grant.user}</div></div>
        <div className="col-xs-2">
          <button className="btn btn-default" type="button" onClick={this.deleteGrant}>Delete grant</button>
        </div>
      </div>
    );
  }
}


class CreateGrant extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      app: '',
      user: '',
      scope: []
    };
  }

  onChange(e) {
    var temp = {};
    temp[e.target.name] = e.target.value;
    this.setState(temp);
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.user !== '') {
      this.props.createGrant({user: this.state.user}).done(function() {
        this.setState({user: ''});
      }.bind(this));
    }
  }

  render() {
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
}
