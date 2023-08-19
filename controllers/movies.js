const movieSchema = require('../models/movie');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ForbidError = require('../errors/ForbidError');

function getMovies(req, res, next) {
  const userId = req.user._id;

  return movieSchema
    .find({ owner: userId })
    .populate('owner')
    .then((movies) => res.status(200).send(movies))
    .catch((error) => {
      next(error);
    });
}

function createMovie(req, res, next) {
  const owner = req.user._id;

  movieSchema
    .create({ ...req.body, owner })
    .then((movie) => res.status(201).send(movie))
    .catch((error) => {
      if (error.name === 'ValidationError') {
        next(
          new BadRequestError(
            'Переданы некорректные данные при создании фильма.',
          ),
        );
      } else {
        next(error);
      }
    });
}

function deleteMovie(req, res, next) {
  const { movieId } = req.params;

  movieSchema
    .findById(movieId)
    .then((movie) => {
      if (!movie) {
        throw new NotFoundError('Нет фильма с таким id');
      } else if (movie.owner.toString() !== req.user._id) {
        throw new ForbidError('Нельзя удалять чужие фильмы');
      } else {
        return movieSchema.findByIdAndRemove(movieId).then((deletedMovie) => {
          res.status(200).send(deletedMovie);
        });
      }
    })
    .catch((error) => {
      if (error.name === 'CastError') {
        next(
          new BadRequestError(
            'Переданы некорректные данные при удалении карточки.',
          ),
        );
      } else {
        next(error);
      }
    });
}

module.exports = {
  getMovies,
  createMovie,
  deleteMovie,
};
