import { Link, Navigate } from "react-router-dom";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import AnimationWraper from "../common/page-animation";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { useContext, useRef } from "react";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";

const UserAuthForm = ({ type }) => {
  // FIX: use useRef to properly access the form element
  const formRef = useRef(null);

  const {
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  const UserAuthThroughServer = (serverRoute, formData) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
      .then(({ data }) => {
        storeInSession("user", JSON.stringify(data));
        setUserAuth(data);
        toast.success(type === "sign-in" ? "Welcome back! 👋" : "Account created! 🎉");
      })
      .catch(({ response }) => {
        toast.error(response?.data?.error || "Something went wrong");
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const serverRoute = type === "sign-in" ? "/signin" : "/signup";

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    // FIX: use formRef.current instead of the undefined `forElement` 
    const form = new FormData(formRef.current);
    const formData = {};
    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    const { fullname, email, password } = formData;

    if (fullname && fullname.length < 3) {
      return toast.error("Full name must be at least 3 letters");
    }
    if (!email?.length) {
      return toast.error("Enter your email");
    }
    if (!emailRegex.test(email)) {
      return toast.error("Invalid email address");
    }
    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password: 6–20 chars with a number, uppercase & lowercase letter"
      );
    }

    UserAuthThroughServer(serverRoute, formData);
  };

  const handleGoogleAuth = (e) => {
    e.preventDefault();
    authWithGoogle()
      .then((user) => {
        UserAuthThroughServer("/google-auth", { access_token: user.accessToken });
      })
      .catch((err) => {
        toast.error("Trouble signing in with Google");
        console.error(err);
      });
  };

  if (access_token) return <Navigate to="/" />;

  return (
    <AnimationWraper keyValue={type}>
      <section className="h-cover flex items-center justify-center">
        <Toaster position="top-right" />
        {/* FIX: use ref instead of id for form access */}
        <form
          ref={formRef}
          className="w-[90%] max-w-[420px]"
          onSubmit={handleSubmit}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-theme mb-2">
              {type === "sign-in" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted text-sm">
              {type === "sign-in"
                ? "Sign in to continue to your blog"
                : "Join thousands of writers today"}
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-1">
            {type !== "sign-in" && (
              <InputBox
                name="fullname"
                type="text"
                placeholder="Full Name"
                icon="fi fi-rr-user"
              />
            )}
            <InputBox
              name="email"
              type="email"
              placeholder="Email Address"
              icon="fi fi-rr-envelope"
            />
            <InputBox
              name="password"
              type="password"
              placeholder="Password"
              icon="fi fi-rr-lock"
            />
          </div>

          {/* Submit */}
          <button type="submit" className="btn-dark w-full mt-6 py-3">
            {type === "sign-in" ? "Sign In" : "Create Account"}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-6">
            <hr className="flex-1 border-theme" />
            <span className="text-xs text-muted uppercase font-semibold">or continue with</span>
            <hr className="flex-1 border-theme" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-theme font-semibold text-sm text-theme hover:bg-theme transition-all"
            onClick={handleGoogleAuth}
          >
            <img src={googleIcon} className="w-5 h-5 object-contain" alt="Google" />
            Continue with Google
          </button>

          {/* Footer Link */}
          <p className="mt-8 text-muted text-sm text-center">
            {type === "sign-in" ? (
              <>
                Don't have an account?{" "}
                <Link to="/signup" className="text-purple font-semibold underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already a member?{" "}
                <Link to="/signin" className="text-purple font-semibold underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </form>
      </section>
    </AnimationWraper>
  );
};

export default UserAuthForm;
