import React from 'react';
import { FiLock, FiShield, FiCpu, FiCheck } from 'react-icons/fi';


interface SecurityFeatureProps {
    icon: React.ReactNode;
    title: string;
    description: string;
  }
  
  const SecurityFeature: React.FC<SecurityFeatureProps> = ({ icon, title, description }) => {
    return (
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1">
          <div className="flex items-center justify-center h-10 w-10 rounded-md bg-neutral-100 text-neutral-800">
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
          <p className="mt-2 text-neutral-600">{description}</p>
        </div>
      </div>
    );
  };

export const SecuritySection = () => {
    return (
      <section className="py-16 bg-neutral-100 border-neutral-300 border-t border-dashed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">
                Your <span className='text-orange-700'>Privacy</span> and <span className='text-orange-700'>Security</span> Come First
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Unlike our competitors, we process everything locally in your browser. Your images never leave your device, ensuring complete privacy and security.
              </p>
              <div className="mt-8 space-y-8">
                <SecurityFeature
                  icon={<FiLock className="h-6 w-6" />}
                  title="100% Browser-Based"
                  description="All processing happens directly in your browser. Your images never travel to our servers, unlike other tools that upload your content to unknown locations."
                />
                <SecurityFeature
                  icon={<FiShield className="h-6 w-6" />}
                  title="No Data Collection"
                  description="We don't track your usage, collect metadata from your images, or monetize your data. Many competitors use your images and data for AI training or advertising."
                />
                <SecurityFeature
                  icon={<FiCpu className="h-6 w-6" />}
                  title="Works Offline"
                  description="Once loaded, our tool works without an internet connection. Other solutions require constant connectivity, exposing you to network vulnerabilities."
                />
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-6 py-8 sm:p-10">
                  <div className="flex items-center justify-center h-16 w-16 rounded-md bg-green-100 text-green-800 border border-dashed border-green-400 mx-auto mb-6">
                    <FiShield className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-medium text-neutral-900 text-center mb-6">How We Compare</h3>
                  
                  <div className="border-t border-b border-neutral-200 py-4 mb-4">
                    <h4 className="text-lg font-medium text-neutral-900 mb-2">PixelPerfect</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <FiCheck className="h-5 w-5 text-green-700 mr-2 mt-0.5" />
                        <span className="text-neutral-600">Images never leave your device</span>
                      </li>
                      <li className="flex items-start">
                        <FiCheck className="h-5 w-5 text-green-700 mr-2 mt-0.5" />
                        <span className="text-neutral-600">No account required</span>
                      </li>
                      <li className="flex items-start">
                        <FiCheck className="h-5 w-5 text-green-700 mr-2 mt-0.5" />
                        <span className="text-neutral-600">Works offline after initial load</span>
                      </li>
                      <li className="flex items-start">
                        <FiCheck className="h-5 w-5 text-green-700 mr-2 mt-0.5" />
                        <span className="text-neutral-600">Open source code for transparency</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="py-4">
                    <h4 className="text-lg font-medium text-neutral-900 mb-2">Competitors</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex items-center justify-center">✕</div>
                        <span className="text-neutral-600">Upload images to unknown servers</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex items-center justify-center">✕</div>
                        <span className="text-neutral-600">Often require account creation</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex items-center justify-center">✕</div>
                        <span className="text-neutral-600">Require constant internet connection</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex items-center justify-center">✕</div>
                        <span className="text-neutral-600">May collect data for AI training</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };
  