import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Blinkit Tracker Error Boundary caught:', error, errorInfo);
  }

  handleReset = async () => {
    try {
      indexedDB.deleteDatabase('BlinkitDeepCleaningDB');
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            backgroundColor: '#1e293b',
            padding: '32px',
            borderRadius: '24px',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#f59e0b',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '900',
              margin: '0 auto 16px'
            }}>
              b
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
              Blinkit Deep Cleaning Tracker
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              Application me ek temporary issue aaya hai:
            </p>
            <div style={{
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#ef4444',
              fontFamily: 'monospace',
              textAlign: 'left',
              marginBottom: '24px',
              overflowX: 'auto',
              maxHeight: '120px'
            }}>
              {this.state.error?.message || String(this.state.error)}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#0c831f',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reset Database &amp; Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for Offline PWA Capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update().catch(() => {});
        console.log('Blinkit PWA Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('Blinkit PWA Service Worker registration failed:', err);
      });
  });
}
