import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import AnimationWraper from "../common/page-animation";
import Loader from "../components/loader.component";
import AboutUser from "../components/about.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import InPageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import NotDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import PageNotFound from "./404.page";
import BlogActions from "../components/blog-actions.component";
import { UserContext } from "../App";

export const profileDataStructure = {
  personal_info: { fullname: "", username: "", profile_img: "", bio: "" },
  account_info:  { total_posts: 0, total_reads: 0 },
  social_links:  {},
  joinedAt:      "",
};

const ProfilePage = () => {
  const { id: profileId } = useParams();
  const { userAuth } = useContext(UserContext);

  const [profile, setProfile]           = useState(profileDataStructure);
  const [loading, setLoading]           = useState(true);
  const [blogs, setBlogs]               = useState(null);
  const [profileLoaded, setProfileLoaded] = useState("");

  const isOwnProfile = userAuth?.access_token && userAuth?.username === profileId;

  const {
    personal_info: { fullname, username: profile_username, profile_img, bio },
    account_info:  { total_posts, total_reads },
    social_links,
    joinedAt,
    _id: profileUserId,
  } = profile;

  const fetchUserProfile = () => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", { username: profileId })
      .then(({ data: user }) => {
        if (user) setProfile(user);
        setProfileLoaded(profileId);
        getBlogs({ user_id: user._id });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const getBlogs = ({ page = 1, user_id }) => {
    const id = user_id ?? blogs?.user_id;
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blog", { author: id, page })
      .then(async ({ data }) => {
        const formattedData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          counteRoute: "/search-blog-count",
          data_to_send: { author: id },
        });
        formattedData.user_id = id;
        setBlogs(formattedData);
      });
  };

  useEffect(() => {
    if (profileId !== profileLoaded) {
      setBlogs(null);
      setProfile(profileDataStructure);
      setLoading(true);
      setProfileLoaded("");
    }
    if (blogs == null) fetchUserProfile();
  }, [profileId, blogs]);

  return (
    <AnimationWraper>
      {loading ? (
        <Loader />
      ) : profile_username?.length ? (
        <section className="h-cover md:flex flex-row-reverse items-start gap-8 min-[1100px]:gap-12">
          {/* Sidebar */}
          <div className="flex flex-col max-md:items-center gap-4 min-w-[260px] md:w-[45%] md:pl-8 md:border-l border-theme md:sticky md:top-[100px] md:py-10">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile_img}
                className="w-40 h-40 md:w-28 md:h-28 rounded-full object-cover ring-4 ring-purple/20"
                alt={fullname}
              />
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-xl font-bold text-theme">@{profile_username}</h1>
              <p className="text-sm text-muted capitalize mt-0.5">{fullname}</p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-xl font-bold text-theme">{total_posts?.toLocaleString()}</p>
                <p className="text-xs text-muted">Posts</p>
              </div>
              <div>
                <p className="text-xl font-bold text-theme">{total_reads?.toLocaleString()}</p>
                <p className="text-xs text-muted">Reads</p>
              </div>
            </div>

            <AboutUser
              className="max-md:hidden"
              bio={bio}
              social_links={social_links}
              joinedAt={joinedAt}
            />
          </div>

          {/* Main Content */}
          <div className="max-md:mt-10 w-full">
            <InPageNavigation routes={["Blogs", "About"]} defaultHidden={["About"]}>
              <>
                {blogs == null ? (
                  <Loader />
                ) : blogs.results?.length ? (
                  blogs.results.map((blog, i) => (
                    <AnimationWraper transition={{ duration: 1, delay: i * 0.08 }} key={i}>
                      <div className="relative group">
                        <BlogPostCard content={blog} author={blog.author.personal_info} />
                        {/* Edit/Delete actions for own blogs */}
                        {isOwnProfile && (
                          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <BlogActions 
                              blog={blog} 
                              authorId={profileUserId}
                              onDelete={() => {
                                // Refresh blogs after delete
                                setBlogs(prev => ({
                                  ...prev,
                                  results: prev.results.filter(b => b.blog_id !== blog.blog_id)
                                }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </AnimationWraper>
                  ))
                ) : (
                  <NotDataMessage message="No blogs published yet" />
                )}
                <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} />
              </>
              <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} />
            </InPageNavigation>
          </div>
        </section>
      ) : (
        <PageNotFound />
      )}
    </AnimationWraper>
  );
};

export default ProfilePage;
