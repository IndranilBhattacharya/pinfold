import * as React from 'react';
import { createRoot } from 'react-dom/client';

import '@knotui/core/reset.css';
import '@knotui/core/styles.css';
import '@knotui/accordion/styles.css';
import './docs.css';

import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
