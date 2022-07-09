const fetch = require('node-fetch');
const { encodeBase64 } = require('./util');

const BASE_REQUEST_BODY = {
  "id": 1,
  "method": "slim.request",
};

const BASE_HEADERS = {
  'Content-Type': 'application/json'
};

async function sendRpcRequest(connectParams, params, abortController = null) {
  const body = {
    ...BASE_REQUEST_BODY,
    params
  };
  const url = `${connectParams.host}:${connectParams.port}/jsonrpc.js`;
  const headers = { ...BASE_HEADERS };
  if (connectParams.username) {
    headers.Authorization = 'Basic ' + encodeBase64(connectParams.username + ":" + (connectParams.password || ''));
  }

  try {
    const response = await fetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers,
      signal: abortController ? abortController.signal : undefined
    });

    if (response.ok) {
      return response.json();
    }
    else {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { _requestAborted: true };
    }
    else {
      throw error;
    }
  }
}

module.exports = {
  sendRpcRequest
};
