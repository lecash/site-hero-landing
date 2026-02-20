// tests/_helpers.js
export function makeReqRes({ method = "POST", headers = {}, body = null } = {}) {
  const req = {
    method,
    headers: normalizeHeaders(headers),
    body: body ?? {},
  };

  const res = createResMock();
  return { req, res };
}

function normalizeHeaders(h) {
  const out = {};
  for (const [k, v] of Object.entries(h || {})) out[String(k).toLowerCase()] = v;
  return out;
}

function createResMock() {
  const state = {
    statusCode: 200,
    headers: {},
    jsonBody: undefined,
    ended: false,
  };

  return {
    setHeader(key, value) {
      state.headers[String(key).toLowerCase()] = value;
      return this;
    },
    getHeader(key) {
      return state.headers[String(key).toLowerCase()];
    },
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(payload) {
      state.jsonBody = payload;
      state.ended = true;
      return this;
    },
    end(raw) {
      if (raw) {
        try {
          state.jsonBody = JSON.parse(raw);
        } catch {
          state.jsonBody = raw;
        }
      }
      state.ended = true;
      return this;
    },
    _get() {
      return { ...state, headers: { ...state.headers } };
    },
  };
}