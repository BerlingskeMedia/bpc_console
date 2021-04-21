import React from 'react';

export default class CompanyOverview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.company) {
      return null;
    }

    const ipFilter = this.props.company.ipFilter || [];
    const ipFilterCount = this.props.company.ipFilterCount || ipFilter.length;

    const users = this.props.company.users || [];
    const userCount = this.props.company.userCount || users.length;

    const planinstances = this.props.company.planinstances || [];
    const planinstanceCount = this.props.company.planinstanceCount || planinstances.length;

    return (
        <div>
          <div style={{paddingLeft: '4px'}}>
            <em><small>Note: {this.props.company.note || ''}</small></em>
          </div>
          <div style={{paddingLeft: '4px'}}>
            <em><small>IP count: {ipFilterCount}</small></em>
          </div>
          <div style={{paddingLeft: '4px'}}>
            <em><small>User count: {userCount}</small></em>
          </div>
          <div style={{paddingLeft: '4px'}}>
            <em><small>Plan instances: {planinstanceCount}</small></em>
          </div>
        </div>
    );
  }
}
