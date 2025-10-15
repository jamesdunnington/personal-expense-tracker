import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const CategoryModal = ({ isOpen, onClose, onSave, category = null, categories = [], type = 'expense' }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: type,
    parentId: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (category) {
      // Edit mode
      setFormData({
        name: category.name,
        type: category.type,
        parentId: category.parent_id || ''
      })
    } else {
      // Add mode
      setFormData({
        name: '',
        type: type,
        parentId: ''
      })
    }
    setError('')
  }, [category, type, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Filter parent categories (only show top-level categories of the same type)
  const parentCategories = categories.filter(cat => 
    cat.type === formData.type && !cat.parent_id
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {category ? 'Edit Category' : 'Add New Category'}
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

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Office Supplies"
              autoFocus
            />
          </div>

          {/* Type (only show when adding new) */}
          {!category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, parentId: '' })}
                    className="mr-2"
                  />
                  <span>Expense</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, parentId: '' })}
                    className="mr-2"
                  />
                  <span>Income</span>
                </label>
              </div>
            </div>
          )}

          {/* Parent Category (for subcategories) */}
          {!category && parentCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category (optional)
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">None (Top-level category)</option>
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select a parent to create a subcategory
              </p>
            </div>
          )}

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
              {loading ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
