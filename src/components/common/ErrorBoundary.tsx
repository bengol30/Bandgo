// ============================================
// bandgo - Error Boundary
// ============================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container">
                    <div className="error-boundary-content">
                        <AlertCircle size={48} className="error-icon" />
                        <h1>אופס! משהו השתבש</h1>
                        <p className="error-message">
                            אל דאגה, אנחנו עובדים על זה. נסה לרענן את העמוד.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            <RotateCcw size={18} />
                            רענן את העמוד
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Simple styles for the error boundary
const styles = `
.error-boundary-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    text-align: center;
}

.error-boundary-content {
    background: var(--color-bg-secondary);
    padding: 3rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    max-width: 400px;
    width: 90%;
}

.error-icon {
    color: #ef4444;
    margin-bottom: 1.5rem;
}

.error-message {
    color: var(--color-text-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
}
`;

// Inject styles dynamically as we don't have a CSS file for this
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
