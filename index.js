import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import GoogleStrategy from "passport-google-oauth2";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { Client } = pg;
const saltRounds = 10;
const app = express();
const port = 3000;

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

console.log(process.env.GOOGLE_CLIENT_ID)
console.log(process.env.GOOGLE_CLIENT_SECRET)

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

app.get("/", (req, res)=>{
    res.render("landing.ejs", {error: null});
});

app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

app.get("/auth/google/books", passport.authenticate("google", {
    successRedirect: "/books",
    failureRedirect: "/"
}));

app.post("/register", async (req, res)=>{
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if(checkResult.rows.length > 0){
            res.render("landing.ejs", {error: "Account registered. Try logging in."});
        }else{
            bcrypt.hash(password, saltRounds, async(err, hash)=>{
                if(err){
                    console.error("Error hashing password", err);
                }else{
                    const result = await db.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
                        [username, email, hash]
                    );
                    const user = result.rows[0];
                    // req.login here
                    req.login(user, (err) =>{
                        console.log("Success");
                        res.redirect("/books");
                    })
                }
            })
        }
    } catch (error) {
        console.log(error);
    }
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/books",
    failureRedirect: "/",
}));

passport.use("local", new Strategy({ usernameField: "email" }, async function verify(email, password, cb){
    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if(result.rows.length > 0){
            const user = result.rows[0];
            const storedHash = user.password;
            console.log(user);
            bcrypt.compare(password, storedHash, (err, valid)=>{
                if(err){
                    console.log("Error comparing passwords: ", err);
                }else{
                    if(valid){
                        console.log("success login");
                        return cb(null, user);
                    }else{
                        //wrong password
                        return cb(null, false);
                    }
                }
            });
        }else{
            return cb("User not found.");
        }
    } catch (error) {
        console.log(error);
    }
}));

app.get("/books", async (req, res)=>{
    if(req.isAuthenticated()){
        //console.log(req.user);
        const userId = req.user.id;
        const sort = req.query.sort;
        let allBooks;
        try {
            if (sort === "title") {
                allBooks = await db.query("SELECT * FROM books WHERE user_id = $1 ORDER BY title"
                    ,[userId]
                );
            } else if (sort === "author") {
                allBooks = await db.query("SELECT * FROM books WHERE user_id = $1 ORDER BY author"
                    ,[userId]
                );
            } else if (sort === "rating") {
                allBooks = await db.query("SELECT * FROM books WHERE user_id = $1 ORDER BY rating DESC"
                    ,[userId]
                );
            } else {
                allBooks = await db.query("SELECT id, title, author, date_read, isbn, rating FROM books WHERE user_id = $1"
                    ,[userId]
                );
            }
            const books = allBooks.rows;
            res.render("books.ejs", { book: books , username: req.user.username});
    
        } catch (error) {
            console.error(error);
            res.send("Error loading books.");
        }
    }else{
        res.redirect("/");
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
                await db.query("INSERT INTO books (title, author, date_read, rating, notes, isbn, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    [req.body.title, req.body.author, req.body.date_read, req.body.rating, req.body.notes, req.body.isbn, req.user.id]
                );
                res.redirect("/books");
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
        res.redirect("/books");
    } catch (error) {
        console.log(error);
    }
});

app.get("/logout", (req, res)=>{
    req.logout(function (err){
        if(err){
            return next(err);
        }
        res.redirect("/");
    })
});

passport.use("google", new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/books",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb)=>{
        try {
            console.log(profile);
            //generate username
            const username = profile.displayName.replace(/\s+/g, '').toLowerCase();

            const email = profile.emails[0].value;
            const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
            if(result.rows.length === 0){
                //user doesnt exist
                const newUser = await db.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)"
                    ,[username, email, "google"]
                );
                return cb(null, newUser.rows[0]);
            }else{
                return cb(null, result.rows[0]);
            }
        } catch (error) {
            return cb(error);
        }
    }
))

passport.serializeUser((user, cb)=>{
    cb(null, user);
});

passport.deserializeUser((user, cb)=>{
    cb(null, user);
});

app.listen(port, ()=>{
    console.log(`server is running on port ${port}`);
});