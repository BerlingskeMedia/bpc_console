import React from "react";
import CompanyPlaninstancesMasks from "./companyPlaninstancesMasks";
import CompanyPlaninstancesUsers from "./companyPlaninstancesUsers";
import CompanyPlaninstancesAddUser from "./companyPlaninstancesAddUser";
import CompanyPlaninstancesNote from "./companyPlaninstancesNote";
import * as Bpp from "../components/bpp";

export default class CompanyPlaninstance extends React.Component {
    constructor(props) {
        super(props);
        this.savePlaninstance = this.savePlaninstance.bind(this);
        this.updatePlaninstanceState = this.updatePlaninstanceState.bind(this);
        this.addEmailmask = this.addEmailmask.bind(this);
        this.removeEmailmask = this.removeEmailmask.bind(this);
        this.addUser = this.addUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.state = {
            planinstance: null
        };
    }


    addEmailmask(value) {
        let newPlaninstance = Object.assign({}, this.state.planinstance);
        newPlaninstance.emailMasks = newPlaninstance.emailMasks || [];
        newPlaninstance.emailMasks.push(value);
        return this.updatePlaninstanceState(newPlaninstance).then(() => (this.savePlaninstance(this.state.planinstance)));
    }


    removeEmailmask(item) {
        let newPlaninstance = Object.assign({}, this.state.planinstance);
        const index = newPlaninstance.emailMasks.findIndex(i => i === item);
        newPlaninstance.emailMasks.splice(index, 1);
        return this.updatePlaninstanceState(newPlaninstance).then(() => (this.savePlaninstance(this.state.planinstance)));
    }


    updatePlaninstanceState(planinstance) {
        return new Promise((resolve) => {
            return this.setState({planinstance}, resolve);
        });
    }


    addUser(foundUser) {
        return this.updateUser({add: {uid: foundUser.id}});
    }


    removeUser(user) {
        return this.updateUser({remove: {uid: user.uid}});
    }


    updateUser(payload) {
        const id = this.props.id;
        return Bpp.request(`/api/planinstances/${id}/users`, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
            .then((planinstance) => this.setState({planinstance}));
    }


    savePlaninstance(planinstance) {
        const id = this.props.id;
        return Bpp.request(`/api/planinstances/${id}`, {
            method: 'PUT',
            body: JSON.stringify(planinstance)
        })
            .catch((err) => {
                alert('Error when saving!');
            });
    }


    componentDidMount() {
        if (this.props.id) {
            Bpp.request(`/api/planinstances/${this.props.id}`)
                .then(planinstance => this.setState({planinstance}));
        }
    }


    render() {

        if (!this.state.planinstance) {
            return null;
        }

        const planinstance = this.state.planinstance;

        let alerts = [];

        if (!planinstance.titleDomain) {
            alerts.push(<span key={-1} className='glyphicon glyphicon-warning-sign' title="Missing titleDomain"
                              aria-hidden="true"></span>);
        }

        if (!planinstance.services instanceof Array) {
            alerts.push(<span key={-1} className='glyphicon glyphicon-warning-sign' title="No services"
                              aria-hidden="true"></span>);
        }

        const accessRules = this.props.accessrules || [];
        if (planinstance.services instanceof Array) {
            const everyServiceIsInvalid = planinstance.services.every((service) => {
                let isAValidService = false;

                // If the planinstance does not have titleDomain, there's already one warning-sign for this. (See above.)
                // In this case we only need to show an additional warning-sign, if there no generel valid services on the planinstance.
                if (planinstance.titleDomain) {
                    isAValidService = accessRules.some(accessRule => accessRule.titleDomain === planinstance.titleDomain && accessRule.accessFeature === service.accessFeature)
                } else {
                    isAValidService = accessRules.some(accessRule => accessRule.accessFeature === service.accessFeature)
                }

                // Not a valid service
                return !isAValidService;
            });

            if (everyServiceIsInvalid) {
                alerts.push(<span key={-1} className='glyphicon glyphicon-warning-sign' title="No valid services"
                                  aria-hidden="true"></span>);
            }
        }


        return (
            <tr>
                <td>{planinstance.instanceNo}</td>
                <td>
                    <div>{planinstance.planName}</div>
                    <div>{alerts}</div>
                    <div>Activation date: {planinstance.activationDate}</div>
                    <div>Termination date: {planinstance.terminationDate || ''}</div>
                </td>
                <td>
                    <CompanyPlaninstancesNote planinstance={planinstance} savePlaninstance={this.savePlaninstance}/>
                    <CompanyPlaninstancesMasks addEmailmask={this.addEmailmask} removeEmailmask={this.removeEmailmask}
                                               masks={planinstance.emailMasks}/>
                </td>
                <td>{planinstance.units}</td>
                <td>
                    <CompanyPlaninstancesUsers removeUser={this.removeUser} users={planinstance.users}/>
                    <CompanyPlaninstancesAddUser addUser={this.addUser}/>
                </td>
            </tr>
        );
    }
}
