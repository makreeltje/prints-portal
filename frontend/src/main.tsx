import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// The design system is imported straight from its folder; never copy it into src.
import '../../design-system/tokens.css';
import '../../design-system/components/bundle.css';
import './styles/app.css';
import { App } from './App';

const container = document.getElementById('root');
if (container === null) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
