import { useEffect, useState } from "react";
import AnimationWraper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import axios from "axios";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import NotDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

const categories = [
  "programming", "hollywood", "film making", "social media",
  "cooking", "tech", "finance", "travel", "health", "science",
];

const HomePage = () => {
  const [blogs, setBlogs]           = useState(null);
  const [trendingBlogs, setTrendingBlogs] = useState(null);
  const [pageState, setPageState]   = useState("home");
  const [error, setError]           = useState(null);

  const fetchLatestBlogs = (page = 1) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs", { page })
      .then(async ({ data }) => {
        const formatData = await filterPaginationData({
          state: page > 1 ? blogs : null,
          data: data.blogs,
          page,
          counteRoute: "/all-latest-blogs-count",
        });
        setBlogs(formatData);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch blogs:", err);
        setBlogs({ results: [], totalDocs: 0, page: 1 });
        setError("Failed to load blogs. Check your server connection.");
      });
  };

  const fetchBlogsByCategory = (page = 1) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blog", { tag: pageState, page })
      .then(async ({ data }) => {
        const formatData = await filterPaginationData({
          state: page > 1 ? blogs : null,
          data: data.blogs,
          page,
          counteRoute: "/search-blog-count",
          data_to_send: { tag: pageState },
        });
        setBlogs(formatData);
      })
      .catch(console.error);
  };

  const fetchTrendingBlogs = () => {
    axios
      .get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
      .then(({ data }) => setTrendingBlogs(data.blogs))
      .catch((err) => {
        console.error("Failed to fetch trending:", err);
        setTrendingBlogs([]);
      });
  };

  const loadBlogByCategory = (e) => {
    const category = e.target.innerText.toLowerCase();
    setBlogs(null);
    if (pageState === category) { setPageState("home"); return; }
    setPageState(category);
  };

  useEffect(() => {
    activeTabRef.current.click();
    if (pageState === "home") {
      fetchLatestBlogs(1);
    } else {
      fetchBlogsByCategory(1);
    }
    if (!trendingBlogs) fetchTrendingBlogs();
  }, [pageState]);

  const TrendingSection = () => (
    trendingBlogs == null ? (
      <Loader />
    ) : trendingBlogs.length ? (
      trendingBlogs.map((blog, i) => (
        <AnimationWraper transition={{ duration: 1, delay: i * 0.08 }} key={i}>
          <MinimalBlogPost blog={blog} index={i} />
        </AnimationWraper>
      ))
    ) : (
      <NotDataMessage message="No Trending Blogs" />
    )
  );

  return (
    <AnimationWraper>
      <section className="h-cover flex justify-center gap-10">
        {/* Main Feed */}
        <div className="w-full">
          <InPageNavigation
            routes={[pageState === "home" ? "Latest" : pageState, "Trending"]}
            defaultHidden={["Trending"]}
          >
            {/* Tab 1: Blog Feed */}
            <>
              {error && (
                <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <p className="font-medium">⚠️ {error}</p>
                  <p className="mt-1 text-xs">Make sure your server is running and VITE_SERVER_DOMAIN is set in .env</p>
                </div>
              )}
              {blogs == null ? (
                <Loader />
              ) : blogs.results?.length ? (
                blogs.results.map((blog, i) => (
                  <AnimationWraper transition={{ duration: 1, delay: i * 0.06 }} key={i}>
                    <BlogPostCard content={blog} author={blog.author.personal_info} />
                  </AnimationWraper>
                ))
              ) : (
                <NotDataMessage message="No blogs published yet" />
              )}
              <LoadMoreDataBtn
                state={blogs}
                fetchDataFun={pageState === "home" ? fetchLatestBlogs : fetchBlogsByCategory}
              />
            </>

            {/* Tab 2: Trending (mobile) */}
            <TrendingSection />
          </InPageNavigation>
        </div>

        {/* Sidebar */}
        <div className="min-w-[300px] xl:min-w-[350px] border-l border-theme pl-8 pt-3 max-md:hidden">
          {/* Categories */}
          <div className="mb-10">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted mb-4">
              Browse Topics
            </h2>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat, i) => (
                <button
                  key={i}
                  onClick={loadBlogByCategory}
                  className={`tag text-xs transition-all ${
                    pageState === cat
                      ? "bg-purple text-white border-purple"
                      : ""
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
              Trending <i className="fi fi-rr-arrow-trend-up text-purple"></i>
            </h2>
            <TrendingSection />
          </div>
        </div>
      </section>
    </AnimationWraper>
  );
};

export default HomePage;
