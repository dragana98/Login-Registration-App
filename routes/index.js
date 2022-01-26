var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var bcrypt = require('bcrypt');
const dbService = require('../database/dbService');

// Welcome Page
/**
 * @swagger
 * /:
 *    get:
 *      summary: homepage
 *      description: Use to return index.js Home page with registration and log in form
 *    responses:
 *      '200':
 *       description: Successfully created user
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.get('/', function(req, res, next) {
  if(req.session.flag == 1)
  {
      req.session.destroy();
      res.render('index', {title: 'Neuspešno registrovanje', pagetitle: 'Prijavljivanje i registrovanje', message : 'Email je već registrovan!', flag : 0});
  }
  else if(req.session.flag == 2)
  {   
      req.session.destroy();
      res.render('index', {title: 'Registracija uspešna', pagetitle: 'Prijavljivanje i registrovanje', message : 'Uspešna registracija!' , flag : 1});
  }
  else if(req.session.flag == 3)
  {  
      req.session.destroy();
      res.render('index', {title: 'Nepodudarnost unetih lozinki', pagetitle: 'Prijavljivanje i registrovanje', message : 'Unete lozinke se ne podudaraju!', flag : 0});
  }
  else if(req.session.flag == 4)
  {  
      req.session.destroy();
      res.render('index', {title: 'Neuspešna prijava', pagetitle: 'Prijavljivanje i registrovanje', message : 'Niste uneli ispravan email ili lozinku!', flag : 0});
  }
  else{
    res.render('index', { title: 'Prijava i Registracija', pagetitle: 'Prijavljivanje i registrovanje' });
  }
 
});

// Registration - Handler 
/**
 * @swagger
 * /auth_register:
 *    post:
 *      summary: registration form
 *      description: Use to provide registration form
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              properties:
 *                fullname:
 *                  type: string
 *                  description: full name of the user
 *                email:
 *                  type: string
 *                  description: full email of the user
 *                username:
 *                  type: string
 *                  description: username of the user
 *                password:
 *                  type: string
 *                  description: password of the user
 *                cpassword:
 *                  type: string
 *                  description: repeated password of the user 
 *                image:
 *                  type: string
 *                  description: path of the image
 *    responses:
 *      '200':
 *       description: Successfully created user
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.post('/auth_register',function(req, res, next){

  var fullname = req.body.fullname;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var cpassword = req.body.cpassword;
  var image = req.body.image;

  if(password == cpassword)
  {
    var sql = 'SELECT * FROM users WHERE email = ?;';

    dbService.query(sql,[email], function(err, result, fields) {
      if(err)
      {
        throw err;
      }
      if(result.length > 0)
      {
        req.session.flag = 1;
        res.redirect('/');
      }else
      {
        var hashpassword = bcrypt.hashSync(password, 10);
        var sql = 'INSERT INTO users(fullname,email,username,image,password) VALUES(?,?,?,?,?);';

        dbService.query(sql,[fullname,email,username,image,hashpassword], function(err,result,fields){
          if(err) throw err;

          req.session.flag = 2;

          res.redirect('/');
        });
      }
    });
  }
  else
  {
    req.session.flag = 3;
    res.redirect('/');
  }
});

// LogIn - Handler
/**
 * @swagger
 * /auth_login:
 *    post:
 *      summary: login form
 *      description: Use to provide Login form
 *      requestBody:
 *        content:
 *          schema:
 *            properties:
 *              email:
 *                type: string
 *                description: full email of the user
 *              password:
 *                type: string
 *                description: password of the user
 *    responses:
 *      '200':
 *       description: Successfully logged in user
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.post('/auth_login', function(req,res,next){
  
  var email = req.body.email;
  var password = req.body.password;

  var sql = 'SELECT * FROM users WHERE email = ?;';

  dbService.query(sql,[email], function(err,result,fields){
    if(err) throw err;

    if(result.length && bcrypt.compareSync(password, result[0].password))
    {
      req.session.email = email;
      req.session.password = password;
      res.redirect('/home');
    }
    else
    {
      req.session.flag = 4;
      res.redirect('/');
    }
  });
});


// Home Page
/**
 * @swagger
 * /home:
 *    get:
 *      summary: homepage of logged in user
 *      description: Use to return Home Page after a successful login
 *      requestBody:
 *        content:
 *          schema:
 *            properties:
 *              email:
 *                type: string
 *                description: full email of the user
 *    responses:
 *      '200':
 *       description: Success
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.get('/home',function(req, res, next){

  var email = req.session.email;

  const query = "SELECT * FROM users WHERE email = " + "'" + email + "';";

  dbService.query(query,[email], function(err,result,fields){
    if(err) throw err;

    Object.keys(result).forEach(function(key) {
      var row = result[key];
      res.render('home',{message : 'Zdravo korisniče, ' + req.session.email, email : row.email, fullname : row.fullname, username : row.username, image : row.image});

    });
  });
});

// Logout
/**
 * @swagger
 * /logout:
 *    get:
 *      summary: logout
 *      description: Use to logout
 *    responses:
 *      '200':
 *       description: Successful logout
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */ 
router.get('/logout',function(req,res,next){

  if(req.session.email){
    req.session.destroy();
  }
  res.redirect('/');
}); 

