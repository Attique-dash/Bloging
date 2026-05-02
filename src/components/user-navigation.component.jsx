import { Link } from "react-router-dom";
import AnimationWraper from "../common/page-animation";
import { UserContext } from "../App";
import { removeFromSession } from "../common/session";
import { useContext } from "react";

const UserNavigationPanel = () => {
  const {
    userAuth: { username },
    setUserAuth,
  } = useContext(UserContext);

  const signOutUser = () => {
    removeFromSession("user");
    setUserAuth({ access_token: null });
  };
  return (
    <AnimationWraper
      className="absolute right-0 z-50 "
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white aosolute right-0 border border-lg w-60 overflow-hidden duration-200">
        <Link to="/editor" className="flex gap-2 link md:hidden pl-8 ">
          <i className="fi fi-rr-file-edit"></i>
          {/* <p>write</p> */}
          <b>write</b>
        </Link>
        <span className="absolute border-t border-lg w-[100%]"></span>
        <Link to={`/user/${username}`} className="link pl-8 py-4">
          <b>Profile</b>
        </Link>
       
        <span className="absolute border-t border-lg w-[100%]"></span>
        <button
          className="text-left p-4 hover:bg-lg w-full pl-8 py-4 "
          onClick={signOutUser}
        >
          <p className="font-bold text-xl mg-1">Sign Out</p>
          <b className="text-dark-grey ">@{username}</b>
        </button>
      </div>
    </AnimationWraper>
  );
};
export default UserNavigationPanel;
