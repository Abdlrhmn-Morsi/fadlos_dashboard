import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import App from './App'
import './index.css'
import './i18n'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <RecoilRoot>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RecoilRoot>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
