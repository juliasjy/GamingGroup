var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan 	= require('morgan');
var mongoose = require('mongoose');
var port = process.env.PORT || 8080;
var User = require('./app/models/user');
var apiRouter = express.Router();
var publicRouter=express.Router();
var jwt=require('jsonwebtoken');
var superSecret = 'ilovescotchscotchyscotchscotch';
var sql=require('mssql');
var sqlconfig = require('config.json');
var bcrypt = require('bcrypt-nodejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(function(req,res,next){
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST');
    res.setHeader('Access0Control-Allow-Headers','X_Requested-With,content-type ,\
    Authorization');
    next();
});

app.use(morgan('dev'));

app.get('/',function(req,res){
    res.send('Welcome to the home page!');
    console.log('GET in /');
});

apiRouter.post('/authenticate',function(req,res){
    console.log(req.body.email);
    sql.connect(sqlconfig,function (err) {
        if(err) {
            console.log(err);
            res.json({
                success:false,
                code: 1,
                message: 'Connect failed'
            });
        }else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist' + ' "' + req.body.email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code:2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Requset();
                            loginrequest.query('EXEC playerLogin'+'"'+req.body.email+'",'+req.body.password,function(err,recordset){
                                if (err){
                                    res.json({
                                        success: false,
                                        code:4,
                                        message:'Login in error'
                                    });
                                }else{
                                    if (recordset[0].result==1){
                                        var token = jwt.sign({
                                            email: req.body.email
                                        }, superSecret, {expiresIn: '30m'});
                                        res.json({
                                            success: true,
                                            code:0,
                                            message: 'Enjoy your token',
                                            token: token
                                        });
                                    }
                                    else{
                                        res.json({
                                            success:false,
                                            code:5,
                                            message:'Password error'
                                        });
                                    }
                                }

                            });


                        }else{
                            res.json({
                                success: false,
                                code:3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }

            )
        }
    });
});






    // User.findOne({
    //     username:req.body.username
    // }).select('name username password').exec(function(err,user){
    //     if(err) throw err;
    //
    //     if(!user){
    //         res.json({
    //             success:false,
    //             message:'Authentication failed. User not found.'
    //         });
    //     }else if (user){
    //
    //         var validPassword = user.comparePassword(req.body.password);
    //         if(!validPassword){
    //             res.json({
    //                 success:false,
    //                 message: 'Authentication failed. Wrong password'
    //             });
    //         }else{
    //
    //             var token=jwt.sign({
    //                 name:user.name,
    //                 username:user.username
    //             },superSecret,{expiresIn : '1d'});
    //             res.json({
    //                 success:true,
    //                 message:'Enjoy your token!',
    //                 token:token
    //             });
    //         }
    //     }
    // });

apiRouter.use(function(req,res,next){
    console.log('Somebody just came to our app!....use in apiRouter');

    var token = req.body.token  || req.query.token|| req.headers['x-access-token'];

    if (token){

        jwt.verify(token,superSecret,function(err,decoded){
            if (err) {
                return res.status(403).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                req.email=decoded.email;
                console.log("decode:    "+decoded.email);
                next();
            }
        });
    }else{
        return res.status(403).send({
            success:false,
            message:'No token provided.'
        });
    }
});

apiRouter.get('/',function(req,res){
    res.json({message:'hooray! welcome to our api!....GET in / of apiRouter'});

});
// apiRouter.route('/users')
//     .post(function(req,res){
//         var user = new User();
//         user.name=req.body.name;
//         user.username=req.body.username;
//         user.password = req.body.password;
//         user.save(function(err){
//             if (err) {
//                 console.log(err);
//                 if (err.code == 11000)
//                     return res.json({success: false, message: 'A user with that username already exists.'});
//                 else
//                     return res.send(err);
//             }
//             res.json({message:'User created!'});
//         });
//
//     })
//     .get(function(req,res){
//         User.find(function(err,users){
//             if(err)res.send(err);
//             else res.json(users);
//         });
//     });
apiRouter.route('/users/:user_id')
    .get(function(req,res){
        console.log("get user_id");
        User.findById(req.params.user_id,function(err,user){
            if(err)res.send(err);
            res.json(user);
        });
    })
    // .delete(function(req,res){
    //     User.remove({
    //         _id:req.params.user_id}
    //         ,function(err,user){
    //         if(err) return res.send(err);
    //         res.json({message:'Successfully deleted'});
    //         });
    //     })
    .put(function(req,res){
        User.findById(req.params.user_id,function(err,user){
            if(err)res.send(err);
            if(req.body.name)user.name=req.body.name;
            if(req.body.username)user.username=req.body.username;
            if(req.body.password)user.password=req.body.password;

            user.save(function(err){
                if(err)res.send(err);

                res.json({message:'User updated!'});
            });
        });
});

