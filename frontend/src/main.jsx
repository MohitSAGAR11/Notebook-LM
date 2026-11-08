import React from "react";
import ReactDOM from "react-dom/client";
// Global styles first so component stylesheets win ties in the cascade.
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/forms.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
