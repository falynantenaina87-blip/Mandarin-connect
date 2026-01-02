import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConvexProvider, ConvexClient } from "convex/react";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Connexion à la vraie base de données Convex
// Assurez-vous d'avoir VITE_CONVEX_URL dans votre fichier .env
const convexUrl = (import.meta as any).env.VITE_CONVEX_URL;

if (!convexUrl) {
  console.error("VITE_CONVEX_URL is missing via .env");
}

const convex = new ConvexClient(convexUrl || "https://failed-to-load-env.convex.cloud");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);