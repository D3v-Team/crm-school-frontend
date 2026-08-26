// App.jsx
import { Provider } from 'react-redux';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import AppRouter from './app/router/AppRouter';
import { store } from './store';
import { useEffect } from 'react';

function RouterWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    const onLogout = () => navigate('/login');
    window.addEventListener('app:logout', onLogout);
    return () => window.removeEventListener('app:logout', onLogout);
  }, [navigate]);

  return <AppRouter />;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <RouterWrapper />
      </BrowserRouter>
    </Provider>
  );
}