//get the nickname
apiRouter.get('/me',function(req,res){
    var email=req.email;
    sql.connect(sqlconfig,function (err) {
        if(err) {
            console.log(err);
            res.json({
                success:false,
                code: 1,
                message: 'Connect failed'
            });
        }else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code:2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Requset();
                            //TODO: change the PROCUDURE
                            loginrequest.query('EXEC playerLogin'+'"'+req.body.email+'",'+req.body.password,function(err,recordset){
                                if (err){
                                    res.json({
                                        success: false,
                                        code:4,
                                        message:'SQL UNKNOWN error'
                                    });
                                }else{
                                    res.json({
                                        success: true,
                                        code:0,
                                        message: 'Get your nickname',
                                        nickname: recordset[0].nickname
                                    });

                                }

                            });


                        }else{
                            res.json({
                                success: false,
                                code:3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }

            )
        }
    });
});

//getMygame
//Array: GName,Hours,Data
apiRouter.route('/me/games')
    //get information for the game
    .get(function(req,res){
    var email=req.email;
    sql.connect(sqlconfig,function (err) {
        if(err) {
            console.log(err);
            res.json({
                success:false,
                code: 1,
                message: 'Connect failed'
            });
        }else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code:2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Requset();
                            //TODO: change the PROCUDURE
                            loginrequest.query('EXEC playerLogin'+'"'+req.body.email+'",'+req.body.password,function(err,recordset){
                                if (err){
                                    res.json({
                                        success: false,
                                        code:4,
                                        message:'SQL UNKNOWN error'
                                    });
                                }else{
                                    res.json({
                                        success: true,
                                        code:0,
                                        message: 'Get your games',
                                        games: recordset
                                    });

                                }

                            });
                        }else{
                            res.json({
                                success: false,
                                code:3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }

            )
        }
    });
    })
    //change the game time
    .put(function(req,res){
        var email=req.email;
        sql.connect(sqlconfig,function (err) {
            if(err) {
                console.log(err);
                res.json({
                    success:false,
                    code: 1,
                    message: 'Connect failed'
                });
            }else {
                var request = new sql.Request();
                request.query('EXEC ifPlayerExist' + ' "' + email + '"', function (err, recordset) {
                        if (err) {
                            res.json({
                                success: false,
                                code:2,
                                message: 'Request to SQL failed'
                            });
                        } else {
                            var test = JSON.stringify(recordset[0]);
                            if (test.includes('1')) {
                                var loginrequest = new sql.Requset();
                                //TODO: change the PROCUDURE
                                loginrequest.query('EXEC playerLogin'+'"'+req.body.email+'",'+req.body.password,function(err,recordset){
                                    if (err){
                                        res.json({
                                            success: false,
                                            code:4,
                                            message:'SQL UNKNOWN error'
                                        });
                                    }else{
                                        res.json({
                                            success: true,
                                            code:0,
                                            message: 'Get your games',
                                            games: recordset
                                        });

                                    }

                                });
                            }else{
                                res.json({
                                    success: false,
                                    code:3,
                                    message: 'User doesnot exist'
                                });
                            }
                        }
                    }

                )
            }
        });
    })
    //buy new game
    .post(function(req,res){
        var email=req.email;
        //TODO: Change the variable
        sql.connect(sqlconfig,function (err) {
            if(err) {
                console.log(err);
                res.json({
                    success:false,
                    code: 1,
                    message: 'Connect failed'
                });
            }else {
                var request = new sql.Request();
                request.query('EXEC ifPlayerExist' + ' "' + email + '"', function (err, recordset) {
                        if (err) {
                            res.json({
                                success: false,
                                code:2,
                                message: 'Request to SQL failed'
                            });
                        } else {
                            var test = JSON.stringify(recordset[0]);
                            if (test.includes('1')) {
                                var loginrequest = new sql.Requset();
                                //TODO: change the PROCUDURE
                                loginrequest.query('EXEC playerLogin'+'"'+email+'",'+req.body.password,function(err,recordset){
                                    if (err){
                                        res.json({
                                            success: false,
                                            code:4,
                                            message:'SQL UNKNOWN error'
                                        });
                                    }else{
                                        res.json({
                                            success: true,
                                            code:0,
                                            message: 'Get your games',
                                            games: recordset
                                        });

                                    }

                                });
                            }else{
                                res.json({
                                    success: false,
                                    code:3,
                                    message: 'User doesnot exist'
                                });
                            }
                        }
                    }

                )
            }
        });

    });
