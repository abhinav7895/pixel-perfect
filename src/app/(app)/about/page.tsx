import React from 'react';
import { FiGithub, FiGlobe, FiCode, FiPackage, FiCpu, FiEye } from 'react-icons/fi';
import { RiTwitterXFill } from "react-icons/ri";

const AboutPage = () => {
  return (
    <div className="bg-neutral-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl mb-4">
            About <span className="text-orange-700">PixelPerfect</span>
          </h1>
          <p className="text-lg text-neutral-600">
            A simple, browser-based image processing tool
          </p>
        </header>

        <section className="mb-12">
          <p className="text-neutral-700 mb-6">
            PixelPerfect is a lightweight, privacy-focused image processing toolkit that handles all operations directly in your browser. Your images never leave your device, ensuring complete privacy and security.
          </p>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Technical Stack</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <FiCode className="h-5 w-5 shrink-0 text-orange-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium text-neutral-800">Next.js & React</h3>
                  <p className="text-neutral-600 text-sm">Built with Next.js for server-side rendering and optimal performance</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiEye className="h-5 w-5 shrink-0 text-orange-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium text-neutral-800">Tailwind CSS</h3>
                  <p className="text-neutral-600 text-sm">Styled using Tailwind CSS for a clean, minimal interface</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiCpu className="h-5 w-5 shrink-0 text-orange-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium text-neutral-800">Browser APIs</h3>
                  <p className="text-neutral-600 text-sm">Leverages modern browser APIs for image processing without server uploads</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiPackage className="h-5 w-5 shrink-0 text-orange-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium text-neutral-800">Key Libraries</h3>
                  <p className="text-neutral-600 text-sm">Utilizes browser-image-compression for efficient image compression and react-dropzone for intuitive file handling</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <img 
              src="https://www.abhinavyadav.in/_next/image?url=%2Fvillage.webp&w=3840&q=75" 
              alt="Abhinav Yadav" 
              className="w-20 h-20 object-cover rounded-full border-2 border-orange-200 mb-4 sm:mb-0 sm:mr-6"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Created by Abhinav Yadav</h2>
              <p className="text-neutral-600 mb-4">
                A minimalist, open-source image processing tool created to make image editing accessible to everyone.
              </p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <a 
                  href="https://x.com/abhinavvay" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors text-sm"
                >
                  <RiTwitterXFill className="h-4 w-4 mr-2" />
                  <span>@abhinavvay</span>
                </a>
                <a 
                  href="https://abhinavyadav.in" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors text-sm"
                >
                  <FiGlobe className="h-4 w-4 mr-2" />
                  <span>abhinavyadav.in</span>
                </a>
                <a 
                  href="https://github.com/abhinav7895/pixel-perfect" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors text-sm"
                >
                  <FiGithub className="h-4 w-4 mr-2" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Open Source</h2>
          <p className="text-neutral-600 mb-4">
            PixelPerfect is completely open source and free to use. Feel free to contribute to the project or fork it for your own use.
          </p>
          <div className="flex justify-center sm:justify-start">
            <a 
              href="https://github.com/abhinav7895/pixel-perfect" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
            >
              <FiGithub className="h-5 w-5 mr-2" />
              View on GitHub
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;