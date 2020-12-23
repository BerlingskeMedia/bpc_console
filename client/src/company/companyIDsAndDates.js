import React from "react";
import { Link } from "react-router-dom";
import * as Bpc from "../components/bpc";

export default class CompanyIDsAndDates extends React.Component {
    constructor(props) {
        super(props);
        this.retrieveAccountDetailsRequest = this.retrieveAccountDetailsRequest.bind(this);
        this.state = {
            createdByUser: null,
            messageSent: false
        };
    }


    retrieveAccountDetailsRequest() {

        const company = this.props.company;
        const ariaAccountNo = company.ariaAccountNo;

        if (ariaAccountNo) {
            const message = {
                "type": "retrieveAccountDetails",
                ariaAccountNo
            };

            return Bpp.request(`/api/queue/message`, {
                method: 'POST',
                body: JSON.stringify(message)
            }).then(() => this.setState({messageSent: true}))
        }
    }


    componentDidMount() {
        if (this.props.company.createdBy && this.props.company.createdBy.user) {
            Bpc.request(`/users/${encodeURIComponent(this.props.company.createdBy.user)}`)
                .then(createdByUser => this.setState({createdByUser}));
        }
    }


    render() {

        const company = this.props.company;

        const createdTitle = (this.state.createdByUser ? this.state.createdByUser.email : null) || (company.createdBy ? company.createdBy.user : '');
        const created = <span title={createdTitle}>{company.createdAt || '-'}</span>;

        const status = company.status >= 1
            ? <span title={company.status} className="glyphicon glyphicon-ok" style={{color: 'lightgreen'}}
                    aria-hidden="true"></span>
            : <span title={company.status} className="glyphicon glyphicon-minus" style={{color: 'red'}}
                    aria-hidden="true"></span>;

        return (
            <div>
                <div className="row">
                    <div className="col-xs-10 col-xs-offset-2">
                        <table className="table table-condensed">
                            <thead>
                            <tr>
                                <th>Internal ID</th>
                                <th>Created</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td><Link to={`/companies?id=${company._id}`}>{company._id}</Link></td>
                                <td>{created}</td>
                                <td>{status}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {company.ariaAccountNo ?
                    <div className="row">
                        <div className="col-xs-10 col-xs-offset-2">
                            <table className="table table-condensed">
                                <thead>
                                <tr>
                                    <th><small>Last update from ARIA</small></th>
                                    <th style={{textAlign: 'right'}}><small>Request latest contact information from
                                        ARIA</small></th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td><small>{company.lastUpdatedAt || ''}</small></td>
                                    <td style={{textAlign: 'right'}}>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-default"
                                            onClick={this.retrieveAccountDetailsRequest}
                                            disabled={this.state.messageSent}
                                            style={{minWidth: '90px'}}>
                                            <span className='glyphicon glyphicon-send' aria-hidden="true"></span>
                                            <span> </span>
                                            {this.state.messageSent
                                                ? <span>Request sent</span>
                                                : <span>Send request</span>
                                            }
                                        </button>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    : null}
            </div>
        );
    }
}
