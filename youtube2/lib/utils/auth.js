'use strict';

const yt2 = require('../youtube2');

const SIGNED_IN = 'signedIn';
const SIGNED_OUT = 'signedOut';
const SIGNING_IN = 'signingIn';
const ERROR = 'error';

const INITIAL_SIGNED_OUT_STATUS = {
  status: SIGNED_OUT,
  verificationInfo: null
};

function handleAuthPending(data) {
  yt2.set('authStatusInfo', {
    status: SIGNED_OUT,
    verificationInfo: data
  });

  yt2.refreshUIConfig();
}

function handleAuthSuccess(data) {
  yt2.set('authStatusInfo', {
    status: SIGNED_IN
  });

  yt2.setConfigValue('authCredentials', data.credentials, true);

  yt2.toast('success', yt2.getI18n('YOUTUBE2_SIGN_IN_SUCCESS'));
  yt2.refreshUIConfig();
}

function handleAuthError(err) {
  if (err.info.status === 'DEVICE_CODE_EXPIRED') {
    yt2.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
  }
  else {
    yt2.set('authStatusInfo', {
      status: ERROR,
      error: err
    });

    yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_SIGN_IN', 
      yt2.getErrorMessage('', err, false)));
  }

  yt2.refreshUIConfig();
}

function handleUpdateCredentials(data) {
  yt2.setConfigValue('authCredentials', data.credentials, true);
}

function registerAuthHandlers() {
  const innerTube = yt2.get('innertube');
  if (innerTube?.session) {
    innerTube.session.on('auth', handleAuthSuccess);
    innerTube.session.on('auth-pending', handleAuthPending);
    innerTube.session.on('auth-error', handleAuthError);
    innerTube.session.on('update-credentials', handleUpdateCredentials);
  }
}

function unregisterAuthHandlers() {
  const innerTube = yt2.get('innertube');
  if (innerTube?.session) {
    innerTube.session.off('auth', handleAuthSuccess);
    innerTube.session.off('auth-pending', handleAuthPending);
    innerTube.session.off('auth-error', handleAuthError);
    innerTube.session.off('update-credentials', handleUpdateCredentials);
  }
}

function signIn() {
  const innerTube = yt2.get('innertube');
  if (innerTube?.session) {
    const credentials = yt2.getConfigValue('authCredentials', {}, true);
    if (Object.entries(credentials).length > 0) {
      yt2.set('authStatusInfo', {
        status: SIGNING_IN
      }); 
    }
    else {
      yt2.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
    }

    yt2.refreshUIConfig();
    innerTube.session.signIn(credentials);
  }
}

function signOut() {
  const innerTube = yt2.get('innertube');
  if (innerTube?.session?.logged_in) {
    innerTube.session.signOut();
    
    yt2.setConfigValue('authCredentials', {}, true);

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SIGNED_OUT'));

    // Sign in again with empty credentials to reset status to SIGNED_OUT
    // and obtain new device code
    signIn();
  }
}

function getAuthStatus() {
  return yt2.get('authStatusInfo') || INITIAL_SIGNED_OUT_STATUS;
}

module.exports = {
  registerAuthHandlers,
  unregisterAuthHandlers,
  signIn,
  signOut,
  getAuthStatus,
  SIGNED_IN,
  SIGNED_OUT,
  SIGNING_IN,
  ERROR
};
