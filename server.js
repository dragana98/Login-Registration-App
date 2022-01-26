const express = require('express');
var createError = require('http-errors');
const cors = require('cors');
var path = require('path');
const dotenv = require('dotenv');
dotenv.config();
var session = require('express-session');
const swaggerJsDoc = require('swagger-jsdoc'); // swagger docs
const swaggerUi = require('swagger-ui-express');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// Swagger Options Settings
const swaggerOptions = {
    swaggerDefinition: {
      info: {
        version: "1.0.0",
        title: "Custom API",
        description: "Customer API",
        contact: {
          name: "Dragana Andjelkovic"
        },
        servers: ["http://localhost:5000"]
      }
    },
    //apis: ["server.js",".routes/*.js"]
    apis: [`${path.join(__dirname,"./routes/*.js")}`]
  };
  
const server = express();

const swaggerDocs = swaggerJsDoc(swaggerOptions);
server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// VES - View Engine Setup
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'pug'); 

// Database connection
const dbService = require('./database/dbService'); 

// Session
server.use(session({
    secret: 'ABCDefgOp',
    resave : false,
    saveUninitialized: true
}));

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended : false }));

server.use('/', indexRouter);
server.use('/users', usersRouter);

// ERROR 404 
server.use(function(req, res, next) {
    next(createError(404));
  });
  
// Error handler
server.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // ERROR PAGE
    res.status(err.status || 500);
    res.render('error');
});

server.listen(process.env.PORT, () => console.log('Application is running on PORT:' + process.env.PORT));



module.exports = server;