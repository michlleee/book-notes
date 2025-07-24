import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { Client } = pg;

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
db.connect();

//sample data
let books = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    date_read: "2023-08-15",
    rating: 9,
    notes: `Atomic Habits is all about how small changes compound over time to create remarkable results. 
One key insight I loved is the focus on identity-based habits — becoming the type of person who does certain actions 
rather than just aiming for goals. The 1% improvement concept really hit me because it shows that progress isn't about huge leaps, 
but about consistent, tiny steps. The 4 laws of behavior change — make it obvious, make it attractive, make it easy, 
make it satisfying — are incredibly practical and I've started using them in my daily life.`,
    isbn: "9780735211292"
  }
];

async function validateInput(input) {
    try {
        const encodeInput = encodeURIComponent(input);
        const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeInput}`);

        if(response.data.numFound > 0){
            const firstResult = response.data.docs[0];
            console.log(`Title: ${firstResult.title}, Author: ${firstResult.author_name?.join(", ")}`);
            return true;
        }else{
            console.log("Book not found");
            return false;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function checkIsbn(title, author, input){
    try {
        const encodeInput = encodeURIComponent(input);
        const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeInput}`);

        if(response.data.numFound > 0){
            const firstResult = response.data.docs[0];
            if(title === firstResult.title && author === firstResult.author_name?.join(", ")){
                return true;
            }else{
                console.log("Isbn does not match.")
                return false;
            }
        }else{
            console.log("Book not found");
            return false;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}


app.get("/", async (req, res)=>{
    let sort = req.query.sort;
    try {
        if (sort === "title") {
            const allBooks = await db.query("SELECT * FROM books ORDER BY title");
            books = allBooks.rows;
        } else if (sort === "author") {
            const allBooks = await db.query("SELECT * FROM books ORDER BY author");
            books = allBooks.rows;
        } else if (sort === "rating") {
            const allBooks = await db.query("SELECT * FROM books ORDER BY rating DESC");
            books = allBooks.rows;
        } else {
            const allBooks = await db.query("SELECT id, title, author, date_read, isbn, rating FROM books");
            books = allBooks.rows;
        }

        res.render("index.ejs", { book: books });

    } catch (error) {
        console.error(error);
        res.send("Error loading books.");
    }
});


app.get("/new", (req, res)=>{
    res.render("newBook.ejs");
});

app.get("/books/:id", async (req, res)=>{
    const id = parseInt(req.params.id);
    const edited = req.query.edit === "true";
    try {
        const chosenBook = await db.query("SELECT * FROM books WHERE id = $1", [id]);
        // console.log(chosenBook.rows[0]);
        res.render("viewDetails.ejs", {book: chosenBook.rows[0], edited: edited});
    } catch (error) {
        console.log(`Book with id ${id} is not found.`);
        res.status(404);
    }
});

app.post("/edit", async(req, res)=>{
    const id = req.body.updatedBookId;
    const updatedNote = req.body.updatedNote;
    try {
        await db.query("UPDATE books SET notes = $1 WHERE id = $2 RETURNING title, author, notes", [updatedNote, id]);
        res.redirect(`/books/${id}`);
    } catch (error) {
        console.log(`Book with id ${id} is not found.`);
        res.status(404);
    }
});

app.post("/add", async(req, res)=>{
    if(await validateInput(req.body.title) && await validateInput(req.body.author)){
        if(await checkIsbn(req.body.title, req.body.author, req.body.isbn)){
            try {
                await db.query("INSERT INTO books (title, author, date_read, rating, notes, isbn) VALUES ($1, $2, $3, $4, $5, $6)",
                    [req.body.title, req.body.author, req.body.date_read, req.body.rating, req.body.notes, req.body.isbn]
                );
                res.redirect("/");
            } catch (error) {
                console.log(error);
            }
        }else{
            res.render("newBook.ejs", {error: "ISBN incorrect, please input a valid one."});
        }
    }else{
        res.render("newBook.ejs", {error: "Book title or author is incorect."});
    }
});

app.post("/delete", async(req, res)=>{
    const id = req.body.deleteBookId;
    try {
        await db.query("DELETE FROM books WHERE id = $1", [id]);
        res.redirect("/");
    } catch (error) {
        console.log(error);
    }
});

app.listen(port, ()=>{
    console.log(`server is running on port ${port}`);
});