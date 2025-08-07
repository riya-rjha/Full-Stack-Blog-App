import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiFilter, FiX, FiTag, FiUser, FiFileText } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";

const AdvancedSearch = ({ onSearchResults, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [filters, setFilters] = useState({
    category: "",
    tags: "",
    author: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "relevance"
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popularTags, setPopularTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    // Fetch popular tags on mount
    fetchPopularTags();
  }, []);

  useEffect(() => {
    // Debounced search suggestions
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPopularTags = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_baseURL}/search/tags/popular`);
      setPopularTags(response.data.slice(0, 10));
    } catch (error) {
      console.error("Error fetching popular tags:", error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_baseURL}/search/suggestions?q=${encodeURIComponent(searchQuery)}`
      );
      setSuggestions(response.data.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        ...filters
      });

      const response = await axios.get(
        `${import.meta.env.VITE_baseURL}/search?${params.toString()}`
      );
      
      onSearchResults(response.data, searchQuery);
    } catch (error) {
      toast.error("Search failed. Please try again.");
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.value);
    setShowSuggestions(false);
    if (suggestion.type === "user") {
      setSearchType("users");
    }
    // Auto-search on suggestion click
    setTimeout(() => handleSearch(), 100);
  };

  const handleTagClick = (tagName) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags ? `${prev.tags},${tagName}` : tagName
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      tags: "",
      author: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "relevance"
    });
  };

  const categories = [
    "Technology", "Lifestyle", "Business", "Health", "Education", 
    "Travel", "Food", "Sports", "Entertainment", "Science"
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-100">
            Advanced Search
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
          >
            <FiX className="h-5 w-5 text-gray-500 dark:text-dark-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search posts, users, tags..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg
                         bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              
              {/* Search Suggestions */}
              {showSuggestions && suggestions && (
                <div ref={suggestionsRef} className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-700 
                                                   border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {Object.entries(suggestions).map(([type, items]) => 
                    items.length > 0 && (
                      <div key={type} className="p-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-dark-400 uppercase mb-1">
                          {type}
                        </div>
                        {items.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(item)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-600 
                                     rounded flex items-center space-x-2"
                          >
                            {type === "posts" && <FiFileText className="h-4 w-4 text-blue-500" />}
                            {type === "users" && <FiUser className="h-4 w-4 text-green-500" />}
                            {type === "tags" && <FiTag className="h-4 w-4 text-orange-500" />}
                            <span className="text-gray-900 dark:text-dark-100">{item.text}</span>
                            {item.count && <span className="text-gray-500 dark:text-dark-400">({item.count})</span>}
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Search Type Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg">
              {[
                { value: "all", label: "All", icon: FiSearch },
                { value: "posts", label: "Posts", icon: FiFileText },
                { value: "users", label: "Users", icon: FiUser }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSearchType(value)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    searchType === value
                      ? "bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm"
                      : "text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              <FiFilter className="h-4 w-4" />
              <span>{showFilters ? "Hide" : "Show"} Advanced Filters</span>
            </button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2
                             bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2
                             bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="views">Views</option>
                    <option value="likes">Likes</option>
                  </select>
                </div>

                {/* Tags Filter */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={filters.tags}
                    onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g. react, javascript, tutorial"
                    className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2
                             bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2
                             bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2
                             bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100"
                  />
                </div>

                {/* Clear Filters */}
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-gray-600 dark:text-dark-400 hover:text-gray-800 dark:hover:text-dark-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => handleTagClick(tag.name)}
                      className="inline-flex items-center space-x-1 px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900 
                               text-primary-800 dark:text-primary-200 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 
                               transition-colors"
                    >
                      <FiTag className="h-3 w-3" />
                      <span>{tag.name}</span>
                      <span className="text-primary-600 dark:text-primary-400">({tag.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 
                         text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <FiSearch className="h-4 w-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;