import { AvatarDataContext, useAvatarDataSource } from "./avatarData";

// One master-data / presence subscription shared by every SmartAvatar below
export function AvatarDataProvider({ children }) {
  const value = useAvatarDataSource();
  return (
    <AvatarDataContext.Provider value={value}>
      {children}
    </AvatarDataContext.Provider>
  );
}
