import React from 'react';

export default class CompanyIpAccessGlobal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const data = this.props.data || [];
    const allAccessRules = this.props.accessrules || [];

    // Mapping each if the company accessRules up against the accessRules in BPP
    const items = data
        .map(accessRule => {
          const matchedAccessRules = allAccessRules.find((a) => {
            return a.accessFeature === accessRule.accessFeature && a.titleDomain === accessRule.titleDomain
          });

          let accessRoles = '';

          if (matchedAccessRules && matchedAccessRules.access) {
            accessRoles = Object.keys(matchedAccessRules.access).map((k, index) => {
              return (<div key={index}>
                <span>{k}:</span> <span>{matchedAccessRules.access[k].join(', ')}</span>
              </div>);
            });
          }

          return (
              <tr key={accessRule.accessFeature + accessRule.titleDomain}>
                <td>{accessRule.accessFeature}</td>
                <td>{accessRule.titleDomain}</td>
                <td>{accessRoles}</td>
                <td style={{textAlign: 'right'}}></td>
              </tr>
          );
        });


    return (
        <div className="row" style={{marginTop: '40px', minHeight: '10px'}}>
          <div className="col-xs-2" style={{textAlign: 'right'}}>
            <strong>Access rules</strong>
            <div><em><small>Access rules for this account are managed in Aria.</small></em></div>
          </div>
          <div className="col-xs-10">
            {items.length > 0
                ? <table className="table table-condensed">
                  <thead>
                  <tr>
                    <th>accessFeature</th>
                    <th>titleDomain</th>
                    <th>Access ( -> BPC)</th>
                    <th></th>
                  </tr>
                  </thead>
                  <tbody>
                  {items}
                  </tbody>
                </table>
                : <div>-</div>
            }
          </div>
        </div>
    );
  }
}
