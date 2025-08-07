import React from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../Context/ThemeContext";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-10 w-10 items-center justify-center
        rounded-lg border border-gray-200 bg-white text-gray-700
        transition-all duration-200 hover:bg-gray-50 hover:text-gray-900
        dark:border-dark-600 dark:bg-dark-800 dark:text-dark-300
        dark:hover:bg-dark-700 dark:hover:text-dark-100
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-dark-800
        ${className}
      `}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="relative">
        {theme === "light" ? (
          <FiMoon className="h-5 w-5 transition-transform duration-200" />
        ) : (
          <FiSun className="h-5 w-5 transition-transform duration-200" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;