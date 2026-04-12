import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import App from './App';
import { UserProvider } from './context/UserContext';
import { FormDraftStorageProvider } from './context/FormDraftStorageContext';
import { appTheme } from './theme/appTheme';
import './styles/fonts.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={appTheme} defaultColorScheme="light">
        <ModalsProvider
          modalProps={{
            closeOnClickOutside: false,
            zIndex: 1200,
          }}
        >
          <Notifications position="top-right" zIndex={4000} />
          <BrowserRouter basename="/app/">
            <UserProvider>
              <FormDraftStorageProvider>
                <App />
              </FormDraftStorageProvider>
            </UserProvider>
          </BrowserRouter>
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
