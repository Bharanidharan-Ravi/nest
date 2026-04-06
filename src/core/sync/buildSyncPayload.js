/**
 * Generates a sync payload for the API.
 * Supports repoId, legacy idKey/Value pairs, and any additional custom parameters.
 */


export const buildSyncPayload = ({
  configKey,        // string OR array
  repoId,
  idKey,
  idValue,
  customParams = {}
}) => {
  const configKeys = Array.isArray(configKey) ? configKey : [configKey];

  const payload = {
    ConfigKeys: configKeys
  };

  const hasParams =
    repoId || (idKey && idValue) || Object.keys(customParams).length > 0;

  if (hasParams) {
    payload.Params = {};

    configKeys.forEach((key) => {
      payload.Params[key] = {
        ...(repoId && { repoId }),
        ...(idKey && idValue && { [idKey]: idValue }),
        ...customParams
      };
    });
  }

  return payload;
};


// export const buildSyncPayload = ({
//   configKey,
//   repoId,
//   idKey,
//   idValue,
//   customParams = {} // This allows you to pass { FromDate: '...', ToDate: '...' }
// }) => {
//   const payload = {
//     ConfigKeys: [configKey]
//   };

//   // We only create the Params object if there is actually data to send
//   const hasParams = repoId || (idKey && idValue) || Object.keys(customParams).length > 0;

//   if (hasParams) {
//     payload.Params = {
//       [configKey]: {
//         // Add repoId if it exists
//         ...(repoId && { repoId }),
        
//         // Add idKey/Value pair if they both exist (Legacy support)
//         ...(idKey && idValue && { [idKey]: idValue }),
        
//         // Spread any other params (like FromDate and ToDate) directly into the object
//         ...customParams 
//       }
//     };
//   }

//   return payload;
// };