import React from 'react';
import { Users, Calendar, BarChart3, LogOut, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  userType: 'admin' | 'student';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userType,
  activeTab,
  onTabChange,
}) => {
  const { user, logout } = useAuth();
  const adminTabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const studentTabs = [
    { id: 'browse', label: 'Browse Events', icon: Calendar },
    { id: 'registered', label: 'My Events', icon: Users },
  ];

  const tabs = userType === 'admin' ? adminTabs : studentTabs;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Campus Events</h1>
            </div>
            
            <nav className="hidden md:flex space-x-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user?.full_name}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {userType}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-4">
          <nav className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
