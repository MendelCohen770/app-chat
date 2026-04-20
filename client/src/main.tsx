import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import DirectionProvider from "./i18n/DirectionProvider";
import { ChatProvider } from "./context/ChatProvider";
import { UserProvider } from "./context/UserProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DirectionProvider>
      <UserProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </UserProvider>
    </DirectionProvider>
  </React.StrictMode>
);
