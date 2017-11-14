import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import posts, * as FromPosts from './posts';

// -----------------------------------------------------------------------------
// REDUCER

const rootReducer = combineReducers({
  router: routerReducer,
  posts,
});

// -----------------------------------------------------------------------------
// EXPORTED SELECTORS

export function getPostById(state, id) {
  return FromPosts.getById(state.posts, id);
}

// -----------------------------------------------------------------------------
// REDUCER EXPORT

export default rootReducer;
