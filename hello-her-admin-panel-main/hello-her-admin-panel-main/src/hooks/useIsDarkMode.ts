import { useEffect, useState } from "react";

const useIsDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkClass = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkClass();

    const observer = new MutationObserver(checkDarkClass);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode((prev) => !prev);
  };

  return { isDarkMode, toggleDarkMode };
};

export default useIsDarkMode;
