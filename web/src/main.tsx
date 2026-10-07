import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import Guide from './Guide.tsx'
import Home from './Home.tsx'
import Manual from './Manual.tsx'
import Status from './Status.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="guide" element={<Guide />} />
          <Route path="manual" element={<Manual />} />
          <Route path="manual/:game" element={<Manual />} />
          <Route path="status" element={<Status />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
