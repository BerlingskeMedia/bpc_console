import React from 'react';
import { Link } from 'react-router-dom';
import CompanyOverview from './companyOverview';
import CompanyIDsAndDates from './companyIDsAndDates';
import CompanyNote from './companyNote';
import CompanyIpAccessGlobal from './companyIpAccessGlobal';
import CompanyIpAccessScope from './companyIpAccessScope';
import CompanyUsers from './companyUsers';
import CompanyPlaninstances from './companyPlaninstances';
import { validateIpv4 } from '../validators/validateIp';
import { validateEmailmask } from '../validators/email';
import * as ArrayItems from '../components/arrayItems';
import * as Bpp from "../components/bpp";

export default class Company extends React.Component {
    constructor(props) {
        super(props);
        this.getCompany = this.getCompany.bind(this);
        this.saveCompany = this.saveCompany.bind(this);
        this.showCompanyDetails = this.showCompanyDetails.bind(this);
        this.showHideCompanyDetails = this.showHideCompanyDetails.bind(this);
        this.addCompanyNote = this.addCompanyNote.bind(this);
        this.saveCompanyNote = this.saveCompanyNote.bind(this);
        this.addUser = this.addUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.addIp = this.addIp.bind(this);
        this.removeIp = this.removeIp.bind(this);
        this.addEmailmask = this.addEmailmask.bind(this);
        this.removeEmailmask = this.removeEmailmask.bind(this);
        this.removeScopesIp = this.removeScopesIp.bind(this);
        this.addScopeToIp = this.addScopeToIp.bind(this);

        this.state = {
            company: null,
            showDetails: false,
            showLoader: false
        };
    }

    addCompanyNote(note) {
        let company = Object.assign({}, this.state.company);
        company.note = note;
        this.setState({company});
    }

    saveCompanyNote(e) {
        return this.saveCompany(this.state.company);
    }

    addUser(foundUser) {
        return this.updateUser({add: {uid: foundUser.id}});
    }

    removeUser(user) {
        return this.updateUser({remove: {uid: user.uid || user.id}});
    }

    updateUser(payload) {
        const id = this.props.company._id;
        return Bpp.request(`/api/companies/${id}/users`, {
            method: 'POST',
            body: JSON.stringify(payload)
        }).then((company) => this.setState({company}));
    }

    validateIp(value) {
        return Promise.resolve(validateIpv4(value))
    }

    validateEmailmask(value) {
        return Promise.resolve(validateEmailmask(value))
    }

    addIp(value) {
        let newCompany = Object.assign({}, this.state.company);
        newCompany.ipFilter = newCompany.ipFilter || [];
        newCompany.ipFilter.push(value);
        return this.saveCompany(newCompany);
    }

    removeIp(item) {
        let newCompany = Object.assign({}, this.state.company);
        const index = newCompany.ipFilter.findIndex(i => i === item);
        newCompany.ipFilter.splice(index, 1);
        return this.saveCompany(newCompany);
    }

    addScopeToIp(value) {
        const newCompany = Object.assign({}, this.state.company);
        newCompany.ipAccessScopes = newCompany.ipAccessScopes || [];
        newCompany.ipAccessScopes.push(value);

        return this.saveCompany(newCompany);
    }

    removeScopesIp(item) {
        const newCompany = Object.assign({}, this.state.company);
        const index = newCompany.ipAccessScopes.findIndex(i => i.ip === item.ip);
        newCompany.ipAccessScopes.splice(index, 1);
        return this.saveCompany(newCompany);
    }

    addEmailmask(value) {
        let newCompany = Object.assign({}, this.state.company);
        newCompany.emailMasks = newCompany.emailMasks || [];
        newCompany.emailMasks.push(value);
        return this.saveCompany(newCompany);
    }


    removeEmailmask(item) {
        let newCompany = Object.assign({}, this.state.company);
        const index = newCompany.emailMasks.findIndex(i => i === item);
        newCompany.emailMasks.splice(index, 1);
        return this.saveCompany(newCompany);
    }


    getCompany() {
        const id = this.props.company._id;
        return Bpp.request(`/api/companies/${id}`)
            .then(company => {
                this.setState({company})
                return Promise.resolve(company);
            });
    }


