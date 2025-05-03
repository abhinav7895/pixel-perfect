"use client";

import Link from "next/link";
import React from "react";
import { FiImage, FiMenu, FiX } from "react-icons/fi";

const navlinks = [
  {
    id: "01",
    text: "Compress",
    href: "/compress",
  },
  {
    id: "02",
    text: "Convert",
    href: "/convert",
  },
  {
    id: "03",
    text: "Resize",
    href: "/resize",
  },
  {
    id: "04",
    text: "Crop",
    href: "/crop",
  },
  {
    id: "05",
    text: "About",
    href: "/about",
  },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-neutral-100 border-b border-neutral-400 border-dashed shadow-sm px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href={"/"} className="flex items-center space-x-2">
          <FiImage className="h-8 w-8 text-neutral-800" />
          <span className="text-xl font-bold text-neutral-800">
            PixelPerfect
          </span>
        </Link>
        <div className="hidden md:flex space-x-8">
          {navlinks.map(({ id, href, text }) => (
            <Link
              href={href}
              key={id}
              className="text-neutral-600 bg-orange-100 border rounded py-1 px-2 border-dashed hover:bg-orange-200 font-medium"
            >
              {text}
            </Link>
          ))}
        </div>
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="text-neutral-600 hover:text-neutral-900 focus:outline-none"
          >
            {isMenuOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden mt-4 px-2 pt-2 pb-4 space-y-3">
          {navlinks.map(({ href, id, text }) => (
            <Link
              href={href}
              key={id}
              className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
            >
              {text}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
