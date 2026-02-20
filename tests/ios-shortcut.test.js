import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../api/ios-shortcut.js";
import { makeReqRes } from "./_helpers.js";

const VALID_ORIGIN = { origin: "https://example.com" };
const VALID_AUTH = () => ({ authorization: `Bearer ${process.env.MY_SECRET_KEY}` });

beforeEach(() => {
  vi.restoreAllMocks();
  delete global.fetch;
  process.env.ALLOWED_ORIGINS = "https://example.com";
  process.env.UPSTREAM_ALLOWLIST = "http://localhost:7777";
  process.env.MY_SECRET_KEY = "12345678901234567890123456789012";
});

describe("api/ios-shortcut.js", () => {
  it("200 | ping público", async () => {
    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, "content-type": "application/json" },
      body: { action: "ping" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(200);
    expect(out.jsonBody?.ok).toBe(true);
    expect(typeof out.jsonBody?.requestId).toBe("string");
  });

  it("401 | action protegida sem token", async () => {
    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, "content-type": "application/json" },
      body: { action: "uppercase", content: "hello" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(401);
    expect(out.jsonBody?.error).toBe("Não autorizado");
  });

  it("405 | método inválido", async () => {
    const { req, res } = makeReqRes({
      method: "GET",
      headers: { ...VALID_ORIGIN, "content-type": "application/json" },
      body: { action: "ping" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(405);
    expect(out.jsonBody?.error).toBe("Método não permitido");
  });

  it("400 | action desconhecida", async () => {
    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, ...VALID_AUTH(), "content-type": "application/json" },
      body: { action: "admin" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(400);
    expect(out.jsonBody?.error).toBe("Input inválido");
  });

  it("400 | payload inválido", async () => {
    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, ...VALID_AUTH(), "content-type": "application/json" },
      body: { action: "uppercase", content: "" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(400);
    expect(out.jsonBody?.error).toBe("Input inválido");
  });

  it("OPTIONS permitido -> 204 com ACAO e Vary", async () => {
    const { req, res } = makeReqRes({
      method: "OPTIONS",
      headers: { ...VALID_ORIGIN },
      body: null,
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(204);
    expect(out.headers["access-control-allow-origin"]).toBe("https://example.com");
    expect(out.headers["vary"]).toBe("Origin");
  });

  it("OPTIONS negado -> 204 sem headers de permissão e sem Vary", async () => {
    const { req, res } = makeReqRes({
      method: "OPTIONS",
      headers: { origin: "https://evil.example" },
      body: null,
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(204);
    expect(out.headers["access-control-allow-origin"]).toBeUndefined();
    expect(out.headers["vary"]).toBeUndefined();
  });

  it("CORS-04 | POST origin permitida → 200 + ACAO + Vary: Origin (Bugfix)", async () => {
    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, "content-type": "application/json" },
      body: { action: "ping" },
    });
    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(200);
    expect(out.headers["access-control-allow-origin"]).toBe("https://example.com");
    expect(out.headers["vary"]).toBe("Origin");
  });

  it("POST origin não permitida -> 403 antes de auth/body", async () => {
    const { req, res } = makeReqRes({
      method: "POST",
      headers: {
        origin: "https://evil.example",
        authorization: "Bearer invalid",
        "content-type": "application/json",
      },
      body: { action: "uppercase", content: "hello" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(403);
    expect(out.jsonBody?.error).toBe("Origem não permitida");
    expect(out.headers["vary"]).toBeUndefined();
  });

  it("método inválido retorna 405 antes de CORS", async () => {
    const { req, res } = makeReqRes({
      method: "DELETE",
      headers: { origin: "https://evil.example", "content-type": "application/json" },
      body: { action: "ping" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(405);
    expect(out.jsonBody?.error).toBe("Método não permitido");
  });

  it("fetch nunca roda quando CORS falha", async () => {
    global.fetch = vi.fn();

    const { req, res } = makeReqRes({
      method: "POST",
      headers: {
        origin: "https://evil.example",
        authorization: `Bearer ${process.env.MY_SECRET_KEY}`,
        "content-type": "application/json",
      },
      body: { action: "pc-ping", upstream: "http://localhost:7777" },
    });

    await handler(req, res);

    expect(res._get().statusCode).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetch nunca roda quando auth falha", async () => {
    global.fetch = vi.fn();

    const { req, res } = makeReqRes({
      method: "POST",
      headers: {
        ...VALID_ORIGIN,
        authorization: "Bearer wrong-token",
        "content-type": "application/json",
      },
      body: { action: "pc-ping", upstream: "http://localhost:7777" },
    });

    await handler(req, res);

    expect(res._get().statusCode).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uppercase protegida -> 200 com mensagem", async () => {
    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, ...VALID_AUTH(), "content-type": "application/json" },
      body: { action: "uppercase", content: "hello" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(200);
    expect(out.jsonBody?.message).toBe("HELLO");
  });

  it("pc-ping upstream fora allowlist -> 400 sem fetch", async () => {
    global.fetch = vi.fn();

    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, ...VALID_AUTH(), "content-type": "application/json" },
      body: { action: "pc-ping", upstream: "http://169.254.169.254" },
    });

    await handler(req, res);

    expect(res._get().statusCode).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("run-pc sucesso -> 200 com output filtrado", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ output: "OK", secret: "x" }),
      })
    );

    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, ...VALID_AUTH(), "content-type": "application/json" },
      body: { action: "run-pc", upstream: "http://localhost:7777", content: "dir" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(200);
    expect(out.jsonBody).toEqual({ message: "OK", requestId: out.jsonBody.requestId });
  });

  it("FETCH-04 | run-pc upstream retorna HTML/JSON inválido → catch global vira 502", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error("invalid json sequence")),
      })
    );

    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, ...VALID_AUTH(), "content-type": "application/json" },
      body: { action: "run-pc", upstream: "http://localhost:7777", content: "dir" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(502);
    expect(out.jsonBody?.error).toBe("Upstream indisponível");
  });

  it("FETCH-02 | Timeout com margem CI elástica (2900..4500ms)", async () => {
    global.fetch = vi.fn((url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")));
        setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 10000);
      })
    );

    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, ...VALID_AUTH(), "content-type": "application/json" },
      body: { action: "pc-ping", upstream: "http://localhost:7777" },
    });

    const start = Date.now();
    await handler(req, res);
    const durationMs = Date.now() - start;

    expect(res._get().statusCode).toBe(502);
    expect(durationMs).toBeGreaterThanOrEqual(2900);
    expect(durationMs).toBeLessThanOrEqual(4500);
  });

  it("mensagem de auth é idêntica para ausente e inválido", async () => {
    const missing = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, "content-type": "application/json" },
      body: { action: "uppercase", content: "x" },
    });

    const wrong = makeReqRes({
      method: "POST",
      headers: {
        ...VALID_ORIGIN,
        authorization: "Bearer wrong-token",
        "content-type": "application/json",
      },
      body: { action: "uppercase", content: "x" },
    });

    await handler(missing.req, missing.res);
    await handler(wrong.req, wrong.res);

    expect(missing.res._get().jsonBody?.error).toBe("Não autorizado");
    expect(wrong.res._get().jsonBody?.error).toBe("Não autorizado");
  });

  it("secret curta gera 401 e nunca 500", async () => {
    process.env.MY_SECRET_KEY = "short";

    const { req, res } = makeReqRes({
      method: "POST",
      headers: {
        ...VALID_ORIGIN,
        authorization: "Bearer short",
        "content-type": "application/json",
      },
      body: { action: "uppercase", content: "x" },
    });

    await handler(req, res);
    const out = res._get();

    expect(out.statusCode).toBe(401);
    expect(out.jsonBody?.error).toBe("Não autorizado");
  });

  it("getters memoizados acompanham mudança de env em runtime", async () => {
    process.env.ALLOWED_ORIGINS = "https://first.example";

    const denied = makeReqRes({
      method: "POST",
      headers: { origin: "https://second.example", "content-type": "application/json" },
      body: { action: "ping" },
    });

    await handler(denied.req, denied.res);
    expect(denied.res._get().statusCode).toBe(403);

    process.env.ALLOWED_ORIGINS = "https://second.example";

    const allowed = makeReqRes({
      method: "POST",
      headers: { origin: "https://second.example", "content-type": "application/json" },
      body: { action: "ping" },
    });

    await handler(allowed.req, allowed.res);
    expect(allowed.res._get().statusCode).toBe(200);
  });

  it("GATE-OneLogPerRequest | exatamente um log por request", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { req, res } = makeReqRes({
      method: "POST",
      headers: { ...VALID_ORIGIN, "content-type": "application/json" },
      body: { action: "ping" },
    });

    await handler(req, res);

    expect(res._get().statusCode).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);

    const firstArg = spy.mock.calls[0][0];
    const event = JSON.parse(firstArg);
    expect(event.requestId).toBeTypeOf("string");
    expect(event.method).toBe("POST");
    expect(event.action).toBe("ping");
    expect(event.status).toBe(200);
    expect(event.result).toBe("allow");
    expect(event.errorCode).toBeNull();
  });
});
