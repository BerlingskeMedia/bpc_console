import React from "react";
import {Link} from "react-router-dom";
import * as Bpc from "../components/bpc";

export default class CompanyPlaninstancesUser extends React.Component {
    constructor(props) {
        super(props);
        this.getUserDetails = this.getUserDetails.bind(this);
        this.state = {
            foundUser: null
        };
    }


    getUserDetails() {
        const user = this.props.user;
        if (user && user.uid) {
            const query = `?provider=gigya&id=${encodeURIComponent(user.uid)}`;

            return Bpc.request(`/users${query}`)
                .then(users => {
                    const foundUser = users.length === 1 ? users[0] : null;
                    this.setState({foundUser,});
                });
        }
    }


    componentDidMount() {
        this.getUserDetails();
    }


    render() {
        const user = this.state.foundUser || this.props.user;

        return (
            <tr>
                <td>
                    <Link to={`/users?search=${user.id || user.uid}`}>{user.email || user.id || user.uid}</Link>
                </td>
                <td>
                    <div style={{textAlign: 'right'}}>
                        <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeUser}
                                style={{minWidth: '30px'}}>
                            <span className='glyphicon glyphicon-trash' aria-hidden="true"></span> <span>Remove</span>
                        </button>
                    </div>
                </td>
            </tr>
        );
    }
}
