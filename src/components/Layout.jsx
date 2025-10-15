import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  CreditCardIcon, 
  ChartBarIcon, 
  FolderIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline'
import PWAInstallPrompt from './PWAInstallPrompt'

const Layout = () => {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Transactions', href: '/transactions', icon: CreditCardIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Categories', href: '/categories', icon: FolderIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">💰 ExpenseTracker</h1>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="px-2 pb-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 dark:text-gray-500" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <nav className="flex justify-around">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                } flex flex-col items-center py-2 px-2 text-xs`}
              >
                <item.icon className="h-6 w-6" />
                <span className="mt-1">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-20 md:pb-8">
          <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}

export default Layout