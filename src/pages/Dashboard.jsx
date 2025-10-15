import { useState, useEffect } from 'react'
import { PlusIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { format, startOfMonth, startOfYear } from 'date-fns'
import TransactionForm from '../components/TransactionForm'
import { transactionService } from '../services'

const Dashboard = () => {
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyNet: 0,
    ytdIncome: 0,
    ytdExpenses: 0,
    ytdNet: 0
  })

  const [recentTransactions, setRecentTransactions] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Get current date boundaries
      const now = new Date()
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
      const yearStart = format(startOfYear(now), 'yyyy-MM-dd')
      const today = format(now, 'yyyy-MM-dd')

      // Fetch all transactions for the year (for calculations)
      const response = await transactionService.getAll({
        startDate: yearStart,
        endDate: today
      })

      const allTransactions = response.transactions || []

      // Calculate monthly stats
      const monthlyTransactions = allTransactions.filter(t => t.date >= monthStart)
      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      // Calculate YTD stats
      const ytdIncome = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      const ytdExpenses = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      setStats({
        monthlyIncome,
        monthlyExpenses,
        monthlyNet: monthlyIncome - monthlyExpenses,
        ytdIncome,
        ytdExpenses,
        ytdNet: ytdIncome - ytdExpenses
      })

      // Get recent transactions (last 5)
      setRecentTransactions(allTransactions.slice(0, 5))

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = () => {
    setEditingTransaction(null)
    setIsModalOpen(true)
  }

  const handleTransactionSaved = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
    // Reload dashboard data to show new transaction
    loadDashboardData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <button onClick={handleAddTransaction} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center sm:flex-shrink-0">
          <PlusIcon className="h-5 w-5" />
          <span className="sm:inline">Add Transaction</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Current Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="stat-card border-success-500 dark:border-success-400">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Income</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                ${stats.monthlyIncome.toFixed(2)}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-success-100 dark:bg-success-900/30 rounded-full flex-shrink-0 ml-2">
              <ArrowTrendingUpIcon className="h-6 w-6 md:h-8 md:w-8 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </div>

        <div className="stat-card border-error-500 dark:border-error-400">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Expenses</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                ${stats.monthlyExpenses.toFixed(2)}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-error-100 dark:bg-error-900/30 rounded-full flex-shrink-0 ml-2">
              <ArrowTrendingDownIcon className="h-6 w-6 md:h-8 md:w-8 text-error-600 dark:text-error-400" />
            </div>
          </div>
        </div>

        <div className={`stat-card ${stats.monthlyNet >= 0 ? 'border-primary-500 dark:border-primary-400' : 'border-error-500 dark:border-error-400'}`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Net Profit/Loss</p>
              <p className={`mt-2 text-2xl md:text-3xl font-bold truncate ${stats.monthlyNet >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                ${stats.monthlyNet.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Year-to-Date Stats */}
      <div className="card">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Year to Date</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Income</p>
            <p className="text-xl md:text-2xl font-bold text-success-600 dark:text-success-400 truncate">${stats.ytdIncome.toFixed(2)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
            <p className="text-xl md:text-2xl font-bold text-error-600 dark:text-error-400 truncate">${stats.ytdExpenses.toFixed(2)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Net Profit/Loss</p>
            <p className={`text-xl md:text-2xl font-bold truncate ${stats.ytdNet >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
              ${stats.ytdNet.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          <a href="/transactions" className="text-xs md:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium whitespace-nowrap">
            View all →
          </a>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">No transactions yet</p>
              <button onClick={handleAddTransaction} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                Add your first transaction →
              </button>
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${transaction.type === 'income' ? 'bg-success-500 dark:bg-success-400' : 'bg-error-500 dark:bg-error-400'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.description || 'No description'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.category_name || 'Uncategorized'} • {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${transaction.type === 'income' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                  {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {isModalOpen && (
        <TransactionForm
          transaction={editingTransaction}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleTransactionSaved}
        />
      )}
    </div>
  )
}

export default Dashboard
