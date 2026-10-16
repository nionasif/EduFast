// Resilient DOM manipulation for Google Chrome automatic translation & browser extension compatibility
// Prevents React 18/19 from crashing with NotFoundError: Failed to execute 'removeChild' on 'Node'
if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console && console.warn) {
        console.warn('[EduFast DOM Guard] Prevented removeChild crash from external translation/extension mutation');
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console && console.warn) {
        console.warn('[EduFast DOM Guard] Prevented insertBefore crash from external translation/extension mutation');
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './responsive.css';
import App from './App.jsx';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
