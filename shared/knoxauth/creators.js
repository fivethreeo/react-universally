import {
  AUTH_LOGIN_USER_REQUEST,
  AUTH_LOGIN_USER_SUCCESS,
  AUTH_LOGIN_USER_FAILURE,
  AUTH_LOGOUT_USER,
} from './actions';

// import { checkHttpStatus, parseJSON } from './utils'
import { push, go, replace } from 'react-router-redux';

import * as _btoa from 'btoa';

const btoa = process.env.BUILD_FLAG_IS_CLIENT === 'true' ? window.btoa : _btoa;

const api_url = process.env.BUILD_FLAG_IS_CLIENT === 'true' ? 'frontend' : 'backend';

export const authLoginUserRequest = () => ({
  type: AUTH_LOGIN_USER_REQUEST,
});

export const authLoginUser = (email, password, redirect = '/') => (dispatch, getState, { axios, cookie }) => axios
      .post(`${api_url}/v1/accounts/login/`, {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
      })
      .then(checkHttpStatus)
      .then(parseJSON)
      .then((response) => {
        cookies.set('knoxToken', response.token);
        dispatch(authLoginUserSuccess(response.user));
      })
      .then(() => true)
      .catch((error) => {
        if (error && typeof error.response !== 'undefined' && error.response.status === 401) {
          // Invalid authentication credentials
          return error.response.json().then((data) => {
            dispatch(authLoginUserFailureReport(401, data.non_field_errors[0]));
          });
        } else if (error && typeof error.response !== 'undefined' && error.response.status >= 500) {
          // Server side error
          dispatch(
            authLoginUserFailureReport(500, 'A server error occurred while sending your data!'),
          );
        } else {
          // Most likely connection issues
          dispatch(
            authLoginUserFailureReport(
              'Connection Error',
              'An error occurred while sending your data!',
            ),
          );
        }

        return Promise.resolve(true); // TODO: we need a promise here because of the tests, find a better way
      });

export const authLogoutAndRedirect = () => (dispatch, getState, { axios, cookie }) => axios
      .get(`https://jsonplaceholder.typicode.com/Todos/${id}`)
      .then(({ data }) => {
        for (const todo in data) dispatch(addTodo(todo));
      })
      .then(() => true);

export const authLoginUserSuccess = payload => ({
  type: AUTH_LOGIN_USER_SUCCESS,
  payload,
});

export const authLoginUserFailure = (status, statusText) => ({
  type: AUTH_LOGIN_USER_FAILURE,
  payload: {
    status,
    statusText,
  },
});

export const authLoginUserFailureReport = (status, statusText) => (dispatch, getState, { cookies }) => {
  cookies.remove('knoxToken');
  dispatch(authLoginUserFailure(status, statusText));
  return Promise.resolve(true);
};

export const authLogoutUser = () => ({
  type: AUTH_LOGOUT_USER,
});

export const authLogoutUserDo = () => (dispatch, getState, { cookies }) => {
  cookies.remove('knoxToken');
  dispatch(authLogout());
  return Promise.resolve(true);
};

export const authLogoutUserAndRedirect = () => (dispatch, getState, { cookies }) => {
  dispatch(authLogoutUserDo());
  dispatch(push('/login'));
  return Promise.resolve(true);
};