    saveCompany(company) {
        const id = this.props.company._id;
        return Bpp.request(`/api/companies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(company)
        })
            .then((response) => this.setState({
                company: response,
            }))
            .catch((err) => {
                alert('Error when saving!');
                this.getCompany();
            });
    }


    showCompanyDetails() {
        this.setState({showLoader: true}, () => {
            this.getCompany()
                .then(() => this.setState({
                    showDetails: true,
                    showLoader: false
                }));
        });
    }

    showHideCompanyDetails() {
        if (this.state.showDetails) {
            this.setState({showDetails: false});
        } else {
            this.showCompanyDetails();
        }
    }


    componentDidMount() {
        if (this.props.autoLoadDetails) {
            this.showCompanyDetails();
        }
    }

    reduceAccessRules(data) {
        // Reducing to unique accessRules (Aria sends a long list of duplicated accessRule)
        return data.reduce((acc, cur) => {
            const a = acc || [];
            const temp = a.findIndex(existing => {
                return cur.accessFeature === existing.accessFeature && cur.eligibleForSharing === existing.eligibleForSharing && cur.titleDomain === existing.titleDomain;
            });
            if (temp === -1) {
                a.push(cur);
            }
            return a;
        }, [])
    }

    render() {
        const company = this.state.company || this.props.company;
        const accessRules = this.reduceAccessRules(company.accessRules || []);
        const possibleTitleDomainScopes = accessRules.filter((rule) => rule.accessFeature === 'WEB/APP').map((rule) => rule.titleDomain);

        const userLink = company.ariaAccountID ?
            <Link to={`/users?search=${company.ariaAccountID}`}>{company.ariaAccountID}</Link> : null;

        return (
            <div style={{paddingBottom: '4px'}}>
                <div className="row">
                    <div className="col-xs-4">
                        <div className="text-wrap" style={{textDecorationLine: ''}}>
                            <h4>
                                <div><small><em>Title</em></small></div>
                                {company.title || ''}
                            </h4>
                            <div>
                                {company.ariaAccountNo
                                    ? <small><span
                                        className="label label-info">ariaAccountNo</span> {company.ariaAccountNo}
                                    </small>
                                    : null
                                }
                            </div>
                            <div>
                                {company.ariaAccountID
                                    ? <small><span className="label label-info">ariaAccountID</span> {userLink}</small>
                                    : null
                                }
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-4">
                        {this.state.showDetails
                            ? null
                            : <CompanyOverview company={company}/>
                        }
                    </div>
                    <div className="col-xs-4" style={{textAlign: 'right'}}>
                        {this.state.showDetails
                            ?
                            <button type="button" className="btn btn-sm btn-info" onClick={this.showHideCompanyDetails}>
                                <span><span className="glyphicon glyphicon-resize-small"
                                            aria-hidden="true"></span> <span>Close</span></span>
                            </button>
                            : <button type="button" className="btn btn-sm btn-default"
                                      onClick={this.showHideCompanyDetails}>
                                <span className="glyphicon glyphicon-resize-full" aria-hidden="true"></span>
                                <span>Open</span>
                            </button>
                        }
                    </div>
                </div>

                {this.state.showDetails
                    ? <div style={{marginTop: '10px', marginBottom: '100px', minHeight: '100px'}}>

                        <CompanyIDsAndDates company={this.state.company}/>

                        <CompanyNote
                            note={this.state.company.note}
                            addCompanyNote={this.addCompanyNote}
                            saveNote={this.saveCompanyNote}/>

                        <CompanyIpAccessGlobal
                            data={accessRules}
                            accessrules={this.props.accessrules}
                        />

                        <CompanyIpAccessScope
                            data={this.state.company.ipAccessScopes}
                            scopes={possibleTitleDomainScopes}
                            label="IP access for brands"
                            note="Accepts single IPs and CIDR. All matched IPs will give access to specific brands"
                            removeItem={this.removeScopesIp}
                            addItem={this.addScopeToIp}
                        />

                        <ArrayItems
                            data={this.state.company.ipFilter}
                            label="Global IP filter"
                            note="Accepts single IPs and CIDR. All matched IPs will give access to all brands"
                            removeItem={this.removeIp}
                            addItem={this.addIp}
                            validateItem={this.validateIp}/>

                        <CompanyUsers
                            users={this.state.company.users}
                            label="Users"
                            note="Users that receive access according to all the access rules above."
                            removeUser={this.removeUser}
                            addUser={this.addUser}/>

                        <ArrayItems
                            data={this.state.company.emailMasks}
                            label="Email Masks"
                            note="Email Masks that receive access according to all the access rules above."
                            addItem={this.addEmailmask}
                            removeItem={this.removeEmailmask}
                            validateItem={this.validateEmailmask}/>

                        <CompanyPlaninstances
                            ariaAccountNo={company.ariaAccountNo}
                            accessrules={this.props.accessrules}/>

                    </div>
                    : null
                }
                <hr/>
            </div>
        );
    }
}
