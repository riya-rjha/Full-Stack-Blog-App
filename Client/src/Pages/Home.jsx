// src/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import.meta.env.VITE_baseURL;
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import parse from "html-react-parser";
import Loading from "../Components/Loading";
import { toast } from "react-toastify";

const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [allBlogs, setAllBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const cat = useLocation().search;

  useEffect(() => {
    const getBlogs = async () => {
      setIsLoading(true);
      try {
        const blogPosts = await axios.get(
          `${import.meta.env.VITE_baseURL}/post${cat}`
        );
        setBlogs(blogPosts.data);
      } catch (error) {
        toast.error("Blogs could not be loaded!");
        console.log(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    getBlogs();
  }, [cat]);

  useEffect(() => {
    const getAllBlogs = async () => {
      setIsLoading(true);
      try {
        const blogPosts = await axios.get(
          `${import.meta.env.VITE_baseURL}/post`
        );
        setAllBlogs(blogPosts.data);
      } catch (error) {
        toast.error("Blogs could not be loaded!");
        console.log(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    getAllBlogs();
  }, []);

  return (
    <div className="container mx-auto p-6">
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {cat
            ? blogs.map((blog, index) => (
                <div
                  key={blog._id}
                  className={`blog-container shadow-lg flex flex-col md:flex-row items-center my-8 transform transition duration-500 hover:scale-105 ${
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="md:w-1/2 p-4 order-2 md:order-1 ">
                    <h2 className="md:text-4xl text-2xl font-bold mb-4 text-center md:text-left">
                      {blog.title}
                    </h2>
                    <p
                      className={`text-gray-700 mb-4 md:text-justify text-center`}
                    >
                      {parse(blog.desc.slice(0, 250))}{" "}
                      <span className="font-bold">. . . .</span>
                    </p>
                    <div className="flex justify-center md:justify-start">
                      <Link to={`/post/${blog._id}`}>
                        <button className="px-6 py-2 bg-orange-500 text-[18px] hover:bg-orange-600 transition-all delay-75 text-white rounded">
                          Read More
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-4 order-1 md:order-2">
                    <img
                      src={
                        blog.img !== undefined
                          ? `../Images/${blog.img}`
                          : "https://img.freepik.com/free-photo/social-media-networking-online-communication-connect-concept_53876-124862.jpg?ga=GA1.1.224769648.1717002388&semt=sph"
                      }
                      alt={blog.title}
                      className="w-full md:mx-auto rounded shadow-lg"
                    />
                  </div>
                </div>
              ))
            : allBlogs.map((blog, index) => (
                <div
                  key={blog._id}
                  className={`blog-container shadow-lg flex flex-col md:flex-row items-center my-8 transform transition duration-500 hover:scale-105  ${
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="md:w-1/2 p-4 order-2 md:order-1">
                    <h2 className="md:text-4xl text-2xl font-bold mb-4 text-center md:text-left">
                      {blog.title}
                    </h2>
                    <p
                      className={`text-gray-700 mb-4 md:text-justify text-center`}
                    >
                      {parse(blog.desc.slice(0, 250))}{" "}
                      <span className="font-bold">. . . .</span>
                    </p>
                    <div className="flex justify-center md:justify-start">
                      <Link to={`/post/${blog._id}`}>
                        <button className="px-6 py-2 bg-orange-500 text-[18px] hover:bg-orange-600 transition-all delay-75 text-white rounded">
                          Read More
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-4 order-1 md:order-2">
                    <img
                      src={
                        blog.img !== undefined
                          ? `../Images/${blog.img}`
                          : "https://img.freepik.com/free-photo/social-media-networking-online-communication-connect-concept_53876-124862.jpg?ga=GA1.1.224769648.1717002388&semt=sph"
                      }
                      alt={blog.title}
                      className="w-full md:mx-auto rounded shadow-lg"
                    />
                  </div>
                </div>
              ))}
        </>
      )}
    </div>
  );
};

export default Home;
