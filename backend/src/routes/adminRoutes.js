const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, deleteUser, deletePostModeration } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');


router.use(protect);
router.use(admin);


router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);


router.delete('/posts/:id', deletePostModeration);

module.exports = router;
