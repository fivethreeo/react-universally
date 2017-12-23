import { authLoginUser } from '../creators';

import Formsy from 'formsy-react';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import MyInput from './MyInput';
import { Form } from 'reactstrap';

const mapActionsToProps = {
  authLoginUser,
};

const grid = {
  label_opts: { sm: 2 },
  col_opts: { sm: 3 },
};

class RegisterForm extends React.Component {
  constructor(props) {
    super(props);
    this.disableButton = this.disableButton.bind(this);
    this.enableButton = this.enableButton.bind(this);
    this.submit = this.submit.bind(this);
    this.state = { canSubmit: false };
    this.authLoginUser = props.authLoginUser;
    this.next = props.next;
  }

  disableButton() {
    this.setState({ canSubmit: false });
  }

  enableButton() {
    this.setState({ canSubmit: true });
  }

  submit(model) {
    this.authLoginUser(model.email, model.password, this.next);
  }

  render() {
    return (
      <Form
        method="post"
        action="/accounts/register?redirect={this.next}"
        tag={Formsy}
        onValidSubmit={this.submit}
        onValid={this.enableButton}
        onInvalid={this.disableButton}
      >
        <MyInput
          type="text"
          name="first_name"
          placeholder="First name"
          label="First name"
          required
          row
          {...grid}
        />
        <MyInput
          type="text"
          name="last_name"
          placeholder="Last name"
          label="Last name"
          required
          row
          {...grid}
        />
        <MyInput
          type="text"
          name="email"
          placeholder="email@example.com"
          label="Email"
          validations="isEmail"
          validationError="This is not a valid email"
          required
          row
          {...grid}
        />
        <MyInput
          type="password"
          name="password"
          placeholder="Password"
          label="Password"
          validations="isAlphanumeric"
          validationError="This is not a valid password"
          required
          row
          {...grid}
        />
        <MyInput
          type="password"
          name="password_again"
          placeholder="Password"
          label="Password again"
          validations="equalsField:password"
          validationError="Passwords do not match"
          help="Kghujl "
          required
          row
          {...grid}
        />
        <button type="submit" disabled={!this.state.canSubmit}>
          Submit
        </button>
      </Form>
    );
  }
}
export default (RegisterForm = compose(
  // connect(mapStateToProps, mapActionsToProps)
  connect(() => ({}), mapActionsToProps),
)(RegisterForm));
