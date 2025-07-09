// =============================
// Imports & Environment Setup
// =============================
require('dotenv').config(); // Load .env variables

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const mariadb = require('mariadb');
const path = require('path');
const bcrypt = require('bcrypt');
const dbInstance = require('../ZafiroConstr_web/db/db.js');
const app = express();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;

// =============================
// Database Configuration
// =============================
const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ricardoydiego1', // Use a secure password or store it in .env
    database: process.env.DB_NAME || 'tiendaonline',
    connectionLimit: 5,
    acquireTimeout: 300
};

const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'Protected', 'img', 'products'));
  },
  filename: (req, file, cb) => {
    // 1) split originalname into [base, ext]
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
                     .replace(/\s+/g, '-')     // optional: no spaces
                     .replace(/[^a-zA-Z0-9\-_]/g, ''); // optional: strip weird chars
    // 2) timestamp
    const timestamp = Date.now();
    // 3) final filename
    cb(null, `${base}-${timestamp}${ext}`);
  }
});

const uploadProductImage = multer({
  storage: productImageStorage,     // <- use diskStorage
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpe?g|png|gif)$/i)) {
      return cb(new Error('Please upload a valid image file'));
    }
    cb(null, true);
  }
});


// 1) Configura Multer para categorías (diskStorage)
const categoryImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // apunta a Protected/img/categories
    const dir = path.join(__dirname, 'Protected', 'img', 'categories');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // timestamp + nombre original
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadCategoryImage = multer({
  storage: categoryImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },       // 10 MB máx.
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpe?g|png|gif)$/i)) {
      return cb(new Error('Solo se permiten imágenes JPEG, PNG o GIF'));
    }
    cb(null, true);
  }
});

// 1) Multer setup: keep uploads in memory, limit size, only images
const uploadimage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpe?g|png|gif)$/i)) {
      return cb(new Error('Please upload a valid image file'));
    }
    cb(null, true);
  }
});


// =============================
// Middleware
// =============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from "Public" folder (Note the case!)
app.use(express.static("Public"));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Change this in production and use .env
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: 60 * 60 * 1000 // 1 hour
    }
}));

// Middleware to require login
function requireLogin(req, res, next) {
    if (req.session && req.session.userID) {
        return next();
    }
    // If the request accepts HTML, redirect to the login page.
    if (req.headers.accept && req.headers.accept.indexOf('text/html') !== -1) {
        return res.redirect('/index.html');
    }
    // Otherwise, respond with a JSON error.
    return res.status(401).json({ error: "Unauthorized" });
}


// =============================
// Routes
// =============================

// --- Consultar todos los productos ---
app.get("/products", async (req, res) => {
    try {
        const products = await dbInstance.queryWithParams("SELECT * FROM Products", []);
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Error fetching products" });
    }
});

// --- Consultas productos activos ---
app.get("/products/active", async (req, res) => {
  try {
    const active = await dbInstance.queryWithParams(
      "SELECT * FROM Products WHERE IsActive = 0",
      []
    );
    res.json(active);
  } catch (error) {
    console.error("Error fetching active products:", error);
    res.status(500).json({ error: "Error fetching active products" });
  }
});

