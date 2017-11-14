import { ConnectedRouter as _ConnectedRouter } from 'react-router-redux';
import PropTypes from 'prop-types';

export class ConnectedRouter extends _ConnectedRouter {
  getChildContext() {
    return {
      router: {
        staticContext: this.props.context,
      },
    };
  }
}

ConnectedRouter.childContextTypes = {
  router: PropTypes.object.isRequired,
};
