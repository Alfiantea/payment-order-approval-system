import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Plus,
  Users,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Payment Orders', href: '/payment-orders', icon: FileText },
  { name: 'Create Order', href: '/payment-orders/new', icon: Plus },
];

const adminNavigation = [
  { name: 'User Management', href: '/admin/users', icon: Users },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const allNavigation = [
    ...navigation,
    ...(user?.role === 'admin' ? adminNavigation : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Horizontal Navigation */}
      <nav className="bg-red-600 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-white">Payment Order System</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {allNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors',
                        isActive
                          ? 'border-white text-white'
                          : 'border-transparent text-red-100 hover:border-red-300 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <User className="h-4 w-4" />
                <span className="text-sm">{user?.name}</span>
                <span className="text-xs text-red-200 capitalize">({user?.role?.replace('_', ' ')})</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-white hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {allNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'block border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors',
                    isActive
                      ? 'border-white bg-red-700 text-white'
                      : 'border-transparent text-red-100 hover:border-red-300 hover:bg-red-700 hover:text-white'
                  )}
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <div className="border-t border-red-500 mt-2 pt-2">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="block w-full text-left border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-red-100 hover:border-red-300 hover:bg-red-700 hover:text-white"
              >
                <div className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
