const crypto = require("crypto");
const {pool} = require("../../database");

module.exports = {
  loginController: (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    // Hash the provided password for comparison
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Check if the user exists in the database
    const selectQuery = "SELECT * FROM admin_users WHERE username = ?";
    pool.query(selectQuery, [username], (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        res.status(500).json({ message: "Login failed" });
      } else {
        if (results.length === 0) {
          res.status(401).json({ message: "User not found" });
        } else {
          const user = results[0];
          if (user.password === hashedPassword) {
            res.status(200).json({ message: "Login successful" });
          } else {
            res.status(200).json({ message: "Incorrect password" });
          }
        }
      }
    });
  },
  createUser: (req, res) => {
    const { username, password } = req.body;

    // Hash the password using crypto-js
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Insert the user into the database
    const insertQuery =
      "INSERT INTO admin_users (username, password) VALUES (?, ?)";
    pool.query(insertQuery, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        res.status(500).json({ message: "Registration failed" });
      } else {
        res.status(200).json({ message: "Registration successful" });
      }
    });
  },
};
