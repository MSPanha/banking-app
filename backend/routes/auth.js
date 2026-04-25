const express = require('express')
const router = express.Router()
const supabase = require('../supabase')

// SIGN UP
router.post('/signup', async (req, res) => {
  const { email, password, full_name, phone } = req.body

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) return res.status(400).json({ error: authError.message })

    const userId = authData.user.id

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: userId, full_name, phone })

    if (profileError) return res.status(400).json({ error: profileError.message })

    // Generate account number & card details
    const accountNumber = 'ACC' + Math.floor(1000000000 + Math.random() * 9000000000)
    const cardNumber = Array.from({length: 4}, () =>
      Math.floor(1000 + Math.random() * 9000)).join('-')
    const cardExpiry = '12/28'
    const cardCvv = Math.floor(100 + Math.random() * 900).toString()

    // Create bank account
    const { error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        account_number: accountNumber,
        balance: 0.00,
        card_number: cardNumber,
        card_expiry: cardExpiry,
        card_cvv: cardCvv
      })

    if (accountError) return res.status(400).json({ error: accountError.message })

    res.json({ message: 'Account created successfully!' })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SIGN IN
router.post('/signin', async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return res.status(400).json({ error: error.message })

  res.json({
    message: 'Signed in successfully!',
    token: data.session.access_token,
    user: data.user
  })
})

module.exports = router