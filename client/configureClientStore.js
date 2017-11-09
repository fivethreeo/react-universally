import configureStore from '../../../shared/redux/configureStore';
import Cookies from 'universal-cookie';

function configureClientStore(request, response) {
  return configureStore(new Cookies());
}

export default configureClientStore;
