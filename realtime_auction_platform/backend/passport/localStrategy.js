const LocalStrategy = require('passport-local').Strategy;
const bcypt = require('bcrypt');

const { User } = require('../models');

module.exports = (passport) => {
    passport.use(new LocalStrategy({
        usernameField: 'email', //req.body.email
        passwordField: 'password', //req.body.password
    }, async(email, password, done) => { //done(authError, user, failinfo)
        try{    
            const checkUser = await User.find({where: {email}});

            if(checkUser)
            {
                const result = await bcypt.compare(password, checkUser.password);
                if(result){
                    done(null, checkUser);
                }else {
                    done(null, false, {message: 'Wrong Password'});     
                }
            }else{
                done(null, false, {message: 'Not Joined User'});
            }
        }catch(error){
            console.error(error);
            done(error);
        }
    }));
}

