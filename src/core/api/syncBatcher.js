// Merges /sync/v2 requests that start together (the queries a screen mounts at
// once) into a single call. ConfigKeys and Params are combined, and each caller
// gets back only its own keys, in the same shape as before.
//
// The server runs every key in parallel and reports Ok/Err per key (207 when
// only some fail), so a failing key fails only the caller that asked for it.
// A request is sent on its own when it repeats a key already in the batch
// (different Params for the same key), carries anything besides
// ConfigKeys/Params, or passes config._noBatch.

import { useUIStore } from "../state/useUIStore";

export const SYNC_URL = "/sync/v2";
// Long enough to catch every query of one render pass, short enough not to be felt
const BATCH_WINDOW_MS = 15;

const readPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const { ConfigKeys, configKeys, Params, params, ...rest } = payload;
  const keys = ConfigKeys ?? configKeys;
  if (Object.keys(rest).length || !Array.isArray(keys) || !keys.length) return null;
  return { keys, params: Params ?? params ?? {} };
};

const isBatchable = ({ url, method = "GET", payload, config }) =>
  url === SYNC_URL && method === "POST" && !config?._noBatch && !!readPayload(payload);

const keyFailed = (section) => section?.Ok === false;

// Same as a lone request whose keys all failed: the API answers 500 and the
// response interceptor shows the first key's message
function failedError(keys, res) {
  const subset = Object.fromEntries(keys.map((k) => [k, res?.[k]]));
  const message = keys.map((k) => res?.[k]?.Err?.M).find(Boolean) ?? "Something went wrong";
  const error = new Error(message);
  error.response = { status: 500, data: { Res: subset } };
  return error;
}

/** Wraps an executeApi-style `send` so concurrent /sync/v2 calls share one request. */
export function createSyncBatcher(send, { windowMs = BATCH_WINDOW_MS } = {}) {
  let batches = [];
  let timer = null;

  const sendBatch = async (entries) => {
    if (entries.length === 1) {
      const [only] = entries;
      send(only.options).then(only.resolve, only.reject);
      return;
    }

    const params = Object.assign({}, ...entries.map((e) => e.params));
    const payload = { ConfigKeys: entries.flatMap((e) => e.keys) };
    if (Object.keys(params).length) payload.Params = params;

    let res;
    try {
      res = await send({
        url: SYNC_URL,
        method: "POST",
        payload,
        config: {
          _silent: entries.every((e) => e.config._silent),
          _noErrorToast: entries.every((e) => e.config._noErrorToast),
        },
      });
    } catch (err) {
      entries.forEach((e) => e.reject(err));
      return;
    }

    entries.forEach((e) => {
      if (!e.keys.every((k) => keyFailed(res?.[k]))) {
        e.resolve(Object.fromEntries(e.keys.map((k) => [k, res?.[k]])));
        return;
      }
      const error = failedError(e.keys, res);
      if (!e.config._noErrorToast) useUIStore.getState().setError(error.message);
      e.reject(error);
    });
  };

  const flush = () => {
    const pending = batches;
    batches = [];
    timer = null;
    pending.forEach((batch) => sendBatch(batch.entries));
  };

  return (options) => {
    if (!isBatchable(options)) return send(options);

    const { keys, params } = readPayload(options.payload);
    return new Promise((resolve, reject) => {
      let batch = batches.find((b) => keys.every((k) => !b.keys.has(k)));
      if (!batch) {
        batch = { keys: new Set(), entries: [] };
        batches.push(batch);
      }
      keys.forEach((k) => batch.keys.add(k));
      batch.entries.push({ options, keys, params, config: options.config ?? {}, resolve, reject });
      timer ??= setTimeout(flush, windowMs);
    });
  };
}
