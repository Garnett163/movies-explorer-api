require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { errors } = require('celebrate');
const cors = require('cors');
const cookies = require('cookie-parser');
const helmet = require('helmet');
const limiter = require('./middlewares/rateLimit');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const userRoutes = require('./routes/users');
const movieRoutes = require('./routes/movies');

const auth = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');
const validate = require('./middlewares/validation');

const { PORT = 3000 } = process.env;
const { MONGO_URL = 'mongodb://127.0.0.1:27017/bitfilmsdb' } = process.env;
const { login, createUser, logout } = require('./controllers/users');
const NotFoundError = require('./errors/NotFoundError');

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
});

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3001',
      'https://api.movies.garnett163.nomoreparties.co',
    ],
    credentials: true,
  }),
);

app.use(helmet());
app.use(limiter);
app.use(cookies());
app.use(express.json());
app.use(requestLogger);

app.post('/signin', validate.validateLogin, login);
app.post('/signup', validate.validateCreateUser, createUser);
app.post('/signout', logout);

app.use(auth);
app.use(userRoutes);
app.use(movieRoutes);

app.use('*', (req, res, next) => {
  next(new NotFoundError('Страница не найдена!'));
});

app.use(errorLogger);
app.use(errors());
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Application is running on port ${PORT}`);
});
