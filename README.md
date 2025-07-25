Book Tracker Web App
=====================

Description:
------------
This is a web-based Book Tracker application built with Node.js, Express, and PostgreSQL. It allows users to add, view, edit, sort and delete books they have read, 
along with storing notes and ratings. Book data and cover images are fetched using the Open Library API. 
The app also features user authentication, allowing users to register or log in using Google or email/password, 
with passwords securely salted and hashed in the database.

<details>
  <summary>Click to view app screenshots</summary>

  <p align="center">
    <img src="https://github.com/user-attachments/assets/d304361a-dc7a-40e4-8d3b-f80fa505e062" width="600"/>
    <br>
    <img src="https://github.com/user-attachments/assets/dd891dee-243f-4f87-86fa-ef28dfa2b41e" width="600"/>
    <br>
    <img src="https://github.com/user-attachments/assets/6e1b9ce1-5a8e-4bc3-bed9-c601248beb27" width="600"/>
    <br>
    <img src="https://github.com/user-attachments/assets/566b302c-a0d0-46dc-ac76-7529024f557e" width="600"/>
  </p>

</details>


Features:
---------
- User authentication via Google or email/password (with secure password hashing)
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
- Node.js & Express.js – Backend server and routing
- EJS – Templating engine for dynamic HTML rendering
- PostgreSQL – Relational database to store user and book data
- Open Library API – To validate book data and fetch cover images
- Axios – HTTP client for API requests
- CSS – Custom styling for the frontend UI
- Passport.js – For handling authentication (Google OAuth and local strategy)
- bcrypt – To securely hash and salt passwords

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
   ```
   CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255),
        username VARCHAR(50)
    );
   
   CREATE TABLE books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(225) NOT NULL,
        author VARCHAR(225) NOT NULL,
        date_read DATE,
        rating INTEGER CHECK (rating >= 0 AND rating <= 10),
        notes TEXT,
        isbn VARCHAR(20),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    );
   ```

6. Create a `.env` file in the root folder:
   ```
   Example contents:
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   SESSION_SECRET=your_secret_session
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   DB_NAME=your_database_name
   ```

7. Start the server:
   npm start

8. Visit `http://localhost:3000` in your browser.

Folder Structure:
-----------------
```
/public           - Static files like CSS, JS and assets
/views            - EJS templates
.env              - Hidden file storing your DB credentials (DO NOT COMMIT)
/index.js         - Main server file
```
Notes:
------
- The project uses `dotenv` to keep your PostgreSQL and google credentials private.
- All book information is validated using the Open Library API.
- You can sort books from the home page using query strings like `/?sort=title`, `/?sort=author`, `/?sort=rating` or through the Sort By dropdown.
