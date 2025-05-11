import express from 'express';
import { psqlClient } from '../config/database';

const router = express.Router();

// Get user's coins
router.get('/user/:id/coins', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await psqlClient.user.findUnique({
      where: { id: userId },
      select: { coins: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ coins: user.coins });
  } catch (error) {
    console.error('Error fetching user coins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's coins (admin only)
router.post('/user/:id/update-coins', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { amount } = req.body;

    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const updatedUser = await psqlClient.user.update({
      where: { id: userId },
      data: { coins: amount },
      select: { coins: true }
    });

    res.json({ coins: updatedUser.coins });
  } catch (error) {
    console.error('Error updating user coins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Use coins
router.post('/user/:id/use-coins', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await psqlClient.user.findUnique({
      where: { id: userId },
      select: { coins: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.coins < amount) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    const updatedUser = await psqlClient.user.update({
      where: { id: userId },
      data: { coins: { decrement: amount } },
      select: { coins: true }
    });

    res.json({ coins: updatedUser.coins });
  } catch (error) {
    console.error('Error using coins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;