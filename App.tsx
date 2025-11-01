
import React, { useState } from 'react';
import { PostGenerator } from './components/PostGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import { ChatBot } from './components/ChatBot';
import { Bot, Image, Tv, Type } from 'lucide-react';

type Tab = 'post' | 'video' | 'analyzer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('post');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'post':
        return <PostGenerator />;
      case 'video':
        return <VideoGenerator />;
      case 'analyzer':
        return <ImageAnalyzer />;
      default:
        return <PostGenerator />;
    }
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: Tab; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-300 ${
        activeTab === tab 
          ? 'bg-indigo-600 text-white' 
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Social Post <span className="text-indigo-400">Studio AI</span>
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <TabButton tab="post" label="Post Creator" icon={Type} />
            <TabButton tab="video" label="VEO Video" icon={Tv} />
            <TabButton tab="analyzer" label="Image Analyzer" icon={Image} />
          </nav>
        </div>
        
        {renderTabContent()}
      </main>

      <ChatBot />
    </div>
  );
};

export default App;
