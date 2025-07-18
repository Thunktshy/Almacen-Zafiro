// =============================
// Imports & Environment Setup
// =============================
require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const dbInstance = require('./db/db.js');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const { body, validationResult } = require('express-validator');

const app = express();

// =============================
// Security Middleware Setup
// =============================

// HTTP headers protection
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false // Disable for now if you need to embed external resources
}));

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please try again later'
});

// CSRF protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// =============================
// Session Configuration
// =============================
const sessionConfig = {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: 'app.sid',
    cookie: {
        maxAge: 60 * 60 * 1000, // 1 hour
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        path: '/'
    },
    store: new (require('connect-pg-simple')(session))({
        conString: process.env.DATABASE_URL,
        ttl: 86400
    })
};

app.use(session(sessionConfig));

// =============================
// Authentication Middleware
// =============================
function requireLogin(req, res, next) {
    if (!req.session.userID) {
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Additional security checks
    if (req.session.userAgent !== req.get('User-Agent')) {
        req.session.destroy();
        return res.status(403).json({ error: 'Session invalid' });
    }
    
    next();
}

function requireAdmin(req, res, next) {
    requireLogin(req, res, () => {
        // Add your admin verification logic here
        if (!req.session.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
}

// =============================
// File Upload Configuration
// =============================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpe?g|png|gif)$/i)) {
            return cb(new Error('Please upload a valid image file'));
        }
        cb(null, true);
    }
});

// =============================
// Routes
// =============================

// Public routes
app.use(express.static("Public"));

// Auth routes
app.post('/login', authLimiter, [
    body('user').trim().notEmpty().isLength({ min: 3, max: 30 }).escape(),
    body('password').notEmpty().isLength({ min: 8, max: 100 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: 'Validation error',
            errors: errors.array() 
        });
    }

    const { user, password } = req.body;

    try {
        const userData = await dbInstance.queryWithParams(
            "SELECT Usuario_Id, password FROM Usuarios WHERE Nombre = ?",
            [user]
        );

        // Generic error message to prevent user enumeration
        if (userData.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        const userRecord = userData[0];
        const passwordMatch = await bcrypt.compare(password, userRecord.password);

        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        // Regenerate session
        req.session.regenerate((err) => {
            if (err) {
                console.error("Session regeneration error:", err);
                return res.status(500).json({ 
                    success: false, 
                    message: "Server error" 
                });
            }

            req.session.userID = userRecord.Usuario_Id;
            req.session.userAgent = req.get('User-Agent');
            
            // Set secure session cookie
            req.session.cookie.secure = true;
            req.session.cookie.httpOnly = true;
            req.session.cookie.sameSite = 'strict';
            
            return res.json({ 
                success: true, 
                message: "Login successful",
                csrfToken: req.csrfToken() 
            });
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('app.sid', {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
    });

    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Logout failed" 
            });
        }
        
        res.set('Cache-Control', 'no-store, max-age=0');
        res.set('Clear-Site-Data', '"cookies", "storage"');
        
        return res.json({ 
            success: true, 
            message: "Logged out successfully" 
        });
    });
});

// Session check endpoint
app.get('/session', (req, res) => {
    if (!req.session.userID) {
        return res.json({ loggedIn: false });
    }
    
    // Verify session against database
    dbInstance.query('SELECT * FROM sessions WHERE sid = $1', [req.sessionID], (err, result) => {
        if (err || !result.rows.length) {
            req.session.destroy();
            return res.json({ loggedIn: false });
        }
        
        res.json({ 
            loggedIn: true,
            userID: req.session.userID,
            csrfToken: req.csrfToken()
        });
    });
});

// Protected routes
app.use('/admin', requireLogin, express.static(path.join(__dirname, 'Protected')));
app.get('/admin', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'Protected', 'admin.html'), {
        headers: {
            'Cache-Control': 'no-store'
        }
    };
});

// API routes
app.get("/products", async (req, res) => {
    try {
        const products = await dbInstance.queryWithParams("SELECT * FROM Products", []);
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Error fetching products" });
    }
});

// ... (other routes with similar security patterns)

// =============================
// Server Startup
// =============================
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log("\nServer stopping...");
    console.log("Clearing sessions and closing database pool...");

    if (dbInstance?.dbconnector) {
        await dbInstance.dbconnector.end();
        console.log("Database pool closed.");
    }

    server.close(() => {
        console.log("Server stopped.");
        process.exit(0);
    });
});