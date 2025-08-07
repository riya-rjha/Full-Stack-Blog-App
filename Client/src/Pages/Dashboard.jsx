import React, { useState, useEffect, useContext } from "react";
import { AuthorizationContext } from "../Context/authContext";
import { 
  FiEdit, FiTrash2, FiEye, FiHeart, FiMessageCircle, 
  FiTrendingUp, FiUsers, FiBookmark, FiSettings,
  FiPlus, FiBarChart3, FiCalendar, FiClock
} from "react-icons/fi";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../Components/Loading";

const Dashboard = () => {
  const { user } = useContext(AuthorizationContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_baseURL}/user/dashboard`,
        { withCredentials: true }
      );
      
      setAnalytics(response.data.analytics);
      setPosts(response.data.posts);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_baseURL}/post/${postId}`,
        { withCredentials: true }
      );
      
      setPosts(posts.filter(post => post._id !== postId));
      toast.success("Post deleted successfully");
    } catch (error) {
      toast.error("Failed to delete post");
      console.error("Delete error:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "primary" }) => (
    <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-dark-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-dark-100 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-dark-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: FiBarChart3 },
    { id: "posts", label: "My Posts", icon: FiEdit },
    { id: "analytics", label: "Analytics", icon: FiTrendingUp },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-100">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-dark-400 mt-1">
              Welcome back, {user?.username}!
            </p>
          </div>
          <Link
            to="/write"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 
                     text-white rounded-lg font-medium transition-colors"
          >
            <FiPlus className="h-4 w-4 mr-2" />
            Write New Post
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-dark-600 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-300 hover:border-gray-300 dark:hover:border-dark-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && analytics && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={FiEdit}
                title="Total Posts"
                value={analytics.totalPosts || 0}
                subtitle="Published articles"
              />
              <StatCard
                icon={FiEye}
                title="Total Views"
                value={analytics.totalViews || 0}
                subtitle="All-time views"
                color="green"
              />
              <StatCard
                icon={FiHeart}
                title="Total Likes"
                value={analytics.totalLikes || 0}
                subtitle="Hearts received"
                color="red"
              />
              <StatCard
                icon={FiMessageCircle}
                title="Total Comments"
                value={analytics.totalComments || 0}
                subtitle="Discussions started"
                color="blue"
              />
            </div>

            {/* Recent Posts */}
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-600">
              <div className="p-6 border-b border-gray-200 dark:border-dark-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                  Recent Posts
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-dark-600">
                {posts.slice(0, 5).map((post) => (
                  <div key={post._id} className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-base font-medium text-gray-900 dark:text-dark-100 mb-1">
                        {post.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-dark-400">
                        <span className="flex items-center">
                          <FiCalendar className="h-3 w-3 mr-1" />
                          {formatDate(post.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <FiEye className="h-3 w-3 mr-1" />
                          {post.views || 0}
                        </span>
                        <span className="flex items-center">
                          <FiHeart className="h-3 w-3 mr-1" />
                          {post.likes?.length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/edit/${post._id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-600">
            <div className="p-6 border-b border-gray-200 dark:border-dark-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                  All Posts ({posts.length})
                </h3>
                <Link
                  to="/write"
                  className="inline-flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-700 
                           text-white text-sm rounded-lg font-medium transition-colors"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  New Post
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-dark-600">
              {posts.map((post) => (
                <div key={post._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        to={`/blog/${post._id}`}
                        className="text-lg font-medium text-gray-900 dark:text-dark-100 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-center space-x-6 mt-2 text-sm text-gray-500 dark:text-dark-400">
                        <span className="flex items-center">
                          <FiCalendar className="h-3 w-3 mr-1" />
                          {formatDate(post.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <FiEye className="h-3 w-3 mr-1" />
                          {post.views || 0} views
                        </span>
                        <span className="flex items-center">
                          <FiHeart className="h-3 w-3 mr-1" />
                          {post.likes?.length || 0} likes
                        </span>
                        <span className="flex items-center">
                          <FiMessageCircle className="h-3 w-3 mr-1" />
                          {post.comments?.length || 0} comments
                        </span>
                        <span className="flex items-center">
                          <FiClock className="h-3 w-3 mr-1" />
                          {post.readingTime || 1} min read
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={`/blog/${post._id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="View Post"
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/edit/${post._id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Edit Post"
                      >
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete Post"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {posts.length === 0 && (
                <div className="p-8 text-center">
                  <FiEdit className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-dark-100 mb-1">
                    No posts yet
                  </h3>
                  <p className="text-gray-500 dark:text-dark-400 mb-4">
                    Start sharing your thoughts with the world!
                  </p>
                  <Link
                    to="/write"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 
                             text-white rounded-lg font-medium transition-colors"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    Write Your First Post
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                icon={FiTrendingUp}
                title="Avg. Views per Post"
                value={Math.round(analytics.avgViews || 0)}
                subtitle="Performance metric"
              />
              <StatCard
                icon={FiUsers}
                title="Engagement Rate"
                value={`${Math.round(((analytics.totalLikes + analytics.totalComments) / (analytics.totalViews || 1)) * 100)}%`}
                subtitle="Likes + Comments / Views"
                color="green"
              />
              <StatCard
                icon={FiHeart}
                title="Like Rate"
                value={`${Math.round((analytics.totalLikes / (analytics.totalViews || 1)) * 100)}%`}
                subtitle="Likes per view"
                color="red"
              />
            </div>

            {/* Top Performing Posts */}
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-600">
              <div className="p-6 border-b border-gray-200 dark:border-dark-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                  Top Performing Posts
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-dark-600">
                {posts
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .slice(0, 5)
                  .map((post, index) => (
                    <div key={post._id} className="p-6 flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900 
                                    text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold mr-4">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <Link
                          to={`/blog/${post._id}`}
                          className="text-base font-medium text-gray-900 dark:text-dark-100 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {post.title}
                        </Link>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-dark-400">
                          <span>{post.views || 0} views</span>
                          <span>{post.likes?.length || 0} likes</span>
                          <span>{post.comments?.length || 0} comments</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-600 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-4">
              Account Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  defaultValue={user?.username}
                  className="w-full max-w-md border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2
                           bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  className="w-full max-w-md border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2
                           bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100"
                  disabled
                />
              </div>
              <div className="pt-4">
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg 
                                 font-medium transition-colors">
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;