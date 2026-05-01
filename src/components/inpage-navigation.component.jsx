import { useEffect, useRef, useState } from "react";

export let activeTabLineRef;
export let activeTabRef;

const InPageNavigation = ({
  routes,
  defaultHidden = [],
  defaultActiveIndex = 0,
  children,
}) => {
  activeTabLineRef = useRef();
  activeTabRef    = useRef();

  const [inPageNavIndex, setInPageNavIndex] = useState(defaultActiveIndex);

  const changePageState = (btn, i) => {
    const { offsetWidth, offsetLeft } = btn;
    activeTabLineRef.current.style.width = offsetWidth + "px";
    activeTabLineRef.current.style.left  = offsetLeft  + "px";
    setInPageNavIndex(i);
  };

  useEffect(() => {
    changePageState(activeTabRef.current, defaultActiveIndex);
  }, []);

  return (
    <>
      <div className="relative mb-8 border-b border-theme flex flex-nowrap overflow-x-auto bg-theme">
        {routes.map((route, i) => (
          <button
            ref={i === defaultActiveIndex ? activeTabRef : null}
            key={i}
            // FIX: was missing space before "text-black" when active, causing "capitalize text-black" to merge
            className={`p-4 px-5 capitalize text-sm font-medium transition-colors whitespace-nowrap ${
              inPageNavIndex === i ? " text-theme" : " text-muted"
            } ${defaultHidden.includes(route) ? " md:hidden" : ""}`}
            onClick={(e) => changePageState(e.target, i)}
          >
            {route}
          </button>
        ))}

        {/* Active underline indicator */}
        <hr
          ref={activeTabLineRef}
          className="absolute bottom-0 duration-300 border-b-2 border-purple"
          style={{ borderColor: "var(--color-accent)" }}
        />
      </div>

      {Array.isArray(children) ? children[inPageNavIndex] : children}
    </>
  );
};

export default InPageNavigation;
