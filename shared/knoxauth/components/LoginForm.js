import Formsy from 'formsy-react';
import React from 'react';
import MyInput from './MyInput';

export default class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.disableButton = this.disableButton.bind(this);
    this.enableButton = this.enableButton.bind(this);
    this.state = { canSubmit: false };
  }

  disableButton() {
    this.setState({ canSubmit: false });
  }

  enableButton() {
    this.setState({ canSubmit: true });
  }

  submit(model) {
    fetch('http://example.com/', {
      method: 'post',
      body: JSON.stringify(model),
    });
  }

  render() {
    return (
      <Formsy
        onValidSubmit={this.submit}
        onValid={this.enableButton}
        onInvalid={this.disableButton}
      >
        <MyInput
          name="email"
          placeholder="email@example.com"
          label="Email"
          className=""
          help="help"
          validations="isEmail"
          validationError="This is not a valid email"
          required
        />
        <button type="submit" disabled={!this.state.canSubmit}>
          Submit
        </button>
      </Formsy>
    );
  }
}
