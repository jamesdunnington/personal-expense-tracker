import { useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const TransactionList = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  onDuplicate,
  loading = false 
}) => {
  const [filters, setFilters] = useState({
    type: '',
    search: ''
  })

  const formatAmount = (amount, type) => {
    const formatted = parseFloat(amount).toFixed(2)
    return type === 'income' ? `+$${formatted}` : `-$${formatted}`
  }

  const getTypeColor = (type) => {
    return type === 'income' 
      ? 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30' 
      : 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/30'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No transactions yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Click "Add Transaction" to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Transaction Items */}
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Left: Transaction Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(transaction.type)}`}>
                    {transaction.type}
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatAmount(transaction.amount, transaction.type)}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {transaction.category_name}
                    </span>
                    {transaction.sub_category_name && (
                      <>
                        <span className="text-gray-400 dark:text-gray-500">›</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {transaction.sub_category_name}
                        </span>
                      </>
                    )}
                  </div>

                  {transaction.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </span>

                    {transaction.is_tax_deductible && (
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full font-medium">
                        Tax Deductible
                      </span>
                    )}

                    {transaction.tags && transaction.tags.length > 0 && (
                      <div className="flex gap-1">
                        {transaction.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onEdit(transaction)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>

                <button
                  onClick={() => onDuplicate(transaction)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </button>

                <button
                  onClick={() => onDelete(transaction)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TransactionList
