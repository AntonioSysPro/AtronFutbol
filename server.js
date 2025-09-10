const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'tu_secreto_jwt_super_seguro'; // ¡Cambia esto por una clave secreta real y segura!

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));
app.use('/assets', express.static(path.join(__dirname, 'docs', 'assets')));

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'admin.html'));
});

// Serve index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// Data storage files
const POSTS_FILE = path.join(__dirname, 'posts.json');
const COMMENTS_FILE = path.join(__dirname, 'comments.json');
const USERS_FILE = path.join(__dirname, 'users.json');

let posts = [];
let comments = [];
let users = [];

function loadData() {
    try {
        const postsData = fs.readFileSync(POSTS_FILE, 'utf8');
        posts = JSON.parse(postsData || '[]');
        posts.forEach(post => {
            if (!post.views) {
                post.views = 0;
            }
        });
    } catch (err) {
        console.error('Error reading posts.json:', err);
        posts = [];
    }

    try {
        const commentsData = fs.readFileSync(COMMENTS_FILE, 'utf8');
        comments = JSON.parse(commentsData || '[]');
    } catch (err) {
        console.warn('comments.json missing or invalid, initializing empty comments store');
        comments = [];
    }

    try {
        const usersData = fs.readFileSync(USERS_FILE, 'utf8');
        users = JSON.parse(usersData || '[]');
    } catch (err) {
        console.error('Error reading users.json:', err);
        users = [];
    }
}

function saveData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        console.log(`Data saved successfully to ${path.basename(file)}`);
    } catch (error) {
        console.error(`Error saving data to ${path.basename(file)}:`, error);
    }
}

loadData();

// --- AUTHENTICATION ROUTES ---

// Register a new user
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Por favor, completa todos los campos.' });
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: hashedPassword
    };

    users.push(newUser);
    saveData(USERS_FILE, users);

    res.status(201).json({ message: 'Usuario registrado con éxito.' });
});

// Login user
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Por favor, introduce email y contraseña.' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
});


// --- POSTS API Routes ---
// (The rest of your existing API routes for posts and comments)

// List posts
app.get('/api/posts', (req, res) => {
    loadData();
    const includeAll = req.query.all === '1' || req.query.all === 'true';
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = page * limit;
    const endIndex = startIndex + limit;

    let published = posts.filter(p => p.status === 'published');

    if (includeAll) {
        published = posts;
    }

    const paginatedPosts = published.slice(startIndex, endIndex);
    res.json(paginatedPosts);
});

// Get single post
app.get('/api/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
});

// Increment post views
app.post('/api/posts/:id/views', (req, res) => {
    const postId = req.params.id;
    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.views++;
    saveData(POSTS_FILE, posts);

    res.json({ views: post.views });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'docs', 'assets', 'images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage, limits: { fieldSize: 25 * 1024 * 1024 } })

// Create post
app.post('/api/posts', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Error uploading image:', err);
            return res.status(500).json({ error: 'Error uploading image' });
        }
        const { title, content, author, category } = req.body;
        if (!title || !content || !author || !category) return res.status(400).json({ error: 'Missing fields' });

        loadData();

        const newPost = {
            category,
            id: Date.now().toString(),
            title,
            content,
            author,
            image: req.file ? `/assets/images/${req.file.filename}` : '',
            status: 'pending',
            date: new Date().toISOString()
        };
        posts.push(newPost);
        saveData(POSTS_FILE, posts);
        res.status(201).json(newPost);
    });
});

// Update post
app.put('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });
    const allowed = ['title', 'content', 'author', 'image', 'status', 'date'];
    for (const key of allowed) {
        if (req.body[key] !== undefined) posts[postIndex][key] = req.body[key];
    }
    saveData(POSTS_FILE, posts);
    res.json(posts[postIndex]);
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const before = posts.length;
    posts = posts.filter(p => p.id !== postId);
    if (posts.length === before) return res.status(404).json({ error: 'Post not found' });
    saveData(POSTS_FILE, posts);
    res.sendStatus(204);
});

// --- COMMENTS API Routes ---
app.get('/api/comments', (req, res) => {
    const postId = req.query.postId;
    if (postId) return res.json(comments.filter(c => c.postId === postId));
    res.json(comments);
});

app.post('/api/comments', (req, res) => {
    const { author, text, postId } = req.body;
    if (!author || !text || !postId) return res.status(400).json({ error: 'Missing fields' });
    const newComment = {
        id: Date.now().toString(),
        author,
        text,
        postId,
        date: new Date().toISOString()
    };
    comments.push(newComment);
    saveData(COMMENTS_FILE, comments);
    res.status(201).json(newComment);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});