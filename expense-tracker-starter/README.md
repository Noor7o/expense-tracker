# Expense Tracker

This is a simple web app that helps me keep track of my daily expenses. I can add, edit and delete expenses, search and filter them, see a chart of my spending, and all the data is saved in a PostgreSQL database.

## How to run

You need Node.js, PostgreSQL and VS Code installed.

**Backend**

1. Create the database. Open a terminal and run:
```
   psql -U postgres -c "CREATE DATABASE expense_tracker;"
```
   If the `psql` command is not found, open pgAdmin, create a database called `expense_tracker`, and use the Query Tool in the next step.
2. Run the `schema.sql` file on the new database. Run this from the folder where `schema.sql` is:
```
   psql -U postgres -d expense_tracker -f schema.sql
```
   If you use pgAdmin, open `schema.sql` in the Query Tool and run it there.
3. Open the `backend` folder and create a file named `.env` with this inside (use your own PostgreSQL password):
```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=expense_tracker
```
4. In the `backend` folder, install the packages:
```
   npm install
```
5. Start the server and keep the terminal open:
```
   node server.js
```
6. To check that it works, open `http://localhost:3000/api/expenses` in the browser. You should see the expenses as JSON.

**Frontend**

1. Open the project folder in VS Code.
2. Right click on `frontend/index.html` and choose "Open with Live Server".
3. The page opens in the browser and loads the expenses from the backend. The backend must be running.

## Features

- [x] Add an expense (with validation)
- [x] Delete an expense
- [x] Edit an expense
- [x] Filter by category
- [x] Summary cards (total, count, highest) built with CSS Grid
- [x] Data is saved in a PostgreSQL database
- [x] Responsive design for phone and desktop
- [x] Search expenses by title
- [x] Sort the table by clicking a column title
- [x] Chart of spending by category (Chart.js)
- [x] Export the table as a CSV file
- [x] Dark mode (my choice is saved in the browser)

## Screenshots

Desktop:

![Desktop view]("expense-tracker-starter\expense-tracker-starter\screens\devicescreen.png")

Mobile:

![Mobile view]("expense-tracker-starter\expense-tracker-starter\screens\mobilescreen.png")

## What was the hardest part?

The hardest part was making the page show the data from the backend. At first I only saw an error message and the table was empty, so I had to check many small things one by one. The `psql` command did not work because PostgreSQL was not in my PATH, so I added it. Then the server looked like it was running, but the port was already used by an old process, so I closed that process and started the server again. Later the page broke because my JavaScript was looking for an element that did not exist in my HTML, and the code stopped before it could load the data. I found the problem by reading the error in the browser console. Now I always check the console first, and I make sure the ids in the HTML are the same as the ones in the JavaScript.