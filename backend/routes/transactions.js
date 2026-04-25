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

// DEPOSIT
router.post('/deposit', authMiddleware, async (req, res) => {
  const { amount } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  // Get user account
  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', req.user.id)
    .single()

  if (accErr) return res.status(400).json({ error: accErr.message })

  // Update balance
  const { error: updateErr } = await supabase
    .from('accounts')
    .update({ balance: account.balance + parseFloat(amount) })
    .eq('id', account.id)

  if (updateErr) return res.status(400).json({ error: updateErr.message })

  // Log transaction
  await supabase.from('transactions').insert({
    receiver_id: account.id,
    type: 'deposit',
    amount: parseFloat(amount),
    note: 'Self deposit'
  })

  res.json({ message: `Deposited $${amount} successfully!` })
})

// TRANSFER
router.post('/transfer', authMiddleware, async (req, res) => {
  const { to_account_number, amount, note } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  // Get sender account
  const { data: sender, error: senderErr } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', req.user.id)
    .single()

  if (senderErr) return res.status(400).json({ error: senderErr.message })
  if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient balance' })

  // Get receiver account
  const { data: receiver, error: receiverErr } = await supabase
    .from('accounts')
    .select('*')
    .eq('account_number', to_account_number)
    .single()

  if (receiverErr || !receiver) return res.status(404).json({ error: 'Receiver account not found' })

  // Deduct from sender
  await supabase.from('accounts')
    .update({ balance: sender.balance - parseFloat(amount) })
    .eq('id', sender.id)

  // Add to receiver
  await supabase.from('accounts')
    .update({ balance: receiver.balance + parseFloat(amount) })
    .eq('id', receiver.id)

  // Log transaction
  await supabase.from('transactions').insert({
    sender_id: sender.id,
    receiver_id: receiver.id,
    type: 'transfer',
    amount: parseFloat(amount),
    note: note || 'Transfer'
  })

  res.json({ message: `Transferred $${amount} successfully!` })
})

// GET transaction history
router.get('/history', authMiddleware, async (req, res) => {
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', req.user.id)
    .single()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`sender_id.eq.${account.id},receiver_id.eq.${account.id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

module.exports = router