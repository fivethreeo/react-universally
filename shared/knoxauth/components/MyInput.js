import { withFormsy } from 'formsy-react';
import React from 'react';
import { FormGroup, Label, Input, FormText, FormFeedback, Col } from 'reactstrap';

const col_wrap = (col_opts, input, rest) =>
  (<Col {...col_opts}>
    {input}
    {rest.errorMessage &&
      <FormFeedback>
        {rest.errorMessage}
      </FormFeedback>}
  </Col>);

const ChildField = ({
  inputWidget,
  row,
  label,
  help,
  input_position = null,
  label_opts = {},
  col_opts = null,
  ...rest
}) =>
  (<FormGroup check={rest.check} row={row} disabled={rest.disabled} className={rest.className}>
    <Label key="label" for={`id_${rest.name}`} {...label_opts}>
      {input_position == 'left' ? inputWidget(rest) : ''}
      {label}
      {input_position == 'right' ? inputWidget(rest) : ''}
    </Label>
    {!input_position
      ? col_opts ? col_wrap(col_opts, inputWidget(rest), rest) : inputWidget(rest)
      : ''}
    {!col_opts &&
      rest.errorMessage &&
      <FormFeedback>
        {rest.errorMessage}
      </FormFeedback>}
    {help &&
      <FormText color="muted">
        {help}
      </FormText>}
  </FormGroup>);

const GridCheckField = ({ col_opts = { sm: 2 }, label_opts = { check: true }, ...rest }) => ChildField({ col_opts, label_opts, ...rest });

const InputWidget = ({
  errorMessage,
  getErrorMessage,
  getErrorMessages,
  getValue,
  hasValue,
  isFormDisabled,
  isValid,
  isPristine,
  isFormSubmitted,
  isRequired,
  isValidValue,
  resetValue,
  setValidations,
  setValue,
  showRequired,
  showError,
  validations,
  validationError,
  validationErrors,
  ...input
}) =>
  (<Input
    key="input"
    id={`id_${input.name}`}
    {...input}
    placeholder={input.placeholder}
    valid={!errorMessage}
  />);

class MyInput extends React.Component {
  constructor(props) {
    super(props);
    this.changeValue = this.changeValue.bind(this);
  }

  getWidgetValue(event) {
    return event.currentTarget.value;
  }

  changeValue(event) {
    // setValue() will set the value of the component, which in
    // turn will validate it and the rest of the form
    // Important: Don't skip this step. This pattern is required
    // for Formsy to work.
    this.props.setValue(this.getWidgetValue(event));
  }

  render() {
    // An error message is returned only if the component is invalid
    const errorMessage = this.props.getErrorMessage();

    const { required, ...rest } = this.props;

    return ChildField({
      inputWidget: InputWidget,
      onChange: this.changeValue,
      errorMessage,
      ...rest,
    });
  }
}

export default withFormsy(MyInput);
