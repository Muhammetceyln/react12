import { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // YENİ: Kütüphaneyi import ettik

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(null); // YENİ: Kullanıcı bilgisini tutmak için state

  useEffect(() => {
    // Token her değiştiğinde veya sayfa ilk yüklendiğinde çalışır
    if (token) {
      try {
        const decodedUser = jwtDecode(token); // Token'ı çözümlüyoruz
        setUser(decodedUser); // Çözümlenen kullanıcı bilgisini state'e atıyoruz
      } catch (error) {
        console.error("Invalid token:", error); // Hatalı token varsa temizle
        setToken(null);
        setUser(null);
        localStorage.removeItem("authToken");
      }
    } else {
      setUser(null); // Token yoksa kullanıcıyı null yap
    }
  }, [token]); // Bu effect, token değiştiğinde yeniden çalışacak

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("authToken", newToken);
  };

  const logout = () => {
    setToken(null); // setUser(null) zaten useEffect tarafından yapılacak
    localStorage.removeItem("authToken");
  };

  const isAuthenticated = !!token; // Context'e artık 'user' bilgisini de ekliyoruz

  const value = { token, user, isAuthenticated, login, logout };

  return (
    <AuthContext.Provider value={value}>
            {children}   {" "}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
