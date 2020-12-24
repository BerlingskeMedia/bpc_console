import React from 'react';
import { Link } from 'react-router-dom';
import * as Bpc from '../components/bpc';

export default class CompanyUser extends React.Component {
    constructor(props) {
        super(props);
        this.getAddedByDetails = this.getAddedByDetails.bind(this);
        this.showAddedByDetails = this.showAddedByDetails.bind(this);
        this.state = {
            foundUser: null,
            addedByUser: null,
            showAddedByDetails: false
        };
    }

    getUserDetails() {
        return Bpc.request(`/users?provider=gigya&id=${encodeURIComponent(this.props.user.uid)}`)
            .then((users) => {
                const foundUser = users.length === 1 ? users[0] : null;
                if (foundUser) {
                    this.setState({foundUser});
                } else {
                    // Waiting on the Gigya webhook
                    setTimeout(() => this.getUserDetails(), 3000);
                }
            });
    }

    showAddedByDetails() {
        this.getAddedByDetails()
            .then(() => this.setState({showAddedByDetails: true}))
    }

    getAddedByDetails() {
        if (this.props.user.addedBy && this.props.user.addedBy.user) {
            return Bpc.request(`/users/${encodeURIComponent(this.props.user.addedBy.user)}`)
                .then(addedByUser => this.setState({addedByUser}));
        } else {
            return Promise.resolve();
        }
    }

    componentDidMount() {
        this.getUserDetails(this.props.user.uid);
    }

    render() {
        let item = <span>{this.props.user.uid}</span>
        const foundUser = this.state.foundUser;

        if (foundUser) {
            item = <Link to={`/users?search=${foundUser.id}`}>{foundUser.email}</Link>
        }

        let addedByDetails = '';
        if (this.state.addedByUser) {
            addedByDetails = this.state.addedByUser.email;
        } else if (this.props.user.addedBy) {
            addedByDetails = this.props.user.addedBy.user || this.props.user.addedBy.system;
        }

        return (
            <tr key={this.props.user.uid}>
                <td>
                    <div style={{marginTop: '3px', marginBottom: '3px'}}>
                        {item}
                        {this.state.showAddedByDetails
                            ? <div>
                                <div><em><small>Added: {this.props.user.addedAt || ''}</small></em></div>
                                <div><em><small>Added by: {addedByDetails}</small></em></div>
                            </div>
                            : <button type="button" className="btn btn-sm btn-link"
                                      style={{marginLeft: '10px', padding: '0px'}}
                                      onClick={this.showAddedByDetails}>Details</button>
                        }
                    </div>
                </td>
                <td style={{textAlign: 'right'}}>
                    <button type="button" className='btn btn-xs btn-danger'
                            onClick={this.props.removeUser.bind(this, this.props.user)} style={{minWidth: '90px'}}>
                        <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
                    </button>
                </td>
            </tr>
        );
    }
}
