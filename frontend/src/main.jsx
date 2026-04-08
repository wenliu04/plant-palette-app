import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { inject } from '@vercel/analytics';
import './index.css'
import App from './App.jsx'
import PaletteBoard from "./pages/PaletteBoard.jsx";

inject();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/board" element={<PaletteBoard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
