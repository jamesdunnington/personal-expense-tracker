import { useState, useEffect } from 'react'
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running as PWA (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOS)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault()
      // Save the event for later use
      setDeferredPrompt(e)
      // Show custom install prompt after a delay
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000) // Show after 3 seconds
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already dismissed in this session
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setShowInstallPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
    
    // Mark as dismissed for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already installed or no prompt available
  if (isStandalone || (!deferredPrompt && !isIOS) || !showInstallPrompt) {
    return null
  }

  // iOS-specific install instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-primary-600 text-white p-4 shadow-lg z-50 animate-slide-up">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <ArrowDownTrayIcon className="h-6 w-6" />
              <h3 className="font-semibold">Install App</h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-gray-200"
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm mb-2">
            Install this app on your device for a better experience:
          </p>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Tap the Share button <span className="inline-block">📤</span></li>
            <li>Select "Add to Home Screen"</li>
            <li>Tap "Add"</li>
          </ol>
        </div>
      </div>
    )
  }

  // Android/Desktop install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border-2 border-primary-500 rounded-lg shadow-xl p-4 z-50 animate-slide-up">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 p-2 rounded-lg">
            <ArrowDownTrayIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Install App</h3>
            <p className="text-sm text-gray-600">Get quick access</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Install this app for quick access and offline functionality. Works just like a native app!
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstallClick}
          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}

export default PWAInstallPrompt
