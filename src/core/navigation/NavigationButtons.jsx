/**
 * src/core/routing/NavigationButtons.jsx
 * (or wherever you place this component)
 *
 * Only change from your original: import path fixed.
 */

import { useSmartNavigation } from "../../core/routing/useSmartNavigation";

export const NavigationButtons = () => {
  const {
    goBack,
    goForward,
    goToCreate,
    canGoBack,
    canGoForward,
    canCreate,
  } = useSmartNavigation();

  return (
    <div className="navigation-buttons flex items-center gap-2">
      {canGoBack() && (
        <button onClick={goBack} className="nav-btn back">
          ← Back
        </button>
      )}

      {canGoForward() && (
        <button onClick={goForward} className="nav-btn forward">
          Forward →
        </button>
      )}

      {canCreate() && (
        <button onClick={goToCreate} className="nav-btn create">
          + Create New
        </button>
      )}
    </div>
  );
};