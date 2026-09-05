import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
db.connect();

app.get("/", async (req, res) => {

  try{
    const sortBy = req.query.sort;

    let query = "SELECT * FROM books ORDER BY id ASC"

    if (sortBy === "rating"){
      query = "SELECT * FROM books ORDER BY rating DESC"
    }else if(sortBy === "recency"){
      query = "SELECT * FROM books ORDER BY date_read DESC"
    }

    const result = await db.query(query)

    res.render("index.ejs",{
      books : result.rows,
    });
  }catch(error){
    console.log(error);
    res.status(500).send("There is something worng with the Database right now...");
  }
});

app.post("/add", async (req, res) => {
  try {
    const title = req.body.title;
    const notes = req.body.notes;
    const isbn = req.body.isbn;
    const rating = req.body.rating;
    const date = req.body.date;

    await db.query(
      "INSERT INTO books (title,notes,isbn,rating,date_read) values ($1,$2,$3,$4,$5)",
      [title, notes, isbn, rating, date],
    );
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("Database error....");
  }
});

/* 
  FLOW:
  1. If the database deletes the row successfully -> redirect back home.
  2. If the database crashes or disconnects -> catch catches the error, logs it, and sends back a 500 error instead of crashing the whole server.
*/
app.post("/delete", async (req, res) => {
  try {
    const deletedId = req.body.id;

    await db.query("DELETE FROM books WHERE id=$1", [deletedId]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("Database error");
  }
});

app.post("/update", async (req, res) => {
  try {
    const id = req.body.id;
    const isbn = req.body.isbn;
    const notes = req.body.notes;

    await db.query("UPDATE books SET notes = $1, isbn =$2 where id = $3", [
      notes,
      isbn,
      id,
    ]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("Database error...");
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
