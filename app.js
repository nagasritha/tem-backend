const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const cors = require("cors");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());
app.use(cors());
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};
//to filter the data from the todo list
app.get("/users/", async (request, response) => {
  const {
    domain = "",
    gender = "",
    available = "",
    limit = 20,
    offset = 0,
  } = request.query;
  let query = null;
  console.log(domain, gender, available);
  if (gender !== "" && domain !== "" && available !== "") {
    query = `SELECT * FROM todo WHERE domain IN (${domain}) AND gender IN (${gender}) AND available LIKE ${available} LIMIT ${limit} OFFSET ${offset}`;
  } else if (gender !== "" && domain !== "") {
    query = `SELECT * FROM todo WHERE domain IN (${domain}) AND gender IN (${gender}) LIMIT ${limit} OFFSET ${offset}`;
  } else if (domain !== "" && available !== "") {
    query = `SELECT * FROM todo WHERE domain IN (${domain}) AND available LIKE ${available} LIMIT ${limit} OFFSET ${offset}`;
  } else if (gender !== "" && available !== "") {
    query = `SELECT * FROM todo WHERE gender IN (${gender}) and available LIKE ${available} LIMIT ${limit} OFFSET ${offset}`;
  } else if (domain !== "") {
    query = `SELECT * FROM todo WHERE domain IN (${domain}) limit ${limit} offset ${offset}`;
  } else if (gender !== "") {
    query = `SELECT * FROM todo WHERE gender IN (${gender}) LIMIT ${limit} OFFSET ${offset}`;
  } else if (available !== "") {
    query = `SELECT * FROM todo WHERE available LIKE ${available} LIMIT ${limit} OFFSET ${offset}`;
  } else {
    query = `SELECT * FROM todo limit ${limit} offset ${offset}`;
  }
  const fetchedData = await database.all(query);
  response.send(fetchedData);
});
//to add data into the todo list
app.post("/todoUsers", async (request, response) => {
  const {
    first_name,
    last_name,
    email,
    gender,
    avatar,
    domain,
    available,
  } = request.body;
  const firstName = first_name;
  const lastName = last_name;
  console.log(firstName, lastName, email, gender, avatar, domain, available);
  const query1 = `
  SELECT * FROM todo WHERE email='${email}'`;
  const resolve = await database.get(query1);
  if (resolve !== undefined) {
    response.status(400);
    response.send(resolve);
  } else {
    const insertionQuery = `
      INSERT INTO todo(first_name,last_name,email,gender,avatar,domain,available)
      VALUES(
          '${firstName}','${lastName}','${email}','${gender}','${avatar}','${domain}',${available})
      
      `;
    const dataResponse = await database.run(insertionQuery);
    response.send("added successfully");
  }
});
//to delete data from the todo list
app.delete("/delete/:id", async (request, response) => {
  const { id } = request.params;
  const query = `DELETE FROM todo WHERE id=${id}`;
  const queryResponse = await database.run(query);
  response.send({ message: "deleted successfully" });
});
//to get the data from the users group
app.get("/usersGroup", async (request, response) => {
  const query = `SELECT * FROM selfGroup`;
  const details = await database.all(query);
  response.send(details);
});
//to post the data into the users group
app.post("/usersGroup", async (request, response) => {
  const {
    first_name,
    last_name,
    email,
    gender,
    avatar,
    domain,
    available,
  } = request.body;
  const firstName = first_name;
  const lastName = last_name;
  console.log(firstName, lastName, email, gender, avatar, domain, available);
  const query1 = `
  SELECT * FROM selfGroup WHERE email='${email}'`;
  const resolve = await database.get(query1);
  if (resolve !== undefined) {
    response.status(400);
    response.send({ message: "user already exists" });
  } else {
    const insertionQuery = `
      INSERT INTO selfGroup(first_name,last_name,email,gender,avatar,domain,available)
      VALUES(
          '${firstName}','${lastName}','${email}','${gender}','${avatar}','${domain}',${available})
      
      `;
    const dataResponse = await database.run(insertionQuery);
    response.send({ message: "added successfully" });
  }
});
//to Edit the data
app.put("/users/:id", async (request, response) => {
  const { id } = request.params;
  console.log(id);
  const {
    first_name,
    last_name,
    email,
    gender,
    avatar,
    domain,
    available,
  } = request.body;
  const firstName = first_name;
  const lastName = last_name;
  const query = `
 UPDATE todo
 SET first_name='${firstName}',
 last_name='${lastName}',
 email='${email}',
 gender='${gender}',
 avatar='${avatar}',
 domain='${domain}',
 available=${available}
 WHERE id=${id}`;
  const execute = await database.run(query);
  response.send("updated Successfully");
});
//to delete the user from group
app.delete("/removeUser/:id", async (request, response) => {
  const { id } = request.params;
  const query = `DELETE FROM selfGroup WHERE id=${id}`;
  const queryResponse = await database.run(query);
  response.send({ message: "deleted successfully" });
});
module.exports = app;
