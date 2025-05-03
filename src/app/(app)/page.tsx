import { Footer } from "@/components/common/footer";
import Navbar from "@/components/common/navbar";
import { FreeToolsSection } from "@/components/home/freetools";
import HeroSection from "@/components/home/hero";
import { SecuritySection } from "@/components/home/security";
import React from "react";

const App = () => {
  return (
    <>
      <HeroSection />
      <SecuritySection />
      <FreeToolsSection />
    </>
  );
};

export default App;
