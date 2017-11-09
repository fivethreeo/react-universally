import configureServerStore from '../configureServerStore';

export default function serverStoreMiddleware(request, response, next) {
  response.locals.store = configureServerStore(request, response);
  next();
}
