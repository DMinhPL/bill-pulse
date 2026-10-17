import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ConfirmProvider} from './components/ConfirmDialog';
import {GlobalLoadingBar} from './components/GlobalLoadingBar';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ConfirmProvider>
    <GlobalLoadingBar />
    <App />
  </ConfirmProvider>
);
