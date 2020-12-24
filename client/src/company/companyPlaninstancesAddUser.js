import React from 'react';
import * as Bpc from '../components/bpc';

export default class CompanyPlaninstancesAddUser extends React.Component {
    constructor(props) {
        super(props);
        this.searchUser = this.searchUser.bind(this);
        this.onChangeAddUser = this.onChangeAddUser.bind(this);
        this.addUser = this.addUser.bind(this);
        this.state = {
            searchUserTimer: null,
            userSearchCompleted: false,
            foundUser: null
        };
    }

    searchUser() {
        const input = this.addUserInput.value;
        if (input.length > 0) {
            const encoded_input = encodeURIComponent(input);
            const query = `?provider=gigya&email=${encoded_input}&id=${encoded_input}`;

            return Bpc.request(`/users${query}`)
                .then(users => {
                    const foundUser = users.length === 1 ? users[0] : null;
                    this.setState({foundUser, userSearchCompleted: true});
                });
        }
    }

    onChangeAddUser() {
        this.setState({foundUser: null, userSearchCompleted: false});
        clearTimeout(this.state.searchUserTimer);
        this.setState({searchUserTimer: setTimeout(this.searchUser, 1000)});
    }

    addUser() {
        const foundUser = this.state.foundUser;
        if (foundUser) {
            this.setState({addingUser: true}, () => {
                this.props.addUser(foundUser);
                this.addUserInput.value = '';
                this.setState({
                    addingUser: false,
                    userSearchCompleted: false,
                    foundUser: null
                });
            });
        }
    }

    render() {
        let userSearchFeedback = null;
        let userSearchBoxClass = 'form-group has-feedback';
        const addButtonDisabled = !this.state.userSearchCompleted || this.state.addingUser || !this.state.foundUser;

        if (this.state.userSearchCompleted) {
            if (this.state.foundUser) {
                userSearchFeedback =
                    <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>;
                userSearchBoxClass += ' has-success'
            } else {
                userSearchFeedback =
                    <span className="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>;
                userSearchBoxClass += ' has-error'
            }
        }

        return (
            <div className={userSearchBoxClass} style={{marginTop: '5px'}}>
                <input
                    type="text"
                    name="addUserInput"
                    className="form-control input-sm"
                    onChange={this.onChangeAddUser}
                    ref={(addUserInput) => this.addUserInput = addUserInput}
                />
                {userSearchFeedback}
                <div style={{textAlign: 'right', marginTop: '3px'}}>
                    <button type="button" className='btn btn-xs btn-success' onClick={this.addUser}
                            disabled={addButtonDisabled} style={{minWidth: '90px'}}>
                        <span className='glyphicon glyphicon-plus' aria-hidden="true"></span> <span>Add</span>
                    </button>
                </div>
            </div>
        );
    }
}
