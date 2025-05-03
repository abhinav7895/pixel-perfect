import React from "react";
import { FiImage, FiGithub } from "react-icons/fi";

export const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <FiImage className="h-6 w-6" />
            <span className="text-lg font-bold">PixelPerfect</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6">
            <a 
              href="https://github.com/abhinav7895/pixel-perfect" 
              className="text-neutral-300 hover:text-white flex items-center"
            >
              <span>Open Source</span>
            </a>
            
            <a 
              href="https://github.com/abhinav7895/pixel-perfect" 
              className="text-neutral-300 hover:text-white flex items-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiGithub className="mr-2 h-4 w-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-neutral-700">
          <p className="text-neutral-400 text-center text-sm">
            &copy; {new Date().getFullYear()} PixelPerfect. Created by Abhinav.
          </p>
        </div>
      </div>
    </footer>
  );
};