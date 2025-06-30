import fetch, { HeadersInit } from 'node-fetch';
import { ServerConnectParams, encodeBase64 } from './Util';
import { AbortController } from 'node-abort-controller';

const BASE_REQUEST_BODY = {
  'id': 1,
  'method': 'slim.request'
};

const BASE_HEADERS = {
  'Content-Type': 'application/json'
};

export async function sendRpcRequest(connectParams: ServerConnectParams, params: any, abortController?: AbortController | null) {
  const body = {
    ...BASE_REQUEST_BODY,
    params
  };
  const url = `${connectParams.host}:${connectParams.port}/jsonrpc.js`;
  const headers: HeadersInit = { ...BASE_HEADERS };
  if (connectParams.username) {
    headers.Authorization = `Basic ${encodeBase64(`${connectParams.username}:${connectParams.password || ''}`)}`;
  }

  try {
    const response = await fetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers,
      signal: abortController ? abortController.signal as any : undefined
    });

    if (response.ok) {
      return response.json();
    }

    throw new Error(`${response.status} - ${response.statusText}`);

  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { _requestAborted: true };
    }

    throw error;

  }
}

module.exports = {
  sendRpcRequest
};
