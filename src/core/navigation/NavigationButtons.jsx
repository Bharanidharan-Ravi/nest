// src/components/NavigationButtons/NavigationButtons.jsx

import { useSmartNavigation } from '../../hooks/useSmartNavigation';

export const NavigationButtons = () => {
  const { 
    goBack, 
    goForward, 
    goToCreate, 
    canGoBack, 
    canGoForward, 
    canCreate 
  } = useSmartNavigation();

  return (
    <div className="navigation-buttons">
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
