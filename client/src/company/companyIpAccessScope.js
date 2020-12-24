import React from 'react';
import { validateIpv4 } from '../validators/validateIp';
import { IpAccessScopeItem } from './companyIpAccessScopeItem';

export default class CompanyIpAccessScope extends React.Component {
    constructor(props){
        super(props);
        this.onChangeItem = this.onChangeItem.bind(this);
        this.validateInput = this.validateInput.bind(this);
        this.getData = this.getData.bind(this);
        this.cleanForm = this.cleanForm.bind(this);
        this.addIpScope = this.addIpScope.bind(this);
        this.showFullList = this.showFullList.bind(this);

        this.state = {
            hasInput: false,
            inputValid: false,
            showTruncatedList: false
        };
    }

    onChangeItem() {
        if (this.validateInput()) {
            this.setState({ hasInput: true, inputValid: true })
        } else {
            this.setState({ hasInput: false, inputValid: false });
        }
    }

    validateInput() {
        const data  = this.getData();
        return data.ip.length > 0 && validateIpv4(data.ip) && data.scopes.length > 0;
    }

    getData() {
        return {
            ip: this.ipAddressInput.value,
            scopes: [].filter.call(this.scopeInput.options, o => o.selected).map(o => o.value),
        }
    }

    cleanForm() {
        this.ipAddressInput.value = '';
        this.scopeInput.value = '';
    }

    addIpScope() {
        if (this.validateInput()) {
            // Setting inputValid to false to disable the button
            this.setState({ addingItem: true }, () => {
                this.props.addItem(this.getData())
                    .then(() => {
                        this.cleanForm();
                        this.setState({
                            addingItem: false,
                            inputValid: false,
                            hasInput: false
                        });
                    })
                    .catch(() => {
                        this.setState({ addingItem: false });
                    });
            });
        }
    }

    showFullList() {
        this.setState({ showTruncatedList: false });
    }

    componentDidMount() {
        if (this.props.data && this.props.data.length > 5) {
            this.setState({ showTruncatedList: true });
        }
    }

    render() {
        const scopes = this.props.scopes || [];
        let data = this.props.data || [];

        if(this.state.showTruncatedList) {
            data = data.slice(0, 5);
        }

        const ipAccessScopes = data.map((rule) => <IpAccessScopeItem key={rule.ip} data={rule} removeItem={this.props.removeItem} />)
        const inputClassName = this.state.hasInput && !this.state.inputValid ? 'form-group has-error' : 'form-group';

        return (
            <div style={{ marginTop: '40px', minHeight: '10px' }}>
                <div className="row">
                    <div className="col-xs-2" style={{ textAlign: 'right' }}>
                        <strong>{ this.props.label }</strong>
                        <div><em><small>{this.props.note}</small></em></div>
                    </div>
                    <div className="col-xs-10">
                        <table className="table table-condensed">
                            <tbody>
                            { ipAccessScopes }
                            { this.state.showTruncatedList &&
                                <tr key={-1}>
                                    <td colSpan={2}>
                                        <button type="button" className="btn btn-sm btn-link"
                                                style={{marginLeft: '0px', padding: '0px'}} onClick={this.showFullList}>
                                            <span>Show all {this.props.data.length} items </span>
                                        </button>
                                    </td>
                                    <td></td>
                                </tr>
                            }
                            { !this.state.showTruncatedList &&
                                <tr key={-1}>
                                    <td colSpan={2}>
                                        <div className={inputClassName}>
                                            <input
                                                type="text"
                                                name="ipAddressInput"
                                                className="form-control input-sm"
                                                onChange={this.onChangeItem}
                                                ref={(ipAddressInput) => this.ipAddressInput = ipAddressInput}
                                            />
                                            <select
                                                name={"scopeInput"}
                                                className="form-control input-sm"
                                                multiple={true}
                                                onChange={this.onChangeItem}
                                                ref={(scopeInput) => this.scopeInput = scopeInput}
                                            >
                                                <option key={-1} disabled value='N/A'>Select brand title</option>
                                                {scopes.map((scope, index) => { return <option key={index} value={scope}>{scope}</option>; })}
                                            </select>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right'}}>
                                        <button type="button" className='btn btn-xs btn-success' onClick={this.addIpScope} disabled={!this.state.inputValid || this.state.addingItem} style={{ minWidth: '90px' }}>
                                            <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
                                        </button>
                                    </td>
                                </tr>
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}


