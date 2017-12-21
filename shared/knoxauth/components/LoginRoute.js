import React from 'react';
import PropTypes, { string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withJob } from 'react-jobs';
import Helmet from 'react-helmet';
import LoginForm from './LoginForm';

class LoginRoute extends React.Component {
  render() {
    return (
      <div>
        <h3>Login</h3>
        <LoginForm next="/counter" />
      </div>
    );
  }
}

// export default connect(mapStateToProps, mapActionsToProps)(LoginRoute);

export default LoginRoute;
