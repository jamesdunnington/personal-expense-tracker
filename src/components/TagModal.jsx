import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const TagModal = ({ isOpen, onClose, onSave, tag = null }) => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tag) {
      setName(tag.name)
    } else {
      setName('')
    }
    setError('')
  }, [tag, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Tag name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSave(name.trim())
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {tag ? 'Edit Tag' : 'Add New Tag'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Tag Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., business, personal, urgent"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Tags help you organize and filter transactions
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : tag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TagModal
