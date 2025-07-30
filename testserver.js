// testserver.js
// =============================
// Imports & Environment Setup
// =============================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const dbInstance = require('./db/dbsql.js');  // your existing DB helper

const app = express();

// =============================
// Middleware
// =============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 60 * 60 * 1000  // 1 hour
  }
}));

// Middleware to require login
function requireLogin(req, res, next) {
  if (req.session && req.session.userID) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// =============================
// Auth Routes
// =============================

// Login
app.post('/login', async (req, res) => {
  const { user, password } = req.body;
  try {
    const rows = await dbInstance.queryWithParams(
      "SELECT Usuario_Id, password FROM Usuarios WHERE Nombre = ?",
      [user]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado." });
    }
    const { Usuario_Id, password: hash } = rows[0];
    const match = await bcrypt.compare(password, hash);
    if (!match) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta." });
    }
    req.session.userID = Usuario_Id;
    res.json({ success: true, message: "Inicio de sesión exitoso." });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: "No se pudo cerrar sesión." });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: "Sesión cerrada." });
  });
});

// Session status
app.get('/session', (req, res) => {
  if (req.session.userID) {
    res.json({ loggedIn: true, userID: req.session.userID });
  } else {
    res.json({ loggedIn: false });
  }
});

// Protected test route
app.get('/protected', requireLogin, (req, res) => {
  res.json({ message: "Este contenido está protegido y sólo accesible si estás logueado." });
});

// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Test server listening on http://127.0.0.1:${PORT}`)
);

