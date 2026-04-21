import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import DirectionProvider from "./i18n/DirectionProvider";
import { ChatProvider } from "./context/ChatProvider";
import { UserProvider } from "./context/UserProvider";
import { PresenceProvider } from "./context/PresenceProvider";
import { TypingProvider } from "./context/TypingProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DirectionProvider>
      <UserProvider>
        <PresenceProvider>
          <TypingProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </TypingProvider>
        </PresenceProvider>
      </UserProvider>
    </DirectionProvider>
  </React.StrictMode>
);
