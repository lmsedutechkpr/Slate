import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') document.documentElement.classList.add('dark');
} catch {}

createRoot(document.getElementById("root")).render(<App />);
