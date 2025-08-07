import React, { useState, useEffect } from "react";
import { FiClock, FiEye } from "react-icons/fi";

const ReadingProgress = ({ content, className = "" }) => {
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate reading time and word count
  useEffect(() => {
    if (content) {
      // Remove HTML tags and calculate word count
      const plainText = content.replace(/<[^>]*>/g, '');
      const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      // Average reading speed is 200 words per minute
      const estimatedTime = Math.ceil(wordCount / 200);
      
      setWordCount(wordCount);
      setReadingTime(estimatedTime);
    }
  }, [content]);

  // Track scrolling progress
  useEffect(() => {
    const handleScroll = () => {
      const article = document.querySelector('.article-content');
      if (!article) return;

      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // Calculate when the article becomes visible
      const articleStart = articleTop - viewportHeight + 100;
      const articleEnd = articleTop + articleHeight - 100;

      if (scrollTop >= articleStart && scrollTop <= articleEnd) {
        setIsVisible(true);
        const progress = ((scrollTop - articleStart) / (articleEnd - articleStart)) * 100;
        setReadingProgress(Math.min(Math.max(progress, 0), 100));
      } else if (scrollTop < articleStart) {
        setIsVisible(false);
        setReadingProgress(0);
      } else {
        setReadingProgress(100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Reading Stats Card */}
      <div className={`bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-600 ${className}`}>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-dark-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FiClock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiEye className="h-4 w-4" />
              <span>{wordCount.toLocaleString()} words</span>
            </div>
          </div>
          
          {isVisible && (
            <div className="flex items-center space-x-2">
              <div className="w-16 h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 transition-all duration-300 ease-out"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <span className="text-xs font-medium">
                {Math.round(readingProgress)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Reading Progress Bar (appears when scrolling) */}
      {isVisible && (
        <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-gray-200 dark:bg-dark-700">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* Floating Progress Indicator */}
      {isVisible && readingProgress > 10 && (
        <div className="fixed bottom-6 right-6 z-30">
          <div className="bg-white dark:bg-dark-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-dark-600">
            <div className="relative w-12 h-12">
              {/* Background circle */}
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-gray-200 dark:text-dark-600"
                />
                {/* Progress circle */}
                <circle
                  cx="22"
                  cy="22"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - readingProgress / 100)}`}
                  className="text-primary-500 transition-all duration-300 ease-out"
                />
              </svg>
              
              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-300">
                  {Math.round(readingProgress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReadingProgress;