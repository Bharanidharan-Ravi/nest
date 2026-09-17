import { executeApi } from "../../../core/api/executor";

// Background calls: no global loader
const silent = { _silent: true };

export const chatKeysApi = {
  getStatus: (deviceId) =>
    executeApi({
      url: "/ChatKeys/status",
      method: "GET",
      params: { deviceId },
      config: silent,
    }),

  registerIdentity: ({ deviceId, publicKey, deviceInfo }) =>
    executeApi({
      url: "/ChatKeys/identity",
      method: "POST",
      payload: { DeviceId: deviceId, PublicKey: publicKey, DeviceInfo: deviceInfo },
      config: silent,
    }),

  registerPreKey: ({ deviceId, keyId, publicKey, signature }) =>
    executeApi({
      url: "/ChatKeys/prekey",
      method: "POST",
      payload: { DeviceId: deviceId, KeyId: keyId, PublicKey: publicKey, Signature: signature },
      config: silent,
    }),

  // ASP.NET Core's [FromQuery] List<Guid> binds "userIds=a&userIds=b", not axios's
  // default "userIds[]=a&userIds[]=b" — build the query string ourselves to match.
  getParticipantKeys: (userIds) => {
    const query = new URLSearchParams();
    userIds.forEach((id) => query.append("userIds", id));
    return executeApi({
      url: `/ChatKeys/participants?${query.toString()}`,
      method: "GET",
      config: silent,
    });
  },
};
