import React from "react";
import CompanyPlaninstancesUser from "./companyPlaninstancesUser";

export default class CompanyPlaninstancesUsers extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        if (!this.props.users || !this.props.users instanceof Array) {
            return null;
        }

        const _users = this.props.users || [];
        const users = _users.map((user) => {
            return <CompanyPlaninstancesUser key={user.uid} user={user}
                                             removeUser={this.props.removeUser.bind(this, user)}/>;
        });
        return (
            <table className="table table-striped">
                <tbody>
                {users}
                </tbody>
            </table>
        );
    }
}
