import React from 'react';
import PropTypes, { string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withJob } from 'react-jobs';
import Helmet from 'react-helmet';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';
import LoginRoute from './LoginRoute';
import RegisterRoute from './RegisterRoute';

class AccountsRoute extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/accounts/login" component={LoginRoute} />
        <Route path="/accounts/register" component={RegisterRoute} />
      </Switch>
    );
  }
}

export default AccountsRoute;
