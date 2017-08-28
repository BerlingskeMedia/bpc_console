const $ = require('jquery');
const React = require('react');
const Link = require('react-router-dom').Link;

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        <h3>Gigya tools</h3>
        <CreateUser />
      </div>
    );
  }
};

class CreateUser extends React.Component {

  constructor(props) {
    super(props);
    this.state = {email: '', password: ''};
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  onChange(e) {
    var temp = {};
    temp[e.target.id] = e.target.value;
    this.setState(temp);
  }


  handleSubmit(e) {
    e.preventDefault();
    if (this.state.email !== '' && this.state.password !== '') {

      var user = {
        email: this.state.email,
        password: this.state.password,
        data: {
          terms: true
        }
      };

      return $.ajax({
        type: 'POST',
        url: '/admin/users/register',
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(user),
        success: function(data, status){
          this.setState({email: '', password: ''});
          console.log(data)
        }.bind(this),
        error: function(jqXHR, textStatus, err) {
          console.error(jqXHR.responseText);
        }
      });
    }
  }

  render() {
    return (
      <div>
        <form style={{paddingTop: '30px', paddingBottom: '30px'}} onSubmit={this.handleSubmit}>
          <h4>Create new user</h4>
          <div className="form-group">
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="Email"
              value={this.state.email}
              onChange={this.onChange} />
          </div>
          <div className="form-group">
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Password"
              value={this.state.password}
              onChange={this.onChange} />
          </div>
          <button type="submit" className="btn btn-default">Create</button>
        </form>
      </div>
    );
  }
}
