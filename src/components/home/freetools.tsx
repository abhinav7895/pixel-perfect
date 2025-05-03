import { FiCheck, FiCpu, FiGlobe, FiUsers } from "react-icons/fi";

export const FreeToolsSection = () => {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">
              Professional Photo Editing Tools for <span className="text-orange-700">Everyone</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-neutral-600">
              High-quality image processing without the price tag or learning curve.
            </p>
          </div>
  
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="flex justify-center mb-4">
                <FiUsers className="h-8 w-8 text-neutral-800" />
              </div>
              <h3 className="text-xl font-medium text-neutral-900 text-center mb-4">For Everyone</h3>
              <p className="text-neutral-600 mb-4">
                Whether you're a professional photographer, social media enthusiast, or casual user, our tools are designed to be intuitive and accessible.
              </p>
              <ul className="space-y-2">
                {[
                  'No technical experience required',
                  'Simple, intuitive interface',
                  'Works on any device with a modern browser',
                  'No account or signup needed'
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className="h-5 w-5 text-green-700 mr-2" />
                    <span className="text-neutral-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
  
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="flex justify-center mb-4">
                <FiGlobe className="h-8 w-8 text-neutral-800" />
              </div>
              <h3 className="text-xl font-medium text-neutral-900 text-center mb-4">Completely Free</h3>
              <p className="text-neutral-600 mb-4">
                All of our tools are 100% free to use with no hidden fees, subscriptions, or limitations. We believe quality image tools should be accessible to everyone.
              </p>
              <ul className="space-y-2">
                {[
                  'No watermarks on processed images',
                  'No resolution or file size limits',
                  'No daily or monthly usage caps',
                  'No premium features behind paywalls'
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className="h-5 w-5 text-green-700 mr-2" />
                    <span className="text-neutral-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
  
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="flex justify-center mb-4">
                <FiCpu className="h-8 w-8 text-neutral-800" />
              </div>
              <h3 className="text-xl font-medium text-neutral-900 text-center mb-4">Advanced Technology</h3>
              <p className="text-neutral-600 mb-4">
                Just because it's free doesn't mean we compromise on quality. We use cutting-edge web technologies to deliver professional-grade results.
              </p>
              <ul className="space-y-2">
                {[
                  'High-quality image processing algorithms',
                  'Fast, client-side execution',
                  'Batch processing capabilities',
                  'Latest image format support (WebP, AVIF)'
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className="h-5 w-5 text-green-700 mr-2" />
                    <span className="text-neutral-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  };