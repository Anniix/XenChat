const express = require('express');
const router = express.Router();
const { searchUsers, getUserById } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All user routes are protected
router.use(verifyToken);

router.get('/search', searchUsers);     // GET /api/users/search?q=name
router.get('/:id', getUserById);        // GET /api/users/:id

module.exports = router;