// Update 
/**
 * @swagger
 * /updateUser:
 *    get:
 *      summary: update form
 *      description: Use to return updateUser page that provides update user form
 *      requestBody:
 *        content:
 *          schema:
 *            properties:
 *              email:
 *                type: string
 *                description: full email of the user
 *    responses:
 *      '200':
 *       description: Success
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.get('/updateUser',function(req, res, next){

  var email = req.session.email;

  const query = "SELECT * FROM users WHERE email = " + "'" + email + "';";

  dbService.query(query,[email], function(err,result,fields){
    if(err) throw err;

    Object.keys(result).forEach(function(key) {
      var row = result[key];
      if(req.session.flag == 5)
      {
        res.render('updateUser',{title: 'Niste uneli novu lozinku. Izmena neuspesna.', email : row.email, fullname : row.fullname, username : row.username, image : row.image});
   
      }
      else if(req.session.flag == 6){
        res.render('updateUser',{title: 'Neuspesna izmena lozinke', email : row.email, fullname : row.fullname, username : row.username, image : row.image});
   
      }
      else if(req.session.flag == 7){
        res.render('updateUser',{title: 'Uneli ste ponovo istu lozinku. Unesite novu.', email : row.email, fullname : row.fullname, username : row.username, image : row.image});
   
      }
      else if(req.session.flag == 8){
        res.render('updateUser',{title: 'Uneli ste neispravnu trenutnu lozinku!', email : row.email, fullname : row.fullname, username : row.username, image : row.image});
   
      }
      else{
        res.render('updateUser',{title: 'Update Data', email : row.email, fullname : row.fullname, username : row.username, image : row.image});
      }
    });
  });
  
});

// update fullname
/**
 * @swagger
 * /update/fullname:
 *    post:
 *      summary: update form
 *      description: Use to update fullname of current user
 *      requestBody:
 *        content:
 *          schema:
 *            properties:
 *              fullname:
 *                type: string
 *                description: full name of the user
 *              email:
 *                type: string
 *                description: full email of the user
 *    responses:
 *      '200':
 *       description: Successfully updated
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.post('/update/fullname',function(req,res,next){
  
  var email = req.session.email;
  var fullname = req.body.fullname;
  
  if(fullname != "")
  {
    var sql = "SELECT * FROM users WHERE email = " + "'" + email + "';";

    dbService.query(sql,[email], function(err, result, fields) {
      if(err)
      {
        throw err;
      }
        var sql = "UPDATE users SET fullname = " + "'" +  fullname + "' WHERE email =" + "'" + email + "';"; 

        dbService.query(sql,[fullname], function(err,result,fields){
          if(err) throw err;

            res.redirect('/updateUser');
        });
    });
  }
    
});

// update image
/**
 * @swagger
 * /update/image:
 *    post:
 *      summary: update form
 *      description: Use to update image of current user
 *      requestBody:
 *        content:
 *          schema:
 *            properties:
 *              email:
 *                type: string
 *                description: full email of the user 
 *              image:
 *                type: string
 *                description: path of the image
 *    responses:
 *      '200':
 *       description: Successfully updated
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.post('/update/image',function(req,res,next){
  
  var email = req.session.email;
  var image = req.body.image;
  
  if(image != "")
  {
    var sql = "SELECT * FROM users WHERE email = " + "'" + email + "';";

    dbService.query(sql,[email], function(err, result, fields) {
      if(err)
      {
        throw err;
      }
        var sql = "UPDATE users SET image =" + "'" +  image + "' WHERE email =" + "'" + email + "';"; 

        dbService.query(sql,[image], function(err,result,fields){
          if(err) throw err;

            res.redirect('/updateUser');
        });
    });
  }
    
});

// update username
/**
 * @swagger
 * /update/username:
 *    post:
 *      summary: update form
 *      description: Use to update username of current user
 *      requestBody:
 *        content:
 *          schema:
 *            properties:
 *              email:
 *                type: string
 *                description: full email of the user
 *              username:
 *                type: string
 *                description: username of the user
 *    responses:
 *      '200':
 *       description: Successfully updated
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.post('/update/username',function(req,res,next){
  
  var email = req.session.email;
  var username = req.body.username;
  
  if(username != "")
  {
    var sql = "SELECT * FROM users WHERE email = " + "'" + email + "';";

    dbService.query(sql,[email], function(err, result, fields) {
      if(err)
      {
        throw err;
      }
        var sql = "UPDATE users SET username =" + "'" +  username + "' WHERE email =" + "'" + email + "';"; 

        dbService.query(sql,[username], function(err,result,fields){
          if(err) throw err;

            res.redirect('/updateUser');
        });
      
    });
  }
    
});

// update email
/**
 * @swagger
 * /update/email:
 *    post:
 *      summary: update form
 *      description: Use to update email of current user
 *      requestBody:
 *        content:
 *          schema:
 *            properties:
 *              email:
 *                type: string
 *                description: full email of the user
 *              newEmail:
 *                type: string
 *                description: full email of the user
 *    responses:
 *      '200':
 *       description: Successfully updated
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.post('/update/email',function(req,res,next){
  
  var email = req.session.email;
  var newEmail = req.body.email;
  
  if(newEmail != "")
  {
    var sql = "SELECT * FROM users WHERE email = " + "'" + email + "';";

    dbService.query(sql,[email], function(err, result, fields) {
      if(err)
      {
        throw err;
      }
        var sql = "UPDATE users SET email =" + "'" +  newEmail + "' WHERE email =" + "'" + email + "';"; 

        dbService.query(sql,[newEmail], function(err,result,fields){
          if(err) throw err;

          req.session.email = newEmail; // nova sesija

          res.redirect('/updateUser');
        });
      
    });
  }  
});

// change password
/**
 * @swagger
 * /update/password:
 *    post:
 *      summary: update form
 *      description: Use to update password of current user
 *    responses:
 *      '200':
 *       description: Successfully updated
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.post('/update/password',function(req,res,next){
  
  var email = req.session.email;
  var password = req.body.password; // trenutna lozinka
  var cpassword = req.body.cpassword; // nova lozinka
  
  if(password != "")
  {
    if(password != req.session.password)
    {
        console.log("uspesno"); 
        req.session.flag = 9;
        res.redirect('/updateUser');
    }
  
    if(cpassword != "")
    {  
      if(password == cpassword)
      {
        req.session.flag = 7;
      res.redirect('/updateUser');
      }
      else{

        var sql = "SELECT * FROM users WHERE email = " + "'" + email + "';";

        dbService.query(sql,[password], function(err, result, fields) {
          if(err)
          {
            throw err;
          }
            var hashpassword = bcrypt.hashSync(cpassword, 10);
            var sql = "UPDATE users SET password = " + "'" +  hashpassword +  "' WHERE email =" + "'" + email + "';"; 

            dbService.query(sql,[hashpassword], function(err,result,fields){
              if(err) throw err;

                res.redirect('/updateUser');
            });
          
         });
      }
    }
    else
    {
      req.session.flag = 5;
      res.redirect('/updateUser');
    }
  }
  else
  {
    req.session.flag = 6;
    res.redirect('/updateUser');
  } 
});

// delete account
/**
 * @swagger
 * /deleteUser:
 *    get:
 *      summary: delete user
 *      description: Use to delete current user
 *      requestBody:
 *        content:
 *          application/json:
  *          schema:
  *            properties:
  *              fullname:
  *              email:
  *                type: string
  *                description: full email of the user
  *    responses:
 *      '200':
 *       description: Successfully deleted
 *      '404':
 *       description: User Error. Not found.
 *      '500':
 *       description: Internal Server error
 */
router.get('/deleteUser',function(req,res,next){
  
  var email = req.session.email;

  const query = "SELECT * FROM users WHERE email = " + "'" + email + "';";

  dbService.query(query,[email], function(err,result,fields){
    if(err) throw err;

    if(result.length)
    {
      const query = "DELETE FROM users WHERE email = '" + email + "';";

      dbService.query(query,[email], function(err,result,fields){
        if(err) throw err;
    
        req.session.destroy();

        res.redirect('/');
      });

    }
  });
});

module.exports = router;