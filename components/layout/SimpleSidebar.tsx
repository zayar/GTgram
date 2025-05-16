'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaHome, FaSearch, FaCompass, FaVideo, 
  FaEnvelope, FaHeart, FaPlusSquare, FaUser, FaCog 
} from 'react-icons/fa';

export default function SimpleSidebar() {
  const pathname = usePathname();
  
  const menuItems = [
    { icon: <FaHome className="text-gtgram-green" size={22} />, text: "Home", path: "/home" },
    { icon: <FaSearch className="text-gtgram-green" size={22} />, text: "Search", path: "/search" },
    { icon: <FaCompass className="text-gtgram-green" size={22} />, text: "Explore", path: "/explore" },
    { icon: <FaVideo className="text-gtgram-green" size={22} />, text: "Reels", path: "/reels" },
    { icon: <FaEnvelope className="text-gtgram-green" size={22} />, text: "Messages", path: "/messages" },
    { icon: <FaHeart className="text-gtgram-green" size={22} />, text: "Notifications", path: "/notifications" },
    { icon: <FaPlusSquare className="text-gtgram-green" size={22} />, text: "Create", path: "/create" },
    { icon: <FaUser className="text-gtgram-green" size={22} />, text: "Profile", path: "/profile" }
  ];
  
  return (
    <aside className="hidden md:block fixed left-0 top-0 h-full w-64 border-r border-gtgram-gray bg-white text-gtgram-dark">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-10 text-gtgram-green">GTgram</h1>
        
        <nav>
          <ul className="space-y-4">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <li key={index}>
                  <Link href={item.path}>
                    <button 
                      className={`flex items-center space-x-4 p-3 rounded-lg w-full text-left transition duration-200
                        ${isActive 
                          ? 'bg-gtgram-green bg-opacity-10 text-gtgram-green font-semibold' 
                          : 'hover:bg-gtgram-light-green hover:bg-opacity-10 hover:text-gtgram-green'
                        }`}
                    >
                      <span className="w-6 h-6 flex items-center justify-center">
                        {item.icon}
                      </span>
                      <span>{item.text}</span>
                    </button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="absolute bottom-6 left-6">
          <button className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gtgram-light-green hover:bg-opacity-10 hover:text-gtgram-green transition duration-200">
            <span className="w-6 h-6 flex items-center justify-center">
              <FaCog className="text-gtgram-green" size={22} />
            </span>
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
} 