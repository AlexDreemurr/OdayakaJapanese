import React from "react";

export const MessagesContext = React.createContext(null);

export function useAppMessages() {
  const context = React.useContext(MessagesContext);

  if (!context) {
    throw new Error("useAppMessages must be used inside AppMessagesProvider.");
  }

  return context;
}
