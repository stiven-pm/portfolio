import { ENDPOINTS } from './config';
import { getTraceId, TRACE_ID_HEADER } from './traceId';

export { resetTraceId } from './traceId';

const isDev = import.meta.env.DEV;

function getOperationName(query) {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match ? match[1] : 'unknown';
}

function devLog(...args) {
  if (isDev) console.log(...args);
}

function devError(...args) {
  if (isDev) console.error(...args);
}

async function graphqlFetch(url, query, variables = {}, token) {
  const op = getOperationName(query);
  const traceId = getTraceId();
  devLog('[graphqlFetch] REQ', op, 'traceId=', traceId, 'url=', url, 'variableKeys=', Object.keys(variables || {}));
  const body = JSON.stringify({ query, variables });
  if (isDev && op.includes('CreateProject')) {
    devLog('[graphqlFetch] CreateProject variant count=', variables?.input?.variants?.length ?? 0);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [TRACE_ID_HEADER]: traceId,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body,
    credentials: 'same-origin',
  });

  const json = await res.json().catch((e) => {
    devLog('[graphqlFetch] RES parse error', op, e);
    return {};
  });

  if (res.status === 401) {
    if (token && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:session-expired'));
    }
    const msg =
      !token && json.errors?.[0]?.message
        ? json.errors[0].message
        : 'Sesión expirada o no autorizada';
    const err = new Error(msg);
    err.code = 'UNAUTHORIZED';
    err.traceId = res.headers.get(TRACE_ID_HEADER);
    throw err;
  }

  if (json.errors?.length) {
    const serverTraceId = res.headers.get(TRACE_ID_HEADER);
    const err0 = json.errors[0];
    const msg = err0?.message || 'Error GraphQL';
    devError('[graphqlFetch] RES errors', op, 'traceId=', traceId, 'serverTraceId=', serverTraceId, 'message=', msg);
    if (isDev && json.errors.length > 1) devError('[graphqlFetch] más errores:', json.errors.slice(1));
    const err = new Error(msg);
    err.traceId = serverTraceId || traceId;
    throw err;
  }

  if (!res.ok) {
    const serverTraceId = res.headers.get(TRACE_ID_HEADER);
    devLog('[graphqlFetch] RES !ok', op, 'status=', res.status);
    const err = new Error(json.message || `HTTP ${res.status}`);
    err.traceId = serverTraceId || traceId;
    throw err;
  }

  if (isDev) {
    const dataKeys = json.data ? Object.keys(json.data) : [];
    devLog('[graphqlFetch] RES ok', op, 'dataKeys=', dataKeys);
  }
  return json.data;
}

async function graphqlRequest(query, variables = {}, getToken) {
  const token = getToken ? getToken() : null;
  return graphqlFetch(ENDPOINTS.graphql, query, variables, token);
}

export default graphqlRequest;

export const catalogGraphQL  = graphqlRequest;
export const identityGraphQL = graphqlRequest;
export const productsGraphQL = graphqlRequest;
export const threadsGraphQL  = graphqlRequest;
