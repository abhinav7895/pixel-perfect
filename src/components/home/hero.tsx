import Link from 'next/link';
import React from 'react';
import { FiZap, FiRefreshCw, FiMaximize, FiCrop } from 'react-icons/fi';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, href }) => {
  return (
    <Link
      className="bg-gradient-to-b from-orange-200 to-orange-50 p-3 sm:p-6 rounded-lg border border-dashed border-orange-400 transition-shadow duration-300 cursor-pointer"
      href={href}
    >
      <div className="flex items-center justify-center size-10 sm:size-12 rounded-md bg-orange-100 border border-dashed border-orange-400 text-orange-800 mb-4">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 text-sm sm:text-base">{description}</p>
    </Link>
  );
};

const HeroSection = () => {
  return (
    <div className="bg-neutral-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6">
            Transform Your Images <span className="block text-orange-700">in Seconds</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-neutral-600">
            All-in-one browser-based image processing tool. No uploads, no waiting - everything happens right in your browser.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<FiZap className="h-6 w-6" />}
            title="Compress"
            description="Reduce file size while maintaining quality for faster loading and sharing."
            href='/compress'
          />
          <FeatureCard
            icon={<FiRefreshCw className="h-6 w-6" />}
            title="Convert"
            description="Change file formats between JPG, PNG, WebP, and more with one click."
            href='/convert'
          />
          <FeatureCard
            icon={<FiMaximize className="h-6 w-6" />}
            title="Resize"
            description="Scale your images to exact dimensions or by percentage."
            href='/resize'
          />
          <FeatureCard
            icon={<FiCrop className="h-6 w-6" />}
            title="Crop"
            description="Perfect your composition by removing unwanted areas."
            href='/crop'
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;