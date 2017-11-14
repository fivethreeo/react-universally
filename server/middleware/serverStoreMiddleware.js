import configureServerStore from '../configureServerStore';
import createHistory from 'history/createMemoryHistory';
import { parsePath } from 'history/PathUtils';

export default function serverStoreMiddleware(request, response, next) {
  const initialLocation = parsePath(request.url);

  response.locals.initialLocation = initialLocation;

  response.locals.history = createHistory({
    initialEntries: [initialLocation],
    initialIndex: 0,
  });

  response.locals.store = configureServerStore(request, response);
  next();
}