// Ruta para recibir los datos del formulario, procesar la imagen
// y guardar el nuevo producto.
app.post(
  "/submit-Product-form",
  uploadimage.single('productImageFile'),
  async (req, res) => {
    // 1) Extraer los campos enviados desde el formulario
    const {
      Name,
      Description,
      Category_Id,
      Sub_Category_Id,
      Sub_Category2,
      Shelf_Id,
      Price,
      Dimension_Id,
      Dimension_Value,
      Unit_Id,
      Unit_Value,
      stock_Quantity
    } = req.body;

    // 2) Ruta de imagen por defecto si no se sube ninguna
    let imagePath = "default.jpg";

    try {
      if (req.file) {
        // 3) Generar un nombre de archivo único y seguro:
        //    – Reemplazar espacios por guiones bajos
        //    – Eliminar caracteres no válidos
        //    – Añadir marca de tiempo para evitar duplicados
        const timestamp = Date.now();
        const safeName = Name.trim()
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${safeName}-${timestamp}.jpg`;

        // 4) Asegurar que exista la carpeta de destino
        const outDir = path.join(__dirname, 'Protected', 'img', 'products');
        await fs.mkdir(outDir, { recursive: true });

        // 5) Procesar la imagen con Sharp y la guardar en disco:
        //    – Redimensionar a un ancho máximo de 1200px
        //    – Comprimir al 80% de calidad JPEG
        //    – Escribir el archivo en la ruta especificada
        const outPath = path.join(outDir, filename);
        await sharp(req.file.buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outPath);

        // 6) Guardar la ruta relativa  en la base de datos
        //    y poder cargarla en el <img> de la página web
        imagePath = path.join('img', 'products', filename);
      }

      // 7) Obtener el último código de producto y calculamos el siguiente
      const result = await dbInstance.queryWithParams(
        "SELECT MAX(Code) AS lastCode FROM Products",
        []
      );
      const lastCode = result[0]?.lastCode || 0;
      const code = lastCode + 1;

      // 8) Insertar el nuevo producto en la base de datos
      await dbInstance.queryWithParams(
        `INSERT INTO products (
           Code, Name, Description,
           Category_Id, Sub_Category_Id, Sub_Category2,
           Shelf_Id, Price,
           Dimension_Id, Dimension_Value,
           Unit_Id, Unit_Value,
           stock_Quantity, ImagePath
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          Name,
          Description,
          Category_Id,
          Sub_Category_Id,
          Sub_Category2,
          Shelf_Id,
          Price,
          Dimension_Id,
          Dimension_Value,
          Unit_Id,
          Unit_Value,
          stock_Quantity || 0,
          imagePath
        ]
      );

      // Respuseta indicando éxito
      res.json({ success: true, message: "Producto guardado correctamente.", Code: code });
    } catch (error) {
      //  Manejo y registro de errores
      console.error("Error al procesar el formulario:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


// In your server route (example)
app.post("/update-product-form", async (req, res) => {
    const {
      productId, Name, Description, Category_Id, Shelf_Id, Price, 
      Dimension_Id, Dimension_Value, Unit_Id, Unit_Value, stock_Quantity, ImagePath
    } = req.body;
    try {
        // Example UPDATE query using a parameterized query:
        await dbInstance.queryWithParams(
            `UPDATE Products 
             SET Name = ?, Description = ?, Category_Id = ?, Shelf_Id = ?, Price = ?,
                 Dimension_Id = ?, Dimension_Value = ?, Unit_Id = ?, Unit_Value = ?, stock_Quantity = ?, ImagePath = ?
             WHERE Id = ?`,
            [
              Name, Description, Category_Id, Shelf_Id, Price,
              Dimension_Id, Dimension_Value, Unit_Id, Unit_Value,
              stock_Quantity || 0, ImagePath || "default.jpg", productId
            ]
        );
        res.json({ success: true, message: "Producto actualizado correctamente." });
    } catch (error) {
        console.error("Error al actualizar el producto:", error);
        res.status(500).json({ success: false, error: "Error al actualizar el producto." });
    }
});

app.get("/productwithId", async (req, res) => {
    try {
      const { id } = req.query; //  get 'id' from query params
      const product = await dbInstance.queryWithParams("SELECT * FROM Products WHERE Id = ?", [id]);
      
      if (product.length > 0) {
        res.json(product[0]);
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Error fetching product" });
    }
  });
  
  
// --- Category Routes ---
app.get("/getAllCategories", async (req, res) => {
    try {
        const categories = await dbInstance.queryWithParams("SELECT * FROM Categories", []);
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

app.post(
  '/submit-Category-form',
  uploadCategoryImage.single('categoryImageFile'),
  async (req, res) => {
    const { Name, Description } = req.body;
    // la ruta pública que guardarás en la BD
    const ImagePath = req.file
      ? `img/categories/${req.file.filename}`
      : 'img/categories/default-category.jpg';

    try {
      await dbInstance.queryWithParams(
        `INSERT INTO categories (Name, Description, Image_Path)
         VALUES (?, ?, ?)`,
        [Name, Description, ImagePath]
      );
      res.json({ success: true, message: 'Categoría creada con éxito.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Error en la BD.' });
    }
  }
);

app.get("/categories/getAll", async (req, res) => {
    try {
        const categories = await dbInstance.queryWithParams("SELECT * FROM Categories", []);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: "Error fetching categories" });
    }
});

// --- Brand Routes ---
app.post("/submit-Brand-form", async (req, res) => {
    const { Name } = req.body;
    try {
        await dbInstance.queryWithParams("INSERT INTO brands (Name) VALUES (?)", [Name]);
        res.json({ message: "Formulario enviado con éxito." });
    } catch (error) {
        res.status(500).json({ error: "Error al enviar el formulario." });
    }
});

app.get("/brands/getAll", async (req, res) => {
    try {
        const brands = await dbInstance.queryWithParams("SELECT * FROM Brands", []);
        res.json(brands);
    } catch (error) {
        res.status(500).json({ error: "Error fetching brands" });
    }
});

// --- Other GET Routes ---
app.get("/shelves/getAll", async (req, res) => {
    try {
        const shelves = await dbInstance.queryWithParams("SELECT * FROM Shelfs", []);
        res.json(shelves);
    } catch (error) {
        res.status(500).json({ error: "Error fetching shelves" });
    }
});

app.get("/units/getAll", async (req, res) => {
    try {
        const units = await dbInstance.queryWithParams("SELECT * FROM Units", []);
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: "Error fetching units" });
    }
});

app.get("/dimensions/getAll", async (req, res) => {
    try {
        const dimensions = await dbInstance.queryWithParams("SELECT * FROM Dimensions", []);
        res.json(dimensions);
    } catch (error) {
        res.status(500).json({ error: "Error fetching dimensions" });
    }
});

// --- Form Submissions ---
app.post("/submit-form", async (req, res) => {
    const { nombre, correo, mensaje } = req.body;
    try {
        await dbInstance.queryWithParams(
            "INSERT INTO formularios (nombre, correo, mensaje) VALUES (?, ?, ?)",
            [nombre, correo, mensaje]
        );
        res.json({ message: "Formulario enviado con éxito." });
    } catch (error) {
        res.status(500).json({ error: "Error al enviar el formulario." });
    }
});

app.get("/users/getId", async (req, res) => {
    const { username } = req.query;
    try {
        const user = await dbInstance.queryWithParams(
            "SELECT Usuario_Id FROM usuarios WHERE Nombre LIKE ?",
            [username]
        );
        if (user.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(user[0]);
    } catch (error) {
        console.error("Error fetching user ID:", error);
        res.status(500).json({ error: "Error fetching User ID" });
    }
});

app.get("/users/getpassword", async (req, res) => {
    const { username } = req.query;
    try {
        const user = await dbInstance.queryWithParams(
            "SELECT password FROM usuarios WHERE Nombre = ?",
            [username]
        );
        if (user.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(user[0]);
    } catch (error) {
        console.error("Error fetching user password:", error);
        res.status(500).json({ error: "Error fetching User Password" });
    }
});

app.get("/users/getUsernames", async (req, res) => {
    try {
        const users = await dbInstance.queryWithParams("SELECT Email, Nombre FROM USUARIOS", []);
        res.json(users);
    } catch (error) {
        console.error("Error fetching usernames:", error);
        res.status(500).json({ error: "Error fetching usernames" });
    }
});

app.post("/users/register", async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // SALT = 10

        await dbInstance.queryWithParams(
            "INSERT INTO USUARIOS (Email, Nombre, password) VALUES (?, ?, ?)",
            [email, username, hashedPassword]
        );

        res.json({ success: true, message: "Usuario registrado exitosamente." });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Error al registrar el usuario." });
    }
});

// --- Login/Logout Routes ---
app.post('/login', async (req, res) => {
    const { user, password } = req.body;

    try {
        const userData = await dbInstance.queryWithParams(
            "SELECT Usuario_Id, password FROM Usuarios WHERE Nombre = ?",
            [user]
        );

        if (userData.length === 0) {
            return res.status(401).json({ success: false, message: "Usuario no encontrado." });
        }

        const userRecord = userData[0];
        const passwordMatch = await bcrypt.compare(password, userRecord.password);

        if (passwordMatch) {
            req.session.userID = userRecord.Usuario_Id;
            return res.json({ success: true, message: "Inicio de sesión exitoso." });
        } else {
            return res.status(401).json({ success: false, message: "Contraseña incorrecta." });
        }
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ success: false, message: "Error en el servidor." });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: "No se pudo cerrar sesión." });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Sesión cerrada." });
        console.log("Sesion Cerrada: "+req.session)
    });
});

