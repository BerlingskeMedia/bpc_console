import React from "react";
import CompanyPlaninstance from "./companyPlaninstance";
import * as Bpp from "../components/bpp";

export default class CompanyPlaninstances extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            planinstances: []
        }
    }

    componentDidMount() {
        if (this.props.ariaAccountNo) {
            Bpp.request(`/api/planinstances?ariaAccountNo=${this.props.ariaAccountNo}`)
                .then(planinstances => this.setState({planinstances}));
        }
    }

    render() {
        if (this.state.planinstances.length === 0) {
            return null;
        }

        const planinstances = this.state.planinstances
            // Only show planinstances with status -1 or higher
            .filter(planinstance => planinstance.status > -2)
            .map(planinstance => {
                return (
                    <CompanyPlaninstance
                        key={planinstance._id}
                        id={planinstance._id}
                        accessrules={this.props.accessrules}/>
                );
            });

        return (
            <div className="row" style={{marginTop: '40px', minHeight: '10px'}}>
                <div className="col-xs-2" style={{textAlign: 'right'}}>
                    <strong>Plan instances</strong>
                    <div><em><small>Only showing status -1 or higher</small></em></div>
                </div>
                <div className="col-xs-10">
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>Subscription No</th>
                            <th>Plan</th>
                            <th>Note</th>
                            <th>Units</th>
                            <th>Users</th>
                        </tr>
                        </thead>
                        <tbody>
                        {planinstances}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
