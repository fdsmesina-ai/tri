import React from 'react';
import { Aperture } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Aperture className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-slate-900">SmartSnap</h1>
              <p className="text-xs text-slate-500">AI-Powered Image Database</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
               Local Secure Storage
             </span>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
               Gemini 2.5 Flash
             </span>
          </div>
        </div>
      </div>
    </header>
  );
};