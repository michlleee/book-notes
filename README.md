Book Tracker Web App
=====================

Description:
------------
This is a web-based Book Tracker application built with Node.js, Express, and PostgreSQL.
It allows users to add, view, edit, and delete books they have read, along with storing notes and ratings.
The app uses the Open Library API to validate book title, author, ISBN and to get book covers (as images to be displayed).

<img width="3193" height="1638" alt="image" src="https://github.com/user-attachments/assets/dd891dee-243f-4f87-86fa-ef28dfa2b41e" />
<img width="3195" height="1648" alt="image" src="https://github.com/user-attachments/assets/6e1b9ce1-5a8e-4bc3-bed9-c601248beb27" />
<img width="3182" height="1607" alt="image" src="https://github.com/user-attachments/assets/566b302c-a0d0-46dc-ac76-7529024f557e" />

Features:
---------
- View a list of all books sorted by title, author, or rating
- Add a new book with:
    - Title
    - Author
    - ISBN
    - Date read
    - Rating
    - Notes
- View detailed information about a book
- Edit book notes
- Delete a book

Technologies Used:
------------------
- Node.js
- Express.js
- EJS Templating
- PostgreSQL
- Open Library API
- Axios
- CSS for styling

Setup Instructions:
-------------------

1. Clone the repository:
   git clone https://github.com/michlleee/book-notes

2. Navigate into the project directory:
   cd <your-project-folder>

3. Install dependencies:
   npm install

4. Create a PostgreSQL database and a table:
   Example SQL:
   CREATE TABLE books (
     id SERIAL PRIMARY KEY,
     title VARCHAR(255),
     author VARCHAR(255),
     date_read DATE,
     rating INTEGER,
     notes TEXT,
     isbn VARCHAR(20)
   );

5. Create a `.env` file in the root folder:
   Example contents:

   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   DB_NAME=your_database_name

6. Start the server:
   npm start

7. Visit `http://localhost:3000` in your browser.

Folder Structure:
-----------------
/public           - Static files like CSS, JS and assets
/views            - EJS templates
.env              - Hidden file storing your DB credentials (DO NOT COMMIT)
/index.js         - Main server file

Notes:
------
- The project uses `dotenv` to keep your PostgreSQL credentials private.
- All book information is validated using the Open Library API.
- You can sort books from the home page using query strings like `/?sort=title`, `/?sort=author`, `/?sort=rating` or through the Sort By dropdown.
