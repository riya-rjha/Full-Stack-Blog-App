import React from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Home from "./Pages/Home";
import Single from "./Pages/Single";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Write from "./Pages/Write";
import EditBlog from "./Pages/EditBlog";
import Dashboard from "./Pages/Dashboard";
import PageNotFound from "./Components/PageNotFound";

const App = () => {
  return (
    <div id="top" className="relative z-10 min-h-full bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 transition-colors duration-200">
      <a href="#top">
        <img
          src="https://cdn-icons-png.freepik.com/256/15992/15992789.png?ga=GA1.1.224769648.1717002388&semt=ais_hybrid"
          className="fixed w-12 h-12 bottom-5 right-5 z-50 opacity-70 hover:opacity-100 transition-opacity duration-200 rounded-lg shadow-lg"
          alt="Back to top"
        />
      </a>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog/:id" element={<Single />} />
          <Route path="/post/:id" element={<Single />} />
          <Route path="/write" element={<Write />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/edit/:id" element={<EditBlog />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
