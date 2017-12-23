import React from 'react';
import PropTypes, { string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withJob } from 'react-jobs';
import Helmet from 'react-helmet';
import RegisterForm from './RegisterForm';

class RegisterRoute extends React.Component {
  render() {
    return (
      <div>
        <h3>Register</h3>
        <RegisterForm next="/counter" />
      </div>
    );
  }
}
export default RegisterRoute;
