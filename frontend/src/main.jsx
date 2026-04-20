import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { inject } from '@vercel/analytics';
import './index.css'
import App from './App.jsx'
const PaletteBoard = lazy(() => import("./pages/PaletteBoard.jsx"));

inject();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading page...</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/board" element={<PaletteBoard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
