const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const accountRoutes = require('./routes/accounts')
const transactionRoutes = require('./routes/transactions')
const loanRoutes = require('./routes/loans')

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/loans', loanRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Banking API is running 🚀' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))