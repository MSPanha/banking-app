const express = require('express')
const router = express.Router()
const supabase = require('../supabase')

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return res.status(401).json({ error: 'Invalid token' })
  req.user = data.user
  next()
}

// APPLY FOR LOAN
router.post('/apply', authMiddleware, async (req, res) => {
  const { amount, duration_months } = req.body

  const { error } = await supabase.from('loans').insert({
    user_id: req.user.id,
    amount: parseFloat(amount),
    duration_months: parseInt(duration_months),
    status: 'pending'
  })

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Loan application submitted! Status: Pending' })
})

// GET my loans
router.get('/my', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

module.exports = router