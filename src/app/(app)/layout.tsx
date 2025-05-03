import { Footer } from "@/components/common/footer";
import Navbar from "@/components/common/navbar";
import React, { ReactNode } from "react";

const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {children}
        <Footer />
      </div>
    </>
  );
};

export default AppLayout;
