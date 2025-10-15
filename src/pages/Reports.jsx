import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CalendarIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline'
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns'
import { transactionService } from '../services'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'

const Reports = () => {
  const [activeTab, setActiveTab] = useState('pl') // pl, monthly, iras
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3))
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState({ income: [], expense: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)
  const quarterOptions = [1, 2, 3, 4]

  useEffect(() => {
    loadReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedQuarter, activeTab])

  const loadReportData = async () => {
    setLoading(true)
    setError(null)
    try {
      let startDate, endDate

      if (activeTab === 'iras') {
        // Load quarter data
        const quarterStart = startOfQuarter(new Date(selectedYear, (selectedQuarter - 1) * 3, 1))
        const quarterEnd = endOfQuarter(quarterStart)
        startDate = format(quarterStart, 'yyyy-MM-dd')
        endDate = format(quarterEnd, 'yyyy-MM-dd')
      } else {
        // Load year data
        startDate = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd')
        endDate = format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd')
      }

      console.log('Loading report data:', { startDate, endDate, activeTab })
      const response = await transactionService.getAll({ startDate, endDate })
      console.log('Loaded transactions:', response)
      
      // Extract transactions array from response
      const data = response.transactions || response || []
      setTransactions(data)

      // Extract unique categories from transactions
      const incomeCategories = new Set()
      const expenseCategories = new Set()
      
      data.forEach(t => {
        if (t.type === 'income' && t.category_name) {
          incomeCategories.add(t.category_name)
        } else if (t.type === 'expense' && t.category_name) {
          expenseCategories.add(t.category_name)
        }
      })

      setCategories({
        income: Array.from(incomeCategories).sort(),
        expense: Array.from(expenseCategories).sort()
      })
    } catch (err) {
      console.error('Failed to load report data:', err)
      console.error('Error details:', err.message, err.response?.data)
      setError(`Failed to load report data: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'pl', name: 'P&L Report', icon: ChartBarIcon },
    { id: 'monthly', name: 'Monthly Breakdown', icon: CalendarIcon },
    { id: 'iras', name: 'IRAS Quarterly', icon: DocumentTextIcon }
  ]

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
          Generate and export financial reports
        </p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Year Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Quarter Selector (only for IRAS) */}
          {activeTab === 'iras' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quarter
              </label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="input"
              >
                {quarterOptions.map(q => (
                  <option key={q} value={q}>Q{q}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-700 text-error-700 dark:text-error-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="card">
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Tab Content */}
          {activeTab === 'pl' && (
            <PLReport 
              transactions={transactions} 
              categories={categories}
              year={selectedYear}
            />
          )}
          {activeTab === 'monthly' && (
            <MonthlyBreakdown 
              transactions={transactions}
              categories={categories}
              year={selectedYear}
            />
          )}
          {activeTab === 'iras' && (
            <IRASReport 
              transactions={transactions}
              categories={categories}
              year={selectedYear}
              quarter={selectedQuarter}
            />
          )}
        </>
      )}
    </div>
  )
}

// P&L Report Component
const PLReport = ({ transactions = [], categories = { income: [], expense: [] }, year }) => {
  const calculateCategoryTotals = (type) => {
    const categoryList = type === 'income' ? categories.income : categories.expense
    return categoryList.map(category => {
      const total = transactions
        .filter(t => t.type === type && t.category_name === category)
        .reduce((sum, t) => sum + Number(t.amount), 0)
      return { category, total }
    }).filter(item => item.total > 0)
  }

  const incomeData = calculateCategoryTotals('income')
  const expenseData = calculateCategoryTotals('expense')
  
  const totalIncome = incomeData.reduce((sum, item) => sum + item.total, 0)
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.total, 0)
  const netProfit = totalIncome - totalExpenses

  const exportPDF = () => {
    try {
      console.log('Starting PDF export...')
      const doc = new jsPDF()
      console.log('jsPDF instance created:', doc)
      
      doc.setFontSize(18)
      doc.text(`Profit & Loss Report - ${year}`, 14, 20)
      
      doc.setFontSize(11)
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28)
      
      // Income Section
      console.log('Adding income table...')
      autoTable(doc, {
      startY: 35,
      head: [['Income Categories', 'Amount (SGD)']],
      body: [
        ...incomeData.map(item => [item.category, item.total.toFixed(2)]),
        ['Total Income', totalIncome.toFixed(2)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    })
    
      // Expense Section
      console.log('Adding expense table...')
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Expense Categories', 'Amount (SGD)']],
        body: [
          ...expenseData.map(item => [item.category, item.total.toFixed(2)]),
          ['Total Expenses', totalExpenses.toFixed(2)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }
      })
      
      // Net Profit
      console.log('Adding summary table...')
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Summary', 'Amount (SGD)']],
        body: [
          ['Total Income', totalIncome.toFixed(2)],
          ['Total Expenses', totalExpenses.toFixed(2)],
          ['Net Profit/Loss', netProfit.toFixed(2)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }
      })
      
      console.log('Saving PDF...')
      doc.save(`PL-Report-${year}.pdf`)
      console.log('PDF saved successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Failed to generate PDF: ${error.message}`)
    }
  }

  const exportCSV = () => {
    const csvData = [
      ['Profit & Loss Report', year],
      ['Generated', format(new Date(), 'dd MMM yyyy HH:mm')],
      [],
      ['Income Categories', 'Amount (SGD)'],
      ...incomeData.map(item => [item.category, item.total.toFixed(2)]),
      ['Total Income', totalIncome.toFixed(2)],
      [],
      ['Expense Categories', 'Amount (SGD)'],
      ...expenseData.map(item => [item.category, item.total.toFixed(2)]),
      ['Total Expenses', totalExpenses.toFixed(2)],
      [],
      ['Summary', 'Amount (SGD)'],
      ['Total Income', totalIncome.toFixed(2)],
      ['Total Expenses', totalExpenses.toFixed(2)],
      ['Net Profit/Loss', netProfit.toFixed(2)]
    ]
    
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PL-Report-${year}.csv`
    a.click()
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Profit & Loss - {year}
        </h2>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export PDF
          </button>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Income Section */}
        <div>
          <h3 className="text-lg font-semibold text-success-600 dark:text-success-400 mb-3">Income</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount (SGD)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {incomeData.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No income transactions
                    </td>
                  </tr>
                ) : (
                  <>
                    {incomeData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-success-50 dark:bg-success-900/30 font-semibold">
                      <td className="px-6 py-4 text-sm text-success-900 dark:text-success-400">Total Income</td>
                      <td className="px-6 py-4 text-sm text-success-900 dark:text-success-400 text-right">
                        {totalIncome.toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Section */}
        <div>
          <h3 className="text-lg font-semibold text-error-600 dark:text-error-400 mb-3">Expenses</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount (SGD)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {expenseData.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No expense transactions
                    </td>
                  </tr>
                ) : (
                  <>
                    {expenseData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-error-50 dark:bg-error-900/30 font-semibold">
                      <td className="px-6 py-4 text-sm text-error-900 dark:text-error-400">Total Expenses</td>
                      <td className="px-6 py-4 text-sm text-error-900 dark:text-error-400 text-right">
                        {totalExpenses.toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Profit/Loss */}
        <div className={`p-6 rounded-lg ${netProfit >= 0 ? 'bg-success-50 dark:bg-success-900/30' : 'bg-error-50 dark:bg-error-900/30'}`}>
          <div className="flex justify-between items-center">
            <span className={`text-lg font-semibold ${netProfit >= 0 ? 'text-success-900 dark:text-success-400' : 'text-error-900 dark:text-error-400'}`}>
              Net {netProfit >= 0 ? 'Profit' : 'Loss'}
            </span>
            <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success-900 dark:text-success-400' : 'text-error-900 dark:text-error-400'}`}>
              SGD {Math.abs(netProfit).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Monthly Breakdown Component
const MonthlyBreakdown = ({ transactions = [], categories = { income: [], expense: [] }, year }) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const calculateMonthlyData = () => {
    return months.map((month, idx) => {
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === idx
      })

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      return {
        month,
        income,
        expenses,
        net: income - expenses,
        count: monthTransactions.length
      }
    })
  }

  const monthlyData = calculateMonthlyData()
  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0)
  const totalNet = totalIncome - totalExpenses

  const exportPDF = () => {
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(18)
      doc.text(`Monthly Breakdown - ${year}`, 14, 20)
      
      doc.setFontSize(11)
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28)
      
      autoTable(doc, {
        startY: 35,
        head: [['Month', 'Income (SGD)', 'Expenses (SGD)', 'Net (SGD)', 'Transactions']],
        body: [
          ...monthlyData.map(m => [
            m.month,
            m.income.toFixed(2),
            m.expenses.toFixed(2),
            m.net.toFixed(2),
            m.count
          ]),
          ['Total', totalIncome.toFixed(2), totalExpenses.toFixed(2), totalNet.toFixed(2), transactions.length]
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }
      })
      
      doc.save(`Monthly-Breakdown-${year}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Failed to generate PDF: ${error.message}`)
    }
  }

  const exportCSV = () => {
    const csvData = [
      ['Monthly Breakdown', year],
      ['Generated', format(new Date(), 'dd MMM yyyy HH:mm')],
      [],
      ['Month', 'Income (SGD)', 'Expenses (SGD)', 'Net (SGD)', 'Transactions'],
      ...monthlyData.map(m => [m.month, m.income.toFixed(2), m.expenses.toFixed(2), m.net.toFixed(2), m.count]),
      ['Total', totalIncome.toFixed(2), totalExpenses.toFixed(2), totalNet.toFixed(2), transactions.length]
    ]
    
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Monthly-Breakdown-${year}.csv`
    a.click()
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Monthly Breakdown - {year}
        </h2>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export PDF
          </button>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Income (SGD)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expenses (SGD)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net (SGD)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transactions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {monthlyData.map((data, idx) => (
              <tr key={idx} className={data.count === 0 ? 'text-gray-400' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {data.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 text-right">
                  {data.income.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-error-600 text-right">
                  {data.expenses.toFixed(2)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                  data.net >= 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {data.net.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {data.count}
                </td>
              </tr>
            ))}
            <tr className="bg-primary-50 font-semibold">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-success-700 text-right">
                {totalIncome.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-error-700 text-right">
                {totalExpenses.toFixed(2)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                totalNet >= 0 ? 'text-success-700' : 'text-error-700'
              }`}>
                {totalNet.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                {transactions.length}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// IRAS Quarterly Report Component
const IRASReport = ({ transactions = [], categories = { income: [], expense: [] }, year, quarter }) => {
  const quarterMonths = {
    1: ['Jan', 'Feb', 'Mar'],
    2: ['Apr', 'May', 'Jun'],
    3: ['Jul', 'Aug', 'Sep'],
    4: ['Oct', 'Nov', 'Dec']
  }

  const taxDeductibleExpenses = transactions.filter(t => 
    t.type === 'expense' && t.is_tax_deductible
  )

  const calculateCategoryTotals = (type, taxDeductibleOnly = false) => {
    const categoryList = type === 'income' ? categories.income : categories.expense
    return categoryList.map(category => {
      const total = transactions
        .filter(t => 
          t.type === type && 
          t.category_name === category &&
          (!taxDeductibleOnly || t.is_tax_deductible)
        )
        .reduce((sum, t) => sum + Number(t.amount), 0)
      return { category, total }
    }).filter(item => item.total > 0)
  }

  const incomeData = calculateCategoryTotals('income')
  const expenseData = calculateCategoryTotals('expense')
  const taxDeductibleData = calculateCategoryTotals('expense', true)
  
  const totalIncome = incomeData.reduce((sum, item) => sum + item.total, 0)
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.total, 0)
  const totalTaxDeductible = taxDeductibleData.reduce((sum, item) => sum + item.total, 0)
  const taxableIncome = totalIncome - totalTaxDeductible

  const exportPDF = () => {
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(18)
      doc.text(`IRAS Quarterly Report - Q${quarter} ${year}`, 14, 20)
      
      doc.setFontSize(11)
      doc.text(`Quarter: ${quarterMonths[quarter].join(', ')}`, 14, 28)
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 34)
      
      // Income Section
      autoTable(doc, {
        startY: 42,
        head: [['Income Categories', 'Amount (SGD)']],
        body: [
          ...incomeData.map(item => [item.category, item.total.toFixed(2)]),
          ['Total Income', totalIncome.toFixed(2)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }
      })
      
      // Tax Deductible Expenses
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Tax Deductible Expenses', 'Amount (SGD)']],
        body: [
          ...taxDeductibleData.map(item => [item.category, item.total.toFixed(2)]),
          ['Total Tax Deductible', totalTaxDeductible.toFixed(2)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      })
      
      // Summary
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['IRAS Summary', 'Amount (SGD)']],
        body: [
          ['Total Income', totalIncome.toFixed(2)],
          ['Less: Tax Deductible Expenses', totalTaxDeductible.toFixed(2)],
          ['Taxable Income', taxableIncome.toFixed(2)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }
      })
      
      doc.save(`IRAS-Q${quarter}-${year}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Failed to generate PDF: ${error.message}`)
    }
  }

  const exportCSV = () => {
    const csvData = [
      ['IRAS Quarterly Report', `Q${quarter} ${year}`],
      ['Quarter', quarterMonths[quarter].join(', ')],
      ['Generated', format(new Date(), 'dd MMM yyyy HH:mm')],
      [],
      ['Income Categories', 'Amount (SGD)'],
      ...incomeData.map(item => [item.category, item.total.toFixed(2)]),
      ['Total Income', totalIncome.toFixed(2)],
      [],
      ['Tax Deductible Expenses', 'Amount (SGD)'],
      ...taxDeductibleData.map(item => [item.category, item.total.toFixed(2)]),
      ['Total Tax Deductible', totalTaxDeductible.toFixed(2)],
      [],
      ['IRAS Summary', 'Amount (SGD)'],
      ['Total Income', totalIncome.toFixed(2)],
      ['Less: Tax Deductible Expenses', totalTaxDeductible.toFixed(2)],
      ['Taxable Income', taxableIncome.toFixed(2)]
    ]
    
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `IRAS-Q${quarter}-${year}.csv`
    a.click()
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            IRAS Quarterly Report - Q{quarter} {year}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {quarterMonths[quarter].join(', ')} {year}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export PDF
          </button>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Income Section */}
        <div>
          <h3 className="text-lg font-semibold text-success-600 mb-3">Income</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (SGD)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomeData.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                      No income transactions
                    </td>
                  </tr>
                ) : (
                  <>
                    {incomeData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-success-50 font-semibold">
                      <td className="px-6 py-4 text-sm text-success-900">Total Income</td>
                      <td className="px-6 py-4 text-sm text-success-900 text-right">
                        {totalIncome.toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax Deductible Expenses */}
        <div>
          <h3 className="text-lg font-semibold text-primary-600 mb-3">
            Tax Deductible Expenses ({taxDeductibleExpenses.length} transactions)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (SGD)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxDeductibleData.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                      No tax deductible expenses
                    </td>
                  </tr>
                ) : (
                  <>
                    {taxDeductibleData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-primary-50 font-semibold">
                      <td className="px-6 py-4 text-sm text-primary-900">Total Tax Deductible</td>
                      <td className="px-6 py-4 text-sm text-primary-900 text-right">
                        {totalTaxDeductible.toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* IRAS Summary */}
        <div className="bg-primary-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">IRAS Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-primary-900">Total Income</span>
              <span className="font-semibold text-primary-900">SGD {totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-900">Less: Tax Deductible Expenses</span>
              <span className="font-semibold text-primary-900">SGD {totalTaxDeductible.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-primary-200 pt-2 flex justify-between">
              <span className="text-lg font-semibold text-primary-900">Taxable Income</span>
              <span className="text-xl font-bold text-primary-900">SGD {taxableIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> This report is for reference only. Please consult with a tax professional 
            or refer to IRAS guidelines for official tax filing requirements.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Reports