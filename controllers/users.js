const { NODE_ENV, JWT_SECRET } = process.env;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userSchema = require('../models/user');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');

function getCurrentUser(req, res, next) {
  userSchema
    .findById(req.user._id)
    .orFail(() => {
      throw new NotFoundError('Пользователь не найден');
    })
    .then((user) => res.status(200).send(user))
    .catch((error) => {
      next(error);
    });
}

const createUser = (req, res, next) => {
  const { name, email, password } = req.body;

  bcrypt
    .hash(password, 10)
    .then((hash) => userSchema.create({
      name,
      email,
      password: hash,
    }))
    .then((newUser) => {
      res.send({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      });
    })
    .catch((error) => {
      if (error.name === 'ValidationError') {
        next(new BadRequestError('Некорректные данные'));
      } else if (error.code === 11000) {
        next(new ConflictError('Пользователь с таким email существует'));
      } else {
        next(error);
      }
    });
};

function updateUser(req, res, next) {
  const { name, email } = req.body;
  const owner = req.user._id;
  userSchema
    .findByIdAndUpdate(
      owner,
      { name, email },
      { new: true, runValidators: true },
    )
    .orFail(() => {
      throw new NotFoundError('Нет пользователя с таким id');
    })
    .then((user) => res.status(200).send(user))
    .catch((error) => {
      if (error.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные'));
      } else if (error.code === 11000) {
        next(new ConflictError('Пользователь с таким email существует'));
      } else {
        next(error);
      }
    });
}

function login(req, res, next) {
  const { email, password } = req.body;
  return userSchema
    .findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret',
        { expiresIn: '7d' },
      );
      res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 604800000,
        sameSite: true,
      });
      res.send({
        _id: user._id,
        name: user.name,
        email: user.email,
        message: 'Вы успешно авторизовались!',
      });
    })
    .catch((error) => next(error));
}

function logout(req, res) {
  if (res.cookie) {
    res.clearCookie('jwt');
    res.send({ message: 'Вы вышли из аккаунта!' });
  }
}

module.exports = {
  getCurrentUser,
  createUser,
  updateUser,
  login,
  logout,
};
