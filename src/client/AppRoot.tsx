import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import {ConfirmProvider} from './components/ConfirmDialog';
import {GlobalLoadingBar} from './components/GlobalLoadingBar';
import {AppDataProvider} from './context/AppDataContext';
import './index.css';

export default function AppRoot() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <AppDataProvider>
          <GlobalLoadingBar />
          <App />
        </AppDataProvider>
      </ConfirmProvider>
    </BrowserRouter>
  );
}
