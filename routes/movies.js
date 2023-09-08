const movieRoutes = require('express').Router();
const validate = require('../middlewares/validation');

const {
  getMovies,
  createMovie,
  deleteMovie,
} = require('../controllers/movies');

movieRoutes.get('/movies', getMovies);
movieRoutes.post('/movies', validate.validateCreateMovie, createMovie);
movieRoutes.delete('/movies/:movieId', validate.validateMovieId, deleteMovie);

module.exports = movieRoutes;
