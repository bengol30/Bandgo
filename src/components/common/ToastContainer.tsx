// ============================================
// bandgo - Toast Container Component
// ============================================

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToast, ToastType } from '../../contexts/ToastContext';

const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={20} color="var(--color-success)" />,
    error: <XCircle size={20} color="var(--color-error)" />,
    warning: <AlertCircle size={20} color="var(--color-warning)" />,
    info: <Info size={20} color="var(--color-info)" />,
};

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    {iconMap[toast.type]}
                    <span>{toast.message}</span>
                    <button
                        className="btn btn-icon btn-ghost btn-icon-sm"
                        onClick={() => removeToast(toast.id)}
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
