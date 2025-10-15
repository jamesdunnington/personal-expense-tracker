import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon, TagIcon } from '@heroicons/react/24/outline'
import { categoryService, tagService } from '../services'
import CategoryModal from '../components/CategoryModal'
import TagModal from '../components/TagModal'

const Categories = () => {
  const [categories, setCategories] = useState({ income: [], expense: [] })
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingTag, setEditingTag] = useState(null)
  const [categoryModalType, setCategoryModalType] = useState('expense')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [categoriesData, tagsData] = await Promise.all([
        categoryService.getAll(),
        tagService.getAll()
      ])

      setCategories(categoriesData.categories)
      setTags(tagsData.tags)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load categories and tags')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = (type) => {
    setEditingCategory(null)
    setCategoryModalType(type)
    setCategoryModalOpen(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryModalType(category.type)
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = async (formData) => {
    try {
      if (editingCategory) {
        // Update existing category
        await categoryService.update(editingCategory.id, {
          name: formData.name,
          isArchived: editingCategory.is_archived
        })
      } else {
        // Create new category
        await categoryService.create({
          name: formData.name,
          type: formData.type,
          parentId: formData.parentId || null
        })
      }
      loadData()
    } catch (err) {
      throw err
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? If it\'s used in transactions, it will be archived instead.')) {
      return
    }

    try {
      const result = await categoryService.delete(id)
      alert(result.message)
      loadData()
    } catch (err) {
      alert(err)
    }
  }

  const handleAddTag = () => {
    setEditingTag(null)
    setTagModalOpen(true)
  }

  const handleEditTag = (tag) => {
    setEditingTag(tag)
    setTagModalOpen(true)
  }

  const handleSaveTag = async (name) => {
    try {
      if (editingTag) {
        // Update existing tag
        await tagService.update(editingTag.id, name)
      } else {
        // Create new tag
        await tagService.create(name)
      }
      loadData()
    } catch (err) {
      throw err
    }
  }

  const handleDeleteTag = async (id) => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return
    }

    try {
      await tagService.delete(id)
      loadData()
    } catch (err) {
      alert(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Categories & Tags</h1>
        <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
          Manage your income and expense categories, and transaction tags.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-700 text-error-700 dark:text-error-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Expense Categories */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FolderIcon className="h-5 w-5 md:h-6 md:w-6 text-error-600 dark:text-error-400 flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Expense Categories</h2>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">({categories.expense.length})</span>
          </div>
          <button onClick={() => handleAddCategory('expense')} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center sm:flex-shrink-0">
            <PlusIcon className="h-5 w-5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="space-y-2">
          {categories.expense.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">No expense categories yet</p>
          ) : (
            categories.expense.map((category) => (
              <div key={category.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                {/* Parent Category */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <FolderIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                    {category.is_archived && (
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">Archived</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                      title="Edit category"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 rounded"
                      title="Delete category"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="p-4 space-y-2">
                    {category.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between pl-8">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{sub.name}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditCategory(sub)}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                            title="Edit subcategory"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(sub.id)}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 rounded"
                            title="Delete subcategory"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Income Categories */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FolderIcon className="h-5 w-5 md:h-6 md:w-6 text-success-600 dark:text-success-400 flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Income Categories</h2>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">({categories.income.length})</span>
          </div>
          <button onClick={() => handleAddCategory('income')} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center sm:flex-shrink-0">
            <PlusIcon className="h-5 w-5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="space-y-2">
          {categories.income.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">No income categories yet</p>
          ) : (
            categories.income.map((category) => (
              <div key={category.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                {/* Parent Category */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <FolderIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                    {category.is_archived && (
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">Archived</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                      title="Edit category"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 rounded"
                      title="Delete category"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="p-4 space-y-2">
                    {category.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between pl-8">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{sub.name}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditCategory(sub)}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                            title="Edit subcategory"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(sub.id)}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 rounded"
                            title="Delete subcategory"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <TagIcon className="h-5 w-5 md:h-6 md:w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Tags</h2>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">({tags.length})</span>
          </div>
          <button onClick={handleAddTag} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center sm:flex-shrink-0">
            <PlusIcon className="h-5 w-5" />
            <span>Add Tag</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400 w-full">No tags yet</p>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full border border-primary-200 dark:border-primary-700"
              >
                <span className="text-sm">{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-full p-1"
                  title="Delete tag"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
        categories={[...categories.income, ...categories.expense]}
        type={categoryModalType}
      />
      <TagModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onSave={handleSaveTag}
        tag={editingTag}
      />
    </div>
  )
}

export default Categories