//get friends list
//Array:friends
apiRouter.route('/me/friends')
    //get the friends
    .get(function(req,res){
    var email=req.email;
    sql.connect(sqlconfig,function (err) {
        if(err) {
            console.log(err);
            res.json({
                success:false,
                code: 1,
                message: 'Connect failed'
            });
        }else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code:2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Requset();
                            //TODO: change the PROCUDURE
                            loginrequest.query('EXEC playerLogin'+'"'+req.body.email+'",'+req.body.password,function(err,recordset){
                                if (err){
                                    res.json({
                                        success: false,
                                        code:4,
                                        message:'SQL UNKNOWN error'
                                    });
                                }else{
                                    res.json({
                                        success: true,
                                        code:0,
                                        message: 'Get your friends',
                                        games: recordset
                                    });

                                }

                            });
                        }else{
                            res.json({
                                success: false,
                                code:3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }

            )
        }
    });
    })
    //add new friend
    .post(function(req,res){
        var email=req.email;
        sql.connect(sqlconfig,function (err) {
            if(err) {
                console.log(err);
                res.json({
                    success:false,
                    code: 1,
                    message: 'Connect failed'
                });
            }else {
                var request = new sql.Request();
                request.query('EXEC ifPlayerExist' + ' "' + email + '"', function (err, recordset) {
                        if (err) {
                            res.json({
                                success: false,
                                code:2,
                                message: 'Request to SQL failed'
                            });
                        } else {
                            var test = JSON.stringify(recordset[0]);
                            if (test.includes('1')) {
                                var loginrequest = new sql.Requset();
                                //TODO: change the PROCUDURE
                                loginrequest.query('EXEC playerLogin'+'"'+req.body.email+'",'+req.body.password,function(err,recordset){
                                    if (err){
                                        res.json({
                                            success: false,
                                            code:4,
                                            message:'SQL UNKNOWN error'
                                        });
                                    }else{
                                        res.json({
                                            success: true,
                                            code:0,
                                            message: 'Get your friends',
                                            games: recordset
                                        });

                                    }

                                });
                            }else{
                                res.json({
                                    success: false,
                                    code:3,
                                    message: 'User doesnot exist'
                                });
                            }
                        }
                    }

                )
            }
        });
    });

//get all games
publicRouter.get('/games',function(req,res){
    sql.connect(sqlconfig,function (err) {
        if(err) {
            console.log(err);
            res.json({
                success:false,
                code: 1,
                message: 'Connect failed'
            });
        }else {
            var loginrequest = new sql.Requset();
            //TODO: change the PROCUDURE
            loginrequest.query('EXEC playerLogin'+'"'+req.body.email+'",'+req.body.password,function(err,recordset){
                if (err){
                    res.json({
                        success: false,
                        code:4,
                        message:'SQL UNKNOWN error'
                    });
                }else{
                    res.json({
                        success: true,
                        code:0,
                        message: 'Get your nickname',
                        nickname: recordset[0].nickname
                    });

                }

            });
        }
    });
});
publicRouter.get('/comments',function(req,res){
    sql.connect(sqlconfig,function (err) {
        if(err) {
            console.log(err);
            res.json({
                success:false,
                code: 1,
                message: 'Connect failed'
            });
        }else {
            var loginrequest = new sql.Requset();
            //TODO: change the PROCUDURE
            loginrequest.query('EXEC playerLogin'+'"'+req.body.email+'",'+req.body.password,function(err,recordset){
                if (err){
                    res.json({
                        success: false,
                        code:4,
                        message:'SQL UNKNOWN error'
                    });
                }else{
                    res.json({
                        success: true,
                        code:0,
                        message: 'Get your nickname',
                        nickname: recordset[0].nickname
                    });

                }

            });
        }
    });
});


app.use('/api',apiRouter);
app.use('/info',publicRouter);

app.listen(port);
console.log('Magic happens on port' + port);



