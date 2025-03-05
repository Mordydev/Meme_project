import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">Success Kid</div>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="text-gray-700 hover:text-primary">Home</a>
            <a href="/community" className="text-gray-700 hover:text-primary">Community</a>
            <a href="/market" className="text-gray-700 hover:text-primary">Market</a>
            <a href="/profile" className="text-gray-700 hover:text-primary">Profile</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="btn btn-primary">Connect Wallet</button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Success Kid</h3>
              <p className="text-gray-600">Transform a viral meme token into a sustainable digital community with real utility and engagement.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-600 hover:text-primary">Home</a></li>
                <li><a href="/community" className="text-gray-600 hover:text-primary">Community</a></li>
                <li><a href="/market" className="text-gray-600 hover:text-primary">Market</a></li>
                <li><a href="/profile" className="text-gray-600 hover:text-primary">Profile</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary">Twitter</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary">Discord</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary">Telegram</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Success Kid Community. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 