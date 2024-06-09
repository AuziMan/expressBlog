const express = require('express');
const router = require('./main');
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

/**
 * Check Login
 * */

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if(!token) {
        return res.redirect('/');
    }

    try{
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch(error){
         res.status(401).json({ message: 'Unauthorized'});
    }
}



/**
 * GET / 
 * Admin
 * */

router.get('/admin', async (req, res) => {
    try{         
        const locals = {
            title: "Admin",
            description: ""
        }
        res.render('admin/index', { locals, layout: adminLayout});
       } catch(error) {
           console.log(error);
       }
    });


    /**
 * Post / 
 * Admin -- Check Login
 * */

router.post('/admin', async (req, res) => {
    try{  
        const { username, password} = req.body;

        const user = await User.findOne({username});

        if(!user) {
            return res.status(401).json({message: 'Invalid Creds'});
        } 

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json({message: 'Invalid pw'});

            // res.redirect('/invalidLogin');

        } 

        const token = jwt.sign({userId: user._id}, jwtSecret);

        res.cookie('token', token, {httpOnly: true})

        res.redirect('/dashboard');


        } catch(error) {
            console.log(error);
        }
    }); 


/**
 * Post / 
 * Register -- Register
 * */


router.post('/register', async (req, res) => {
    try{  
        const { username, password } = req.body;

        const hashPassword = await bcrypt.hash(password, 10);
        
        try{
            const user = await User.create({ username, password: hashPassword});
            res.status(201).json({message: 'User Created', user});
        } catch(error) {
            if(error.code === 11000) {
                res.status(409).json({message: 'User Already in use'})
            }
            res.status(500).json({message: 'internal server error'})
        }
    
        res.redirect('/admin');
        } catch(error) {
            console.log(error);
        }
    }); 

/**
 * Get / 
 * dashboard -- Check Login
 * */

router.get('/dashboard', authMiddleware, async (req, res) => {

    const locals = {
        title: 'Add Post',
        description: 'Admin add post page'
    }
    try{
        const data = await Post.find();
        res.render('admin/dashboard', {
            locals,
            data,
            layout: adminLayout
        });
    } catch(error){
        console.log(error);

    }
});

/**
 * Get / 
 * admin -- Create new post
 * */
router.get('/add-posts', authMiddleware, async (req, res) => {

    try{
        const locals = {
            title: 'Add Post',
            description: 'Admin add post page'
        }
        const data = await Post.find();
        res.render('admin/add-posts', {
            locals,
            layout: adminLayout
        });
    } catch(error){
        console.log(error);

    }
});


/**
 * POST / 
 * admin -- Create new post
 * */
router.post('/add-posts', authMiddleware, async (req, res) => {
    try{

        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body,
                song: req.body.song
            });

            await Post.create(newPost);
            res.redirect('/dashboard')

        } catch (error) {
            console.log(error);
        }
    } catch(error){
        console.log(error);

    }
});


/** GET 
 * edit post page */
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try{

        const locals = {
            title: 'Edit Post',
            description: 'Admin add post page'
        };
        
        const data = await Post.findOne({_id: req.params.id});

        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout
        })

        res.redirect(`/edit-posts/${req.params.id}`);

    } catch(error){
        console.log(error);

    }
});

/** PUT
 * edit post functionality
 */
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try{
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        })

        res.redirect(`/dashboard`);

    } catch(error){
        console.log(error);

    }
});

/** DELETE
 * Admin Delete Post
 */

router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne ({ _id: req.params.id});
        res.redirect('/dashboard')
    } catch (error) {
        
    }
})


/** GET
 * Admin logout
 */

router.get('/logout', async (req, res) => {
   res.clearCookie('token');
   res.redirect('/')
})


module.exports = router