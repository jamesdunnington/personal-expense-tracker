import api from './api'

export const authService = {
  // Register new user
  register: async (email, password) => {
    try {
      console.log('Attempting registration to:', api.defaults.baseURL + '/auth-register')
      const response = await api.post('/auth-register', { email, password })
      console.log('Registration response:', response)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
      }
      return response.data
    } catch (error) {
      console.error('Registration error:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      throw error.response?.data?.error || error.message || 'Registration failed'
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      console.log('Attempting login to:', api.defaults.baseURL + '/auth-login')
      const response = await api.post('/auth-login', { email, password })
      console.log('Login response:', response)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
      }
      return response.data
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      throw error.response?.data?.error || error.message || 'Login failed'
    }
  },

  // Get current user
  getMe: async () => {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to get user data'
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token')
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token')
  }
}

export const transactionService = {
  // Get all transactions
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString()
      const response = await api.get(`/transactions-list?${params}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch transactions'
    }
  },

  // Get single transaction
  getById: async (id) => {
    try {
      const response = await api.get(`/transactions-get?id=${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch transaction'
    }
  },

  // Create transaction
  create: async (transaction) => {
    try {
      const response = await api.post('/transactions-create', transaction)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create transaction'
    }
  },

  // Update transaction
  update: async (id, transaction) => {
    try {
      const response = await api.put('/transactions-update', { id, ...transaction })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update transaction'
    }
  },

  // Delete transaction
  delete: async (id) => {
    try {
      const response = await api.delete(`/transactions-delete?id=${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete transaction'
    }
  },

  // Duplicate transaction
  duplicate: async (id) => {
    try {
      const response = await api.post('/transactions-duplicate', { id })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to duplicate transaction'
    }
  }
}

export const categoryService = {
  // Get all categories
  getAll: async () => {
    try {
      const response = await api.get('/categories-list')
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch categories'
    }
  },

  // Create category
  create: async (category) => {
    try {
      const response = await api.post('/categories-create', category)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create category'
    }
  },

  // Update category
  update: async (id, category) => {
    try {
      const response = await api.put(`/categories-update/${id}`, category)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update category'
    }
  },

  // Delete/Archive category
  delete: async (id) => {
    try {
      const response = await api.delete(`/categories-delete/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete category'
    }
  }
}

export const tagService = {
  // Get all tags
  getAll: async () => {
    try {
      const response = await api.get('/tags-list')
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch tags'
    }
  },

  // Create tag
  create: async (name) => {
    try {
      const response = await api.post('/tags-create', { name })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create tag'
    }
  },

  // Update tag
  update: async (id, name) => {
    try {
      const response = await api.put(`/tags-update/${id}`, { name })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update tag'
    }
  },

  // Delete tag
  delete: async (id) => {
    try {
      const response = await api.delete(`/tags-delete/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete tag'
    }
  }
}

export const reportService = {
  // Get yearly P&L
  getYearly: async (year) => {
    try {
      const response = await api.get(`/reports/yearly/${year}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch yearly report'
    }
  },

  // Get monthly breakdown
  getMonthly: async (year) => {
    try {
      const response = await api.get(`/reports/monthly/${year}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch monthly report'
    }
  },

  // Get quarterly report
  getQuarterly: async (year, quarter) => {
    try {
      const response = await api.get(`/reports/quarterly/${year}/${quarter}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch quarterly report'
    }
  },

  // Export report
  export: async (type, format, params) => {
    try {
      const response = await api.post(`/reports/export/${type}/${format}`, params, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to export report'
    }
  }
}

export const dashboardService = {
  // Get dashboard stats
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats')
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch dashboard stats'
    }
  },

  // Get recent transactions
  getRecentTransactions: async (limit = 10) => {
    try {
      const response = await api.get(`/dashboard/recent?limit=${limit}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch recent transactions'
    }
  },

  // Get monthly trends
  getMonthlyTrends: async (months = 6) => {
    try {
      const response = await api.get(`/dashboard/trends?months=${months}`)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch trends'
    }
  }
}

export const settingsService = {
  // Get user settings
  get: async () => {
    try {
      const response = await api.get('/settings-get')
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch settings'
    }
  },

  // Update settings
  update: async (settings) => {
    try {
      const response = await api.put('/settings-update', settings)
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update settings'
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/settings-change-password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to change password'
    }
  },

  // Export all data
  exportData: async () => {
    try {
      const response = await api.get('/settings-export-data')
      return response.data
    } catch (error) {
      throw error.response?.data?.error || 'Failed to export data'
    }
  }
}