const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const {isLogin, isNotLogin} = require('./middlewares');
const {User} = require('../models');

const router = express.Router();

//POST /auth/join
router.post('/join', isNotLogin, async(req, res, next)=> {
    const { email, name, password } = req.body;
    try{
        const checkUser = await User.find({where: {email}});
        if(checkUser){
            req.flash('joinError', 'Already joined');
            return res.redirect('/join');
        }
        const hash = await bcrypt.hash(password, 5);

        await User.create({
            email,
            name,
            password:hash,          
        });
        return res.redirect('/');
        
    }catch(error){
        console.log(error);
        next(error);
    }
});

//POST /auth/login
router.post('/login', isNotLogin, (req,res,next) => {
    passport.authenticate('local', (authError, user, info) => {
    if(authError){
        console.error(authError);
        return next(authError);
    }
    if(!user) {
        req.flash('loginError', info.message);
        return res.redirect('/');
    }
    return req.login(user, (loginError) => {
        if(loginError) {
            console.error(loginError);
            return next(loginError);
        }
        return res.redirect('/');
    });
    })(req, res, next);
});

//GET /auth/logout
router.get('/logout', isLogin, (req, res) => {
    req.logout();
    res.redirect('/');
})

module.exports = router;