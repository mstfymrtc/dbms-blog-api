import http from "http";
import express from "express";
import logger from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
const uuidv4 = require("uuid/v1");

const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "blog-database",
  password: "12",
  port: 5432
});
const hostname = "127.0.0.1";
const port = 3000;
const app = express();

const server = http.createServer(app);
app.use(cors());
app.use(logger("dev"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/posts/getAllPosts", (req, res) =>
  // res.status(200).send({ message: "Welcome to the default API route" })

  pool.query(
    "SELECT postid, title, content, publishdate, fullname, avatarurl, imageurl, userid, categoryid FROM posts NATURAL JOIN users",
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  )
);

app.get("/posts/getPostById/:postid", (req, res) => {
  const { postid } = req.params;
  pool.query(
    "SELECT title,content,likecount,publishdate, posts.userid, imageurl, postid, fullname,categories.name as categoryname, avatarurl FROM posts INNER JOIN users ON users.userid=posts.userid INNER JOIN categories ON categories.categoryid=posts.categoryid WHERE postid=$1",
    [postid],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
});

app.post("/posts/incrementPostClap", (req, res) => {
  let { postid } = req.body;
  pool.query(
    "UPDATE posts SET likecount = likecount + 1 WHERE postid = $1",
    [postid],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
});

app.post("/posts/createPost", (req, res) => {
  const { title, content, categoryid, userid, imageurl } = req.body;
  const postid = uuidv4();
  const publishdate = new Date().toISOString().slice(0, 10);
  let likecount = 0;
  pool.query(
    "INSERT INTO posts (title, content, imageurl, publishdate, categoryid, userid, postid, likecount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [
      title,
      content,
      imageurl,
      publishdate,
      categoryid,
      userid,
      postid,
      likecount
    ],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).send("Post added successfully!");
      // console.log(results.rows);
    }
  );
});

app.get("/users/getAllUsers", (req, res) =>
  // res.status(200).send({ message: "Welcome to the default API route" })

  pool.query("SELECT * FROM users", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  })
);

app.get("/users/getUserById/:userid", (req, res) => {
  const { userid } = req.params;
  pool.query(
    "SELECT * FROM users WHERE userid = $1",
    [userid],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
});

app.get("/posts/deletePostById/:postid", (req, res) => {
  const { postid } = req.params;
  pool.query(
    "DELETE FROM posts WHERE postid = $1",
    [postid],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).send("Post deleted successfully!");
    }
  );
});

app.post("/users/signup", (req, res) => {
  const { fullName, email, password, avatarUrl } = req.body;
  const userid = uuidv4();
  pool.query(
    "INSERT INTO users (userid, fullname, email, password, avatarurl) VALUES ($1, $2, $3, $4, $5)",
    [userid, fullName, email, password, avatarUrl],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).json({ signUpSuccessful: true });
    }
  );
});

app.post("/users/signin", (req, res) => {
  const { email, password } = req.body;
  pool.query(
    "SELECT * FROM users WHERE email = $1 AND password=$2",
    [email, password],
    (error, results) => {
      if (error) {
        throw error;
      }
      console.log("signInResult:", results);
      if (results.rows.length > 0) {
        res
          .status(200)
          .json({ canLogin: true, userid: results.rows[0].userid });
      } else {
        res.status(200).json({ canLogin: false });
      }
    }
  );
});

app.get("/categories/getAllCategories", (req, res) =>
  // res.status(200).send({ message: "Welcome to the default API route" })

  pool.query("SELECT * FROM categories", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  })
);

app.get("/categories/getPostsByCategory/:categoryid", (req, res) => {
  const { categoryid } = req.params;
  pool.query(
    "SELECT * FROM posts WHERE categoryid = $1",
    [categoryid],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
});

app.get("/posts/getPostsByUserId/:userId", (req, res) => {
  const { userId } = req.params;
  pool.query(
    "SELECT * FROM posts WHERE userid = $1",
    [userId],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
});

app.get("/comments/getAllComments", (req, res) =>
  pool.query("SELECT * FROM comments", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  })
);

app.post("/comments/create", (req, res) => {
  const { content, userid, postid } = req.body;
  const commentid = uuidv4();
  const createdate = new Date().toISOString().slice(0, 10);
  pool.query(
    "INSERT INTO comments (commentid, userid, postid, content, createdate) VALUES ($1, $2, $3, $4, $5)",
    [commentid, userid, postid, content, createdate],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).send(`User added with ID: ${results}`);
    }
  );
});

app.get("/comments/getCommentsOfPost/:postid", (req, res) => {
  const { postid } = req.params;
  pool.query(
    "SELECT * FROM comments NATURAL JOIN users WHERE postid = $1",
    [postid],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
