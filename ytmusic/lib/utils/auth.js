'use strict';

const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');

const SIGNED_IN = 'signedIn';
const SIGNED_OUT = 'signedOut';
const SIGNING_IN = 'signingIn';
const ERROR = 'error';

const INITIAL_SIGNED_OUT_STATUS = {
  status: SIGNED_OUT,
  verificationInfo: null
};

function handleAuthPending(data) {
  ytmusic.set('authStatusInfo', {
    status: SIGNED_OUT,
    verificationInfo: data
  });

  ytmusic.refreshUIConfig();
}

function handleAuthSuccess(data) {
  ytmusic.set('authStatusInfo', {
    status: SIGNED_IN
  });

  ytmusic.setConfigValue('authCredentials', data.credentials, true);

  ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SIGN_IN_SUCCESS'));
  ytmusic.refreshUIConfig();
}

function handleAuthError(err) {
  if (err.info.status === 'DEVICE_CODE_EXPIRED') {
    ytmusic.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
  }
  else {
    ytmusic.set('authStatusInfo', {
      status: ERROR,
      error: err
    });

    ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_SIGN_IN', 
      ytmusic.getErrorMessage('', err, false)));
  }

  ytmusic.refreshUIConfig();
}

function handleUpdateCredentials(data) {
  ytmusic.setConfigValue('authCredentials', data.credentials, true);
}

function registerAuthHandlers() {
  const innerTube = ytmusic.get('innertube');
  if (innerTube?.session) {
    innerTube.session.on('auth', handleAuthSuccess);
    innerTube.session.on('auth-pending', handleAuthPending);
    innerTube.session.on('auth-error', handleAuthError);
    innerTube.session.on('update-credentials', handleUpdateCredentials);
  }
}

function unregisterAuthHandlers() {
  const innerTube = ytmusic.get('innertube');
  if (innerTube?.session) {
    innerTube.session.off('auth', handleAuthSuccess);
    innerTube.session.off('auth-pending', handleAuthPending);
    innerTube.session.off('auth-error', handleAuthError);
    innerTube.session.off('update-credentials', handleUpdateCredentials);
  }
}

function signIn() {
  const innerTube = ytmusic.get('innertube');
  if (innerTube?.session) {
    const credentials = ytmusic.getConfigValue('authCredentials', {}, true);
    if (Object.entries(credentials).length > 0) {
      ytmusic.set('authStatusInfo', {
        status: SIGNING_IN
      }); 
    }
    else {
      ytmusic.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
    }

    ytmusic.refreshUIConfig();
    innerTube.session.signIn(credentials);
  }
}

function signOut() {
  const innerTube = ytmusic.get('innertube');
  if (innerTube?.session?.logged_in) {
    innerTube.session.signOut();
    
    ytmusic.setConfigValue('authCredentials', {}, true);

    ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SIGNED_OUT'));

    // Sign in again with empty credentials to reset status to SIGNED_OUT
    // and obtain new device code
    signIn();
  }
}

function getAuthStatus() {
  return ytmusic.get('authStatusInfo') || INITIAL_SIGNED_OUT_STATUS;
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
