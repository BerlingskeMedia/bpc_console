const $ = require('jquery');
const React = require('react');

module.exports = class extends React.Component {

  constructor(props){
    super(props);
    this.onChangeState = this.onChangeState.bind(this);
    this.addRole = this.addRole.bind(this);
    this.removeRole = this.removeRole.bind(this);
    this.state = {
      newRole: '',
    };
  }

  addRole(e) {
    e.preventDefault();
    
    let application = Object.assign({}, this.props.application);
    const newScope = `role:${application.id}:${this.state.newRole}`;
    if (application.scope.indexOf(newScope) > -1) {
      return;
    }
    
    application.scope.push(newScope);
    
    this.props.updateApplication(application)
    .done((data, textStatus, jqXHR) => {
      this.setState({newRole: ''});
    }).fail((jqXHR, textStatus, errorThrown) => {
    });
  }

  removeRole(scope) {
    let application = Object.assign({}, this.props.application);
    application.scope.splice(application.scope.indexOf(scope), 1);

    this.props.updateApplication(application)
    .done((data, textStatus, jqXHR) => {
      this.setState({newRole: ''});
    }).fail((jqXHR, textStatus, errorThrown) => {
    });
  }

  onChangeState(e) {
    var temp = {};
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    temp[e.target.name] = value;
    this.setState(temp);
  }

  componentDidMount() {
  }

  render() {
    
    const application = this.props.application;
    const rolePrefix = `role:${application.id}:`;

    const roleList = application
      ? application.scope.filter(r => r.indexOf(rolePrefix) === 0)
        .map((s, i) => {

          const roleSuffix = s.substring(rolePrefix.length);

          return (
            <li key={i} style={{marginBottom: '2px'}}>
              <button type="button" className="btn btn-danger btn-xs" onClick={this.removeRole.bind(this, s)}>Remove role</button>
              &nbsp;
              <span>{roleSuffix}</span>
            </li>
          );
        })
      : [];

    return (
      <div>
        <h3>Roles</h3>
        <div>
          A role is a special scope, that can be used by the application to activate features.
          A roles must be added to a grant to be effective.
          The scope will be safely available only on tickets on this application.
        </div>
        <div>Note: A role cannot be removed if a grant has the role.</div>
        <form style={{paddingTop: '30px', paddingBottom: '30px'}}>
          <div className="form-group">
            <input
              type="text"
              name="newRole"
              className="form-control"
              placeholder="Type role name"
              value={this.state.newRole}
              onChange={this.onChangeState} />
          </div>
          <button type="submit" className="btn btn-default" onClick={this.addRole} disabled={this.state.newRole.length < 2}>Add role</button>
          <span className="savedSuccessMessage" style={{color: '#008000', verticalAlign: 'middle', marginLeft: '10px', display: 'none'}}>Saved successully</span>
        </form>
        <ul className="list-unstyled">
          {roleList}
        </ul>
        {roleList === null || roleList.length === 0
          ? <div>This app has no roles.</div>
          : null
        }
      </div>
    );
  }
}