import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as reduxFormReducer } from 'redux-form';

import posts, * as FromPosts from './posts';

// -----------------------------------------------------------------------------
// REDUCER

const rootReducer = combineReducers({
  router: routerReducer,
  posts,
  form: reduxFormReducer,
});

// -----------------------------------------------------------------------------
// EXPORTED SELECTORS

export function getPostById(state, id) {
  return FromPosts.getById(state.posts, id);
}

// -----------------------------------------------------------------------------
// REDUCER EXPORT

export default rootReducer;
