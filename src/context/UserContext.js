"use client";

import { createContext, useContext, useState } from "react";

//KONTEKST
const UserContext = createContext(undefined);

//FUNKCIJA KOJU MOGU DA KORISTE DRUGE KOMPONENTE
//ZA DOBAVLJANJE KONTEKSTA
export function useUserContext() {
  return useContext(UserContext);
}

//WRAPPER ZA DEFINISANJE GLOBALNOG KONTEXSTA
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
