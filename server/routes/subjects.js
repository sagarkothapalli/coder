const router = require('express').Router();
const Subject = require('../models/subject.model');
const { protect } = require('../middleware/auth.middleware');

// @route   GET /api/subjects
// @desc    Get user subjects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subjects
// @desc    Create a subject
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, totalClasses, attendedClasses, canceledClasses } = req.body;

  try {
    const subject = new Subject({
      user: req.user._id,
      name,
      totalClasses,
      attendedClasses,
      canceledClasses,
    });

    const createdSubject = await subject.save();
    res.status(201).json(createdSubject);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update a subject
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { name, totalClasses, attendedClasses, canceledClasses } = req.body;

  try {
    const subject = await Subject.findById(req.params.id);

    if (subject) {
      if (subject.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      subject.name = name;
      subject.totalClasses = totalClasses;
      subject.attendedClasses = attendedClasses;
      subject.canceledClasses = canceledClasses;

      const updatedSubject = await subject.save();
      res.json(updatedSubject);
    } else {
      res.status(404).json({ message: 'Subject not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete a subject
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (subject) {
      if (subject.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      await subject.remove();
      res.json({ message: 'Subject removed' });
    } else {
      res.status(404).json({ message: 'Subject not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
