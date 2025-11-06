"use client";

import { createContext, useContext, useState, useEffect } from "react";

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
  const [loading, setLoading] = useState(true);

  //THIS IS NEEDED BECAUSE OF BROWSER REFRESH
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/me");

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUser(null); // On error, assume no user is logged in
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return null; // or spinner

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
