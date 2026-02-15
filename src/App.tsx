import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SetupRequired } from './components/common/SetupRequired';
import { AppRoutes } from './routes/AppRoutes';
import { firebaseConfig } from './config/firebase';

// Helper to check if config is valid
const isConfigValid = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};

// Main App Component
function App() {
  if (!isConfigValid()) {
    return <SetupRequired />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
