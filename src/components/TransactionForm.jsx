import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { categoryService, tagService, transactionService } from '../services'

const TransactionForm = ({ transaction = null, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: transaction?.date || new Date().toISOString().split('T')[0],
    amount: transaction?.amount || '',
    type: transaction?.type || 'expense',
    categoryId: transaction?.category_id || '',
    subCategoryId: transaction?.sub_category_id || '',
    description: transaction?.description || '',
    isTaxDeductible: transaction?.is_tax_deductible || false,
    tags: transaction?.tags?.map(t => t.id) || []
  })

  const [categories, setCategories] = useState({ income: [], expense: [] })
  const [tags, setTags] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load categories and tags on mount
  useEffect(() => {
    loadCategoriesAndTags()
  }, [])

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.categoryId) {
      const allCategories = [...categories.income, ...categories.expense]
      const selectedCategory = allCategories.find(c => c.id === parseInt(formData.categoryId))
      setSubcategories(selectedCategory?.subcategories || [])
      
      // Reset subcategory if it doesn't belong to new category
      if (formData.subCategoryId) {
        const subExists = selectedCategory?.subcategories?.some(
          sc => sc.id === parseInt(formData.subCategoryId)
        )
        if (!subExists) {
          setFormData(prev => ({ ...prev, subCategoryId: '' }))
        }
      }
    } else {
      setSubcategories([])
    }
  }, [formData.categoryId, categories])

  const loadCategoriesAndTags = async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        categoryService.getAll(),
        tagService.getAll()
      ])
      setCategories(categoriesData.categories)
      setTags(tagsData.tags)
    } catch (err) {
      setError('Failed to load form data')
      console.error(err)
    }
  }

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target
    
    if (inputType === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'type') {
      // Reset category when type changes
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        categoryId: '',
        subCategoryId: ''
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!formData.date || !formData.amount || !formData.categoryId) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      if (parseFloat(formData.amount) <= 0) {
        setError('Amount must be greater than 0')
        setLoading(false)
        return
      }

      const transactionData = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: parseInt(formData.categoryId),
        subCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId) : null,
        description: formData.description || null,
        isTaxDeductible: formData.isTaxDeductible,
        tags: formData.tags
      }

      if (transaction) {
        // Update existing transaction
        await transactionService.update(transaction.id, transactionData)
      } else {
        // Create new transaction
        await transactionService.create(transactionData)
      }

      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save transaction')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const currentCategories = categories[formData.type] || []

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Expense</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Income</span>
              </label>
            </div>
          </div>

          {/* Date and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (SGD) *
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select category</option>
                {currentCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subCategoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Sub-Category
              </label>
              <select
                id="subCategoryId"
                name="subCategoryId"
                value={formData.subCategoryId}
                onChange={handleChange}
                className="input-field"
                disabled={subcategories.length === 0}
              >
                <option value="">None</option>
                {subcategories.map(subcat => (
                  <option key={subcat.id} value={subcat.id}>
                    {subcat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="input-field resize-none"
              placeholder="Add notes or details about this transaction..."
            />
          </div>

          {/* Tax Deductible */}
          <div className="flex items-center">
            <input
              id="isTaxDeductible"
              name="isTaxDeductible"
              type="checkbox"
              checked={formData.isTaxDeductible}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isTaxDeductible" className="ml-2 block text-sm text-gray-700">
              Tax Deductible
            </label>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.tags.includes(tag.id)
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : transaction ? 'Update Transaction' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionForm
