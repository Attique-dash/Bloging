import { useContext, useState } from "react";
import logo from "../imgs/logo.png";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import UserNavigationPanel from "./user-navigation.component";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const [searchboxVisibility, setSearchboxVisibility] = useState(false);
  const [userNavPanel, setUserNavPanel] = useState(false);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const {
    userAuth: { access_token, profile_img },
  } = useContext(UserContext);

  const handleSearch = (e) => {
    const query = e.target.value;
    if (e.keyCode === 13 && query.length) {
      navigate(`/search/${query}`);
    }
  };

  const handleBlur = (e) => {
    // Only close if the new focused element is outside the nav panel
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setUserNavPanel(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <Link to="/" className="flex-none w-10 h-10">
          <img src={logo} className="w-full object-contain" alt="Logo" />
        </Link>

        {/* Search Bar */}
        <div
          className={
            "absolute bg-theme w-full left-0 top-full mt-0.5 border-b border-theme py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto md:show " +
            (searchboxVisibility ? "show" : "hide")
          }
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search blogs, topics, people…"
              className="w-full md:w-64 lg:w-80 input-box py-3 pl-10 pr-4 text-sm"
              style={{ paddingLeft: "2.5rem" }}
              onKeyDown={handleSearch}
            />
            <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-muted"></i>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* Mobile search toggle */}
          <button
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-theme surface"
            onClick={() => setSearchboxVisibility((v) => !v)}
          >
            <i className="fi fi-rr-search text-lg text-muted"></i>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: "var(--color-surface)" }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <i className={`fi ${theme === "dark" ? "fi-rr-sun" : "fi-rr-moon"} text-sm`} style={{ color: "var(--color-muted)" }}></i>
          </button>

          {/* Write Button */}
          <Link
            to="/editor"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
          >
            <i className="fi fi-rr-file-edit text-sm"></i>
            Write
          </Link>

          {/* Auth */}
          {access_token ? (
            <div
              className="relative"
              tabIndex={-1}
              onClick={() => setUserNavPanel((v) => !v)}
              onBlur={handleBlur}
            >
              <button className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple/30 hover:ring-purple/60 transition-all" tabIndex={-1}>
                <img src={profile_img} className="w-full h-full object-cover" alt="Profile" />
              </button>
              {userNavPanel && <UserNavigationPanel />}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link className="btn-dark py-2 px-5 text-sm" to="/signin">
                Sign In
              </Link>
              <Link className="btn-light py-2 px-5 text-sm hidden md:block" to="/signup">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
      <Outlet />
    </>
  );
};

export default Navbar;
