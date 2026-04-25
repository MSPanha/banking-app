const express = require('express')
const router = express.Router()
const supabase = require('../supabase')

// Middleware to verify token
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  const { data, error } = await supabase.auth.getUser(token)
  if (error) return res.status(401).json({ error: 'Invalid token' })

  req.user = data.user
  next()
}

// GET account info
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', req.user.id)
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// GET profile info
router.get('/profile', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

module.exports = router