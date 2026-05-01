import { useState } from "react";

// FIX: Props must be destructured from the object parameter, not as separate params
const InputBox = ({ name, type, placeholder, id, value, icon, disabled }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="relative w-full mb-4">
      <input
        name={name}
        type={type === "password" ? (passwordVisible ? "text" : "password") : type}
        placeholder={placeholder}
        defaultValue={value}
        id={id}
        disabled={disabled}
        className="input-box"
      />
      <i className={`${icon} input-icon text-dark-grey`}></i>

      {type === "password" && (
        <button
          type="button"
          className="fi input-icon left-auto right-4 cursor-pointer text-dark-grey"
          onClick={() => setPasswordVisible((v) => !v)}
        >
          <i className={`fi fi-rr-eye${!passwordVisible ? "-crossed" : ""}`}></i>
        </button>
      )}
    </div>
  );
};

export default InputBox;
