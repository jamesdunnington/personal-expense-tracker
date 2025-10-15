import { useState, useEffect } from 'react'
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import { transactionService } from '../services'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    search: ''
  })
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    net: 0
  })

  useEffect(() => {
    loadTransactions()
  }, [filters])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const data = await transactionService.getAll(filters)
      setTransactions(data.transactions)
      
      // Calculate stats
      const income = data.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      
      const expense = data.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      
      setStats({
        totalIncome: income,
        totalExpense: expense,
        net: income - expense
      })
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = () => {
    setEditingTransaction(null)
    setShowForm(true)
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm(`Delete this ${transaction.type} of $${transaction.amount}?`)) {
      return
    }

    try {
      await transactionService.delete(transaction.id)
      loadTransactions()
    } catch (error) {
      alert('Failed to delete transaction')
      console.error(error)
    }
  }

  const handleDuplicateTransaction = async (transaction) => {
    try {
      await transactionService.duplicate(transaction.id)
      loadTransactions()
    } catch (error) {
      alert('Failed to duplicate transaction')
      console.error(error)
    }
  }

  const handleFormSuccess = () => {
    loadTransactions()
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      search: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">Manage your income and expenses</p>
        </div>
        <button
          onClick={handleAddTransaction}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center sm:flex-shrink-0"
        >
          <PlusIcon className="h-5 w-5" />
          Add Transaction
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
          <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
            ${stats.totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
          <p className="text-2xl font-bold text-error-600 dark:text-error-400 mt-1">
            ${stats.totalExpense.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400">Net</p>
          <p className={`text-2xl font-bold mt-1 ${stats.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
            ${stats.net.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs md:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="input-field w-full"
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search..."
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card">
        <TransactionList
          transactions={transactions}
          loading={loading}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onDuplicate={handleDuplicateTransaction}
        />
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

export default Transactions