app.get('/session', (req, res) => {
    if (req.session.userID) {
        res.json({ loggedIn: true, userID: req.session.userID });
    } else {
        res.json({ loggedIn: false });
    }
});

// --- Admin Route ---
app.get('/admin', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'Protected', 'admin.html'));
});

// --- Auth Routes ---
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Read the port from the PORT environment variable (e.g. set by your hosting provider), 
// or default to 3000 when running locally.
const PORT = process.env.PORT || 3000;

// Start the server and bind to all IPv4 network interfaces (0.0.0.0).
// Binding to 0.0.0.0 rather than 'localhost' (127.0.0.1) makes the app reachable
// from other devices on your LAN (e.g. your Android phone).
app.listen(PORT, '0.0.0.0', () => {
  // This callback runs once the server is up and listening.
  // We log the actual address so you can verify it’s listening on 0.0.0.0:<PORT>.
  console.log(`Server is running and listening on all network interfaces at port ${PORT}`);
});


// 1) Protect the entire `Protected` folder
app.use(
    '/admin-resources',
    requireLogin,
    express.static(path.join(__dirname, 'Protected'))
  );
  
  // 2) Admin route
  app.get('/admin', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'Protected', 'admin.html'));
  });

// =============================
// Graceful Shutdown
// =============================
process.on('SIGINT', async () => {
    console.log("\nServer is stopping...");
    console.log("Clearing sessions and closing database pool...");

    if (dbInstance?.dbconnector) {
        await dbInstance.dbconnector.end();
        console.log("Database pool closed.");
    }

    process.exit(0);
});
