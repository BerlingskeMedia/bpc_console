import React from 'react';
import { validateEmailmask } from '../validators/email';

export default class CompanyPlaninstancesMasks extends React.Component {
    constructor(props) {
        super(props);
        this.validateEmailmask = this.validateEmailmask.bind(this);
        this.addEmailmask = this.addEmailmask.bind(this);
        this.onChangeAddMask = this.onChangeAddMask.bind(this);
        this.state = {
            validMask: null,
            userInput: false,
            maskTimer: null
        };
    }

    onChangeAddMask() {
        this.setState({userInput: true});

        clearTimeout(this.state.maskTimer);
        this.setState({maskTimer: setTimeout(this.validateEmailmask(this.addMaskInput.value), 2000)});
    }

    validateEmailmask(value) {
        const validMask = validateEmailmask(value);
        this.setState({ validMask });
        return validMask;
    }

    addEmailmask() {
        const input = this.addMaskInput.value;
        if (this.validateEmailmask(input)) {
            this.props.addEmailmask(input).then(() => {
                this.addMaskInput.value = '';
                this.setState({userInput: false});
            });
        }
    }

    render() {
        let userSearchFeedback = null;
        let userSearchBoxClass = 'form-group has-feedback';
        const _masks = this.props.masks || [];

        if (this.state.userInput) {
            if (this.state.validMask) {
                userSearchFeedback =
                    <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>;
                userSearchBoxClass += ' has-success'
            } else {
                userSearchFeedback =
                    <span className="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>;
                userSearchBoxClass += ' has-error'
            }
        }

        const masks = _masks.map((mask) => {
            return (
                <tr key={mask}>
                    <td>
                        {mask}
                    </td>
                    <td>
                        <div style={{textAlign: 'right'}}>
                            <button type="button" className='btn btn-xs btn-danger' onClick={this.props.removeEmailmask}
                                    style={{minWidth: '30px'}}>
                                <span className='glyphicon glyphicon-trash' aria-hidden="true"></span>
                                <span>Remove</span>
                            </button>
                        </div>
                    </td>
                </tr>
            );
        });

        return (
            <table className="table table-striped" style={{marginTop: '25px'}}>
                <div><strong>Email Masks</strong></div>
                <tbody>
                {masks}
                <tr>
                    <div className={userSearchBoxClass} style={{marginTop: '5px'}}>
                        <input
                            type="text"
                            name="addMaskInput"
                            onChange={this.onChangeAddMask}
                            className="form-control input-sm"
                            ref={(addMaskInput) => this.addMaskInput = addMaskInput}
                        />
                        {userSearchFeedback}
                        <div style={{textAlign: 'right', marginTop: '3px'}}>
                            <button type="button" className='btn btn-xs btn-success' onClick={this.addEmailmask}
                                    style={{minWidth: '90px'}}>
                                <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
                            </button>
                        </div>
                    </div>
                </tr>
                </tbody>
            </table>
        );
    }
}
