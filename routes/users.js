const userRoutes = require('express').Router();
const validate = require('../middlewares/validation');

const { getCurrentUser, updateUser } = require('../controllers/users');

userRoutes.get('/users/me', getCurrentUser);
userRoutes.patch('/users/me', validate.validateUpdateUser, updateUser);

module.exports = userRoutes;
