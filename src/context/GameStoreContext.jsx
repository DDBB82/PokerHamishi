import { createContext, useContext } from "react";
import { useGameStore } from "../hooks/useGameStore";

export const GameStoreContext = createContext(null);

export function GameStoreProvider({ children }) {
  const store = useGameStore();
  return <GameStoreContext.Provider value={store}>{children}</GameStoreContext.Provider>;
}

export function useStore() {
  return useContext(GameStoreContext);
}
