import React from 'react';

export class IpAccessScopeItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const data = this.props.data || {};

        return (
            <tr key={data.ip}>
                <td>{data.ip}</td>
                <td>{data.scopes.join(', ')}</td>
                <td style={{textAlign: 'right'}}>
                    <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeItem}
                            style={{minWidth: '90px'}}>
                        <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
                    </button>
                </td>
            </tr>
        );
    }
}
