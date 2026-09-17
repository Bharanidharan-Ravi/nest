import SaveRecoveryCodeModal from "./SaveRecoveryCodeModal";
import UnlockChatModal from "./UnlockChatModal";

/** Global chat key dialogs — mounted once in App so they work on any page. */
export default function ChatIdentityModals() {
  return (
    <>
      <SaveRecoveryCodeModal />
      <UnlockChatModal />
    </>
  );
}
