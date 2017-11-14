import configureStore from '../shared/redux/configureStore';

export default function configureServerStore(request, response) {
  return configureStore(request.universalCookies, response.locals.history);
}
