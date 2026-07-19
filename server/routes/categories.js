let express = require('express');
let Category = require('../models/Category');

let router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  let categories = await Category.find({ groupId: req.params.groupId }).sort({ createdAt: 1 });
  res.json({ categories });
});

router.post('/', async (req, res) => {
  let { name, color } = req.body;
  if (!name || !name.trim() || !color) {
    return res.status(400).json({ error: 'name and color are required' });
  }
  let category = await Category.create({ groupId: req.params.groupId, name: name.trim(), color });
  res.status(201).json({ category });
});

router.delete('/:id', async (req, res) => {
  let category = await Category.findOne({ _id: req.params.id, groupId: req.params.groupId });
  if (!category) return res.status(404).json({ error: 'Category not found' });
  await category.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
