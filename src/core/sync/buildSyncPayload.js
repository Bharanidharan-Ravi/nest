export const buildSyncPayload = ({
  configKey,
  repoId,
  idKey,
  idValue
}) => {
  const payload = {
    ConfigKeys: [configKey]
  }

  if (repoId || idValue) {
    payload.Params = {
      [configKey]: {}
    }

    if (repoId) {
      payload.Params[configKey].repoId = repoId
    }

    if (idKey && idValue) {
      payload.Params[configKey][idKey] = idValue
    }
  }

  return payload
}
