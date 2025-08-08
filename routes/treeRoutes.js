const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Tree = require('../models/Tree');

// Cấu hình Multer cho upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

router.get('/', async (req, res) => {
    const trees = await Tree.find().lean();
    res.render('pages/treeshop', { trees, editTree: null, error: null });
});

// Function to process image path
const processImagePath = (imageUrl, file) => {
    if (imageUrl) {
        // Check if the URL is relative or absolute
        return imageUrl.startsWith('http://') || imageUrl.startsWith('https://') ? 
            imageUrl : 
            `/uploads/${imageUrl.split('/').pop()}`;
    } else if (file) {
        return `/uploads/${file.filename}`;
    }
    return '';
};

router.post('/add', upload.single('imageFile'), async (req, res) => {
    try {
        const { treename, description, imageUrl } = req.body;
        if (!treename || !description) {
            const trees = await Tree.find().lean();
            return res.render('pages/treeshop', { trees, editTree: null, error: 'Tree name and description are required.' });
        }
        
        // Process image path consistently
        const image = processImagePath(imageUrl, req.file);

        await Tree.create({ treename, description, image });
        res.redirect('/');
    } catch (error) {
        const trees = await Tree.find().lean();
        res.render('pages/treeshop', { trees, editTree: null, error: 'Error uploading image.' });
    }
});

router.get('/delete/:id', async (req, res) => {
    await Tree.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

router.get('/reset', async (req, res) => {
    await Tree.deleteMany({});
    res.redirect('/');
});

router.get('/edit/:id', async (req, res) => {
    const editTree = await Tree.findById(req.params.id).lean();
    const trees = await Tree.find().lean();
    res.render('pages/treeshop', { trees, editTree, error: null });
});

router.post('/update/:id', upload.single('imageFile'), async (req, res) => {
    try {
        const { treename, description, imageUrl } = req.body;
        if (!treename || !description) {
            const trees = await Tree.find().lean();
            return res.render('pages/treeshop', { trees, editTree: null, error: 'Tree name and description are required.' });
        }

        const currentTree = await Tree.findById(req.params.id);
        let image = currentTree.image;

        // Update image if a new file is uploaded or a URL is provided
        if (imageUrl || req.file) {
            image = processImagePath(imageUrl, req.file);
        }
        
        await Tree.findByIdAndUpdate(req.params.id, { treename, description, image });
        res.redirect('/');
    } catch (error) {
        const trees = await Tree.find().lean();
        const editTree = await Tree.findById(req.params.id).lean();
        res.render('pages/treeshop', { trees, editTree, error: 'Error updating tree.' });
    }
});

router.get('/about', (req, res) => {
    res.render('pages/about');
});

module.exports = router;
