import crypto from "crypto";

const ACTIONS = new Set(["ping", "uppercase", "pc-ping", "run-pc"]);
const PROTECTED_ACTIONS = new Set(["uppercase", "pc-ping", "run-pc"]);

function csvToSet(raw) {
  const out = new Set();
  for (const chunk of String(raw).match(/[^,]+/g) || []) {
    const trimmed = chunk.trim();
    if (trimmed) out.add(trimmed);
  }
  return out;
}

let _lastOrigins = null, _originsSet = new Set();
const getAllowedOrigins = () => {
  const current = process.env.ALLOWED_ORIGINS || "";
  if (current !== _lastOrigins) {
    _originsSet = csvToSet(current);
    _lastOrigins = current;
  }
  return _originsSet;
};

let _lastUpstream = null, _upstreamSet = new Set();
const getUpstreamAllowlist = () => {
  const current = process.env.UPSTREAM_ALLOWLIST || "";
  if (current !== _lastUpstream) {
    _upstreamSet = csvToSet(current);
    _lastUpstream = current;
  }
  return _upstreamSet;
};

function safeLog(event) {
  console.log(JSON.stringify(event));
}

function parseBody(req) {
  const contentType = String(req?.headers?.["content-type"] || "");
  if (!/^application\/json\b/i.test(contentType)) {
    return { ok: false };
  }

  const rawBody = req?.body;
  if (rawBody === null || rawBody === undefined) {
    return { ok: false };
  }

  if (typeof rawBody === "string") {
    try {
      return { ok: true, body: JSON.parse(rawBody) };
    } catch {
      return { ok: false };
    }
  }

  if (typeof rawBody === "object" && !Array.isArray(rawBody)) {
    return { ok: true, body: rawBody };
  }

  return { ok: false };
}

function isBearerAuthorized(authHeader) {
  if (typeof authHeader !== "string") return false;
  if (!/^Bearer [^\s]+$/.test(authHeader)) return false;

  const token = authHeader.slice(7);
  const secret = String(process.env.MY_SECRET_KEY || "");

  if (secret.length < 32) return false;

  const tokenBuffer = Buffer.from(token, "utf8");
  const secretBuffer = Buffer.from(secret, "utf8");

  if (tokenBuffer.length !== secretBuffer.length) return false;

  try {
    return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
  } catch {
    return false;
  }
}

function isValidNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function respondJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  const method = String(req?.method || "").toUpperCase();
  const originHeader = req?.headers?.origin;
  const origin = typeof originHeader === "string" ? originHeader : null;

  let action = null;
  let status = 500;
  let result = "error";
  let errorCode = "ERR_INTERNAL";

  try {
    if (method !== "OPTIONS" && method !== "POST") {
      status = 405;
      result = "deny";
      errorCode = "ERR_METHOD";
      respondJson(res, 405, { error: "Método não permitido", requestId });
      return;
    }

    const allowedOrigins = getAllowedOrigins();
    const originAllowed = origin !== null && allowedOrigins.has(origin);

    if (method === "OPTIONS") {
      status = 204;
      result = originAllowed ? "allow" : "deny";
      errorCode = originAllowed ? null : "ERR_CORS";

      if (originAllowed) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Vary", "Origin");
      }

      res.status(204).end();
      return;
    }

    if (!originAllowed) {
      status = 403;
      result = "deny";
      errorCode = "ERR_CORS";
      respondJson(res, 403, { error: "Origem não permitida", requestId });
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");

    const parsed = parseBody(req);
    if (!parsed.ok) {
      status = 400;
      result = "deny";
      errorCode = "ERR_BODY";
      respondJson(res, 400, { error: "Input inválido", requestId });
      return;
    }

    const body = parsed.body;
    if (!isValidNonEmptyString(body?.action)) {
      status = 400;
      result = "deny";
      errorCode = "ERR_BODY";
      respondJson(res, 400, { error: "Input inválido", requestId });
      return;
    }

    action = body.action;

    if (!ACTIONS.has(action)) {
      status = 400;
      result = "deny";
      errorCode = "ERR_ACTION";
      respondJson(res, 400, { error: "Input inválido", requestId });
      return;
    }

    if (PROTECTED_ACTIONS.has(action)) {
      const authHeader = req?.headers?.authorization;
      if (!isBearerAuthorized(authHeader)) {
        status = 401;
        result = "deny";
        errorCode = "ERR_AUTH";
        respondJson(res, 401, { error: "Não autorizado", requestId });
        return;
      }
    }

    if (action === "ping") {
      status = 200;
      result = "allow";
      errorCode = null;
      respondJson(res, 200, { ok: true, requestId });
      return;
    }

    if (action === "uppercase") {
      if (!isValidNonEmptyString(body?.content)) {
        status = 400;
        result = "deny";
        errorCode = "ERR_PAYLOAD";
        respondJson(res, 400, { error: "Input inválido", requestId });
        return;
      }

      status = 200;
      result = "allow";
      errorCode = null;
      respondJson(res, 200, { message: body.content.toUpperCase(), requestId });
      return;
    }

    const upstreamAllowlist = getUpstreamAllowlist();
    const upstream = body?.upstream;

    if (typeof upstream !== "string" || !upstreamAllowlist.has(upstream)) {
      status = 400;
      result = "deny";
      errorCode = "ERR_PAYLOAD";
      respondJson(res, 400, { error: "Input inválido", requestId });
      return;
    }

    if (action === "pc-ping") {
      try {
        const response = await fetchWithTimeout(new URL("/ping", upstream).toString(), {
          method: "GET",
        });

        if (!response.ok) {
          status = 502;
          result = "error";
          errorCode = "ERR_UPSTREAM";
          respondJson(res, 502, { error: "Upstream indisponível", requestId });
          return;
        }

        status = 200;
        result = "allow";
        errorCode = null;
        respondJson(res, 200, { message: "PC online", requestId });
        return;
      } catch {
        status = 502;
        result = "error";
        errorCode = "ERR_UPSTREAM";
        respondJson(res, 502, { error: "Upstream indisponível", requestId });
        return;
      }
    }

    if (!isValidNonEmptyString(body?.content)) {
      status = 400;
      result = "deny";
      errorCode = "ERR_PAYLOAD";
      respondJson(res, 400, { error: "Input inválido", requestId });
      return;
    }

    try {
      const response = await fetchWithTimeout(new URL("/run", upstream).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: body.content }),
      });

      if (!response.ok) {
        status = 502;
        result = "error";
        errorCode = "ERR_UPSTREAM";
        respondJson(res, 502, { error: "Upstream indisponível", requestId });
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch {
        status = 502;
        result = "error";
        errorCode = "ERR_UPSTREAM";
        respondJson(res, 502, { error: "Upstream indisponível", requestId });
        return;
      }

      status = 200;
      result = "allow";
      errorCode = null;
      respondJson(res, 200, {
        message: typeof data?.output === "string" ? data.output : "",
        requestId,
      });
      return;
    } catch {
      status = 502;
      result = "error";
      errorCode = "ERR_UPSTREAM";
      respondJson(res, 502, { error: "Upstream indisponível", requestId });
      return;
    }
  } catch {
    status = 500;
    result = "error";
    errorCode = "ERR_INTERNAL";
    respondJson(res, 500, { error: "Erro interno", requestId });
    return;
  } finally {
    safeLog({
      ts: new Date().toISOString(),
      requestId,
      origin,
      method,
      action,
      result,
      status,
      latencyMs: Date.now() - startedAt,
      errorCode,
    });
  }
}
