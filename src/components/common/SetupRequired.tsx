import React from 'react';

export const SetupRequired: React.FC = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a', // dark slate
            color: '#e2e8f0',
            textAlign: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                padding: '3rem',
                borderRadius: '1rem',
                border: '1px solid #334155',
                maxWidth: '600px',
                width: '100%'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛠️</div>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: '#2dd4bf' // teal-400
                }}>
                    נדרשת הגדרה ראשונית
                </h1>
                <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                    המערכת מזהה שקובץ הקונפיגורציה של Firebase טרם עודכן.
                    <br />
                    כדי להפעיל את האפליקציה, יש לעדכן את הקובץ:
                </p>
                <div style={{
                    background: '#0f172a',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontFamily: 'monospace',
                    textAlign: 'left',
                    direction: 'ltr',
                    marginBottom: '2rem',
                    border: '1px solid #1e293b'
                }}>
                    src/config/firebase.ts
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    יש להזין את מפתחות ה-API האמיתיים ממסוף Firebase.
                </p>
            </div>
        </div>
    );
};
