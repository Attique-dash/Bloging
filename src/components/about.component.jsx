import { Link } from "react-router-dom";
import { getFullDay } from "../common/date";

const AboutUser = ({ bio, social_links, joinedAt, className }) => {
  return (
    <div className={`md:w-[90%] md:mt-7 ${className || ""}`}>
      {/* Bio */}
      <p className="text-base leading-7 text-theme">
        {bio?.length ? bio : "This user hasn't written a bio yet."}
      </p>

      {/* Social Links */}
      <div className="flex gap-4 flex-wrap my-6 items-center">
        {social_links &&
          Object.keys(social_links).map((key) => {
            const link = social_links[key];
            if (!link) return null;
            return (
              <Link to={link} key={key} target="_blank" rel="noopener noreferrer">
                {/* FIX: was "fi" + "fi-brands-" + key (missing space), now uses template literal */}
                <i
                  className={`fi ${key !== "website" ? `fi-brands-${key}` : "fi-rr-globe"} text-2xl text-muted hover:text-theme transition-colors`}
                ></i>
              </Link>
            );
          })}
      </div>

      {/* Join Date */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <i className="fi fi-rr-calendar"></i>
        <span>Joined {getFullDay(joinedAt)}</span>
      </div>
    </div>
  );
};

export default AboutUser;
