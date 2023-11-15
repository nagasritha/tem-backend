const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

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

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username, name, password, gender, location)
     VALUES
      (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}',
       '${location}'  
      );`;
    if (validatePassword(password)) {
      await database.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await database.run(updatePasswordQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

app.get("/", async (request, response) => {
  const fetchData = `SELECT * FROM todo`;
  const queryResponse = await database.all(fetchData);
  response.send(queryResponse);
});

app.get("/crete", async (request, response) => {
  const createTableQuery = `
    CREATE TABLE todo (
      id INTEGER NOT NULL PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL, 
      gender VARCHAR(255) NOT NULL,
      avatar VARCHAR(255) NOT NULL,
      domain VARCHAR(255) NOT NULL,
      available BOOLEAN
    )
  `;
  const fetchData = await database.run(createTableQuery);
  response.send("table created");
});

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

app.delete("/delete/:id", async (request, response) => {
  const { id } = request.params;
  const query = `DELETE FROM todo WHERE id=${id}`;
  const queryResponse = await database.run(query);
  response.send({ message: "deleted successfully" });
});

module.exports = app;
