const express = require('express');
const router = express.Router();
const pool = require('../modules/pool')

router.delete('/delete/:id', (req, res) => {
  console.log(req.params);
  // first query deletes the movie from the junction table
  let queryString = `DELETE FROM movies_genres WHERE movies_genres.movie_id=$1;`;
  pool.query(queryString, [req.params.id]).then(result => {
    console.log('deleted movie from junction table');
    // second query deletes the movie from the movies table
    let query = `DELETE FROM movies WHERE id=$1;`;
    pool.query(query, [req.params.id]).then(result => {
      console.log('deleted movie from movies table');
      res.sendStatus(200);
    }).catch((err) => {
      console.log(err);
      res.sendStatus(500);
    })
  }).catch((err) => {
    console.log(err);
    res.sendStatus(500);
  })
})

// get all the movies from the DB
router.get('/', (req, res) => {
  const query = `SELECT * FROM movies ORDER BY "title" ASC`;
  pool.query(query)
    .then( result => {
      res.send(result.rows);
    })
    .catch(err => {
      console.log('ERROR: Get all movies', err);
      res.sendStatus(500)
    })

});

// get the movie details and genres from the DB for the movie with a specific id
router.get('/details/:id', (req, res) => {
  console.log(req.params);
  const queryString = `SELECT * FROM movies JOIN movies_genres ON movies.id = movies_genres.movie_id JOIN genres ON movies_genres.genre_id = genres.id WHERE movies.id=$1;`
  const values = [req.params.id];
  pool.query(queryString, values).then(result => {
    res.send(result.rows)
  }).catch(err => {
    console.log(err);
    res.sendStatus(500);
  })
})

// already here - adds a movie to the DB
router.post('/', (req, res) => {
  console.log(req.body);
  // RETURNING "id" will give us back the id of the created movie
  const insertMovieQuery = `
  INSERT INTO "movies" ("title", "poster", "description")
  VALUES ($1, $2, $3)
  RETURNING "id";`

  // FIRST QUERY MAKES MOVIE
  pool.query(insertMovieQuery, [req.body.title, req.body.poster, req.body.description])
  .then(result => {
    console.log('New Movie Id:', result.rows[0].id); //ID IS HERE! (but why is the newly created id at the first index? I think it's because when you add something it goes to the top of the database rows)
    
    const createdMovieId = result.rows[0].id

    // Now handle the genre reference
    const insertMovieGenreQuery = `
      INSERT INTO "movies_genres" ("movie_id", "genre_id")
      VALUES  ($1, $2);
      `
      // SECOND QUERY ADDS GENRE FOR THAT NEW MOVIE
      pool.query(insertMovieGenreQuery, [createdMovieId, req.body.genre_id]).then(result => {
        //Now that both are done, send back success!
        res.sendStatus(201);
      }).catch(err => {
        // catch for second query
        console.log(err);
        res.sendStatus(500)
      })

// Catch for first query
  }).catch(err => {
    console.log(err);
    res.sendStatus(500)
  })
})

module.exports = router;