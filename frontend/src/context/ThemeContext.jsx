import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return "dark";
  });

  const [systemSync, setSystemSync] = useState(() => {
    const savedSync = localStorage.getItem("theme_system_sync");
    return savedSync === "true";
  });

  // Track system OS settings changes
  useEffect(() => {
    if (systemSync) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = (e) => {
        setTheme(e.matches ? "dark" : "light");
      };
      setTheme(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      localStorage.setItem("theme_system_sync", "true");
      return () =>
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
    } else {
      localStorage.setItem("theme_system_sync", "false");
    }
  }, [systemSync]);

  // Apply theme settings to DOM documentElement
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setSystemSync(false);
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleSystemSync = () => {
    setSystemSync((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, systemSync, toggleTheme, toggleSystemSync }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
