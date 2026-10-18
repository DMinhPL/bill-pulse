import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import {ConfirmProvider} from './components/ConfirmDialog';
import {GlobalLoadingBar} from './components/GlobalLoadingBar';
import {AppDataProvider} from './context/AppDataContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ConfirmProvider>
      <AppDataProvider>
        <GlobalLoadingBar />
        <App />
      </AppDataProvider>
    </ConfirmProvider>
  </BrowserRouter>
);
