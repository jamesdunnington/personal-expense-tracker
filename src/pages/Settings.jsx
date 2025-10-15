import { useState, useEffect } from 'react'
import { 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ArrowDownTrayIcon,
  MoonIcon,
  SunIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { settingsService } from '../services'
import { useTheme } from '../contexts/ThemeContext'

const Settings = () => {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  })
  
  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    currency: 'SGD',
    dateFormat: 'dd/MM/yyyy',
    theme: 'light',
    language: 'en'
  })

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon },
    { id: 'data', name: 'Data Management', icon: ArrowDownTrayIcon }
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      console.log('Loading settings...')
      const data = await settingsService.get()
      console.log('Settings loaded:', data)
      setProfile({
        name: data.user.name || '',
        email: data.user.email
      })
      setPreferences({
        currency: data.settings.currency,
        dateFormat: data.settings.date_format,
        theme: data.settings.theme,
        language: data.settings.language
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
      console.error('Error response:', error.response)
      console.error('Error response data:', error.response?.data)
      console.error('Error type:', typeof error)
      console.error('Error string:', String(error))
      
      // Show more detailed error
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error
      alert('Failed to load settings: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsService.update({ name: profile.name })
      alert('Profile updated successfully')
      // Reload settings to confirm the update
      await loadSettings()
    } catch (error) {
      alert('Failed to update profile: ' + error)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwords.newPassword.length < 6) {
      alert('New password must be at least 6 characters')
      return
    }

    setSaving(true)
    setPasswordSuccess(false)
    try {
      await settingsService.changePassword(passwords.currentPassword, passwords.newPassword)
      setPasswordSuccess(true)
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error) {
      alert('Failed to change password: ' + error)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      await settingsService.update({
        currency: preferences.currency,
        date_format: preferences.dateFormat,
        theme: preferences.theme,
        language: preferences.language
      })
      alert('Preferences updated successfully')
    } catch (error) {
      alert('Failed to update preferences: ' + error)
    } finally {
      setSaving(false)
    }
  }

  const handleThemeToggle = async () => {
    toggleTheme()
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setPreferences(prev => ({ ...prev, theme: newTheme }))
    
    // Save to backend
    try {
      await settingsService.update({ theme: newTheme })
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      const data = await settingsService.exportData()
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expense-tracker-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert('Data exported successfully')
    } catch (error) {
      alert('Failed to export data: ' + error)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="pb-20 md:pb-0">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">Manage your account and preferences</p>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="mt-6 space-y-4 md:space-y-6">
          {/* Profile Information */}
          <div className="card">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Profile Information
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input w-full"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input w-full bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Email cannot be changed
                </p>
              </div>
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="input w-full"
                  required
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum 6 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              {passwordSuccess && (
                <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                  <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>Password changed successfully!</span>
                </div>
              )}
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="mt-6">
          <div className="card space-y-6">
            {/* Dark Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <button
                onClick={handleThemeToggle}
                className="flex items-center justify-between w-full p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center min-w-0 flex-1">
                  {theme === 'light' ? (
                    <SunIcon className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 mr-2 md:mr-3 flex-shrink-0" />
                  ) : (
                    <MoonIcon className="h-5 w-5 md:h-6 md:w-6 text-indigo-400 mr-2 md:mr-3 flex-shrink-0" />
                  )}
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
                      {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                      Switch to {theme === 'light' ? 'dark' : 'light'} mode
                    </p>
                  </div>
                </div>
                <div className={`
                  relative inline-flex h-6 w-11 md:h-8 md:w-14 items-center rounded-full transition-colors flex-shrink-0 ml-2
                  ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}
                `}>
                  <span className={`
                    inline-block h-4 w-4 md:h-6 md:w-6 transform rounded-full bg-white transition-transform
                    ${theme === 'dark' ? 'translate-x-6 md:translate-x-7' : 'translate-x-1'}
                  `} />
                </div>
              </button>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="input w-full"
              >
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="MYR">MYR - Malaysian Ringgit</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Format
              </label>
              <div className="space-y-3">
                {['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'].map((format) => (
                  <label key={format} className="flex items-start">
                    <input
                      type="radio"
                      name="dateFormat"
                      value={format}
                      checked={preferences.dateFormat === format}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="ml-3 text-sm md:text-base text-gray-700 dark:text-gray-300 flex-1">
                      <span className="block">{format}</span>
                      <span className="block text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        ({new Date().toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).replace(/\//g, format.includes('-') ? '-' : '/')})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              className="btn-primary w-full sm:w-auto"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="mt-6">
          <div className="card">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Your Data
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-6">
              Download all your transactions, categories, and tags in JSON format. 
              This includes your complete financial data and can be used for backup or 
              migration purposes.
            </p>
            <button
              onClick={handleExportData}
              className="btn-primary flex items-center w-full sm:w-auto justify-center sm:justify-start"
              disabled={exporting}
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {exporting ? 'Exporting...' : 'Export All Data'}
            </button>
            
            <div className="mt-6 md:mt-8 p-3 md:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-sm md:text-base font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                What's included in the export?
              </h3>
              <ul className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                <li>All your transactions with categories and tags</li>
                <li>All your custom categories and subcategories</li>
                <li>All your tags</li>
                <li>Your account settings and preferences</li>
                <li>Account creation date and statistics</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
