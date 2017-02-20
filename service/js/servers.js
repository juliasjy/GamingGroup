var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var port = process.env.PORT || 8080;
var User = require('./app/models/user');
var apiRouter = express.Router();
var publicRouter = express.Router();
var jwt = require('jsonwebtoken');
var superSecret = 'ilovescotchscotchyscotchscotch';
var sql = require('mssql');
var sqlconfig = require('config.json');
var bcrypt = require('bcrypt-nodejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X_Requested-With,content-type ,\
    Authorization');
    console.log('app.use: ');
    next();
});

app.use(morgan('dev'));

app.get('/', function (req, res) {
    res.send('Welcome to the home page!');
    console.log('GET in /');
});

//token
apiRouter.post('/authenticate', function (req, res) {
    console.log(req.body.Username);
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist' + ' "' + req.body.Username + '"', function (err, recordset) {
                    if (err) {
                        console.log(err);
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            console.log('EXEC playerLogin ' + '"' + req.body.Username + '","' + req.body.Password + '"');
                            loginrequest.query('EXEC playerLogin ' + '"' + req.body.Username + '","' + req.body.Password + '"', function (err, recordset) {
                                if (err) {
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'Login in error'
                                    });
                                } else {
                                    if (recordset[0].result == 1) {
                                        var token = jwt.sign({
                                            email: req.body.Username
                                        }, superSecret, {expiresIn: '1d'});
                                        res.json({
                                            success: true,
                                            code: 0,
                                            message: 'Enjoy your token',
                                            token: token
                                        });
                                    }
                                    else {
                                        res.json({
                                            success: false,
                                            code: 5,
                                            message: 'Password error'
                                        });
                                    }
                                }

                            });


                        } else {
                            res.json({
                                success: false,
                                code: 3,
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

apiRouter.use(function (req, res, next) {
    console.log('Somebody just came to our app!....use in apiRouter');
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {

        jwt.verify(token, superSecret, function (err, decoded) {
            if (err) {
                return res.status(403).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                req.email = decoded.email;
                console.log("decode:    " + decoded.email);
                next();
            }
        });
    } else {

        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

apiRouter.get('/', function (req, res) {
    res.json({message: 'hooray! welcome to our api!....GET in / of apiRouter'});

});

//get the nickname
//(single String) NickName
apiRouter.post('/me', function (req, res) {
    var email = req.email;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC playerNickname ' + '"' + email + '"', function (err, recordset) {
                                if (err) {
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    res.json({
                                        success: true,
                                        code: 0,
                                        message: 'Get your nickname',
                                        nickname: recordset[0].NickName
                                    });

                                }

                            });


                        } else {
                            res.json({
                                success: false,
                                code: 3,
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
//games:Array: GName,Hours,Data
//get information for the game
apiRouter.post('/me/getgames', function (req, res) {
    var email = req.email;
    console.log(email);
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        console.log(err);
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC playerGames ' + '"' + email + '"', function (err, recordset) {
                                if (err) {
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    res.json({
                                        success: true,
                                        code: 0,
                                        message: 'Get your games',
                                        games: recordset
                                    });

                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }
            )
        }
    });
});
//change the game time
//TODO
apiRouter.post('/me/updategames', function (req, res) {
    var email = req.email;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            //TODO: change the PROCUDURE
                            loginrequest.query('EXEC playerLogin ' + '"' + req.body.email + '",' + req.body.password, function (err, recordset) {
                                if (err) {
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    res.json({
                                        success: true,
                                        code: 0,
                                        message: 'Get your games',
                                        games: recordset
                                    });

                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }
            )
        }
    });
});
//buy new game
apiRouter.post('/me/buygames', function (req, res) {
    var email = req.email;
    var gamename = req.body.gname;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC buyGame ' + '"' + email + '", "' + gamename + '"', function (err, recordset) {
                                if (err) {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    res.json({
                                        success: true,
                                        code: 0,
                                        message: 'Get your games'
                                    });

                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }
            )
        }
    });

});

apiRouter.post('/me/getfriends', function (req, res) {
//get friends list
//friends:Array:friendEmail,NickName{
    var email = req.email;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC playerFriends ' + '"' + email + '"', function (err, recordset) {
                                if (err) {
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    res.json({
                                        success: true,
                                        code: 0,
                                        message: 'Get your friends',
                                        friends: recordset
                                    });

                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
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
apiRouter.post('/me/addfriends', function (req, res) {
    var email = req.email;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC makeFriend ' + '"' + req.body.email + '","' + email + '"', function (err, recordset) {
                                if (err) {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    if (recordset[0].result == 0) {
                                        res.json({
                                            success: true,
                                            code: 0,
                                            message: 'Add friends'
                                        });
                                    }
                                    else {
                                        res.json({
                                            success: false,
                                            code: 5,
                                            message: 'The user want to add doesn\'t exists'
                                        });
                                    }
                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }
            )
        }
    });
});

//get play's communities
//communities:Array:PEmail,CName,status
apiRouter.post('/me/getcommunities', function (req, res) {
    var email = req.email;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC myCommunity ' + '"' + email + '"', function (err, recordset) {
                                if (err) {
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {

                                    res.json({
                                        success: true,
                                        code: 0,
                                        message: 'Add friends',
                                        communities: recordset
                                    });

                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }
            )
        }
    });
});

apiRouter.post('/me/joincommunity', function (req, res) {
    var email = req.email;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC joinCommunity ' + '"' + email + '","' + req.body.cname + '"', function (err, recordset) {
                                if (err) {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    if (recordset[0].result == 0) {
                                        res.json({
                                            success: true,
                                            code: 0,
                                            message: 'join successfully'
                                        });
                                    }
                                    else {
                                        if (recordset[0].result == 1) {
                                            res.json({
                                                success: false,
                                                code: 5,
                                                message: 'The community doesn\'t exists'
                                            });
                                        } else {
                                            res.json({
                                                success: false,
                                                code: 5,
                                                message: 'User has already in that community'
                                            });
                                        }
                                    }
                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }
            )
        }
    });
});

apiRouter.post('/me/createcommunity', function (req, res) {
    var email = req.email;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC createCommunity ' + '"' + email + '","' + req.body.cname + '","' + req.body.theme + '"', function (err, recordset) {
                                if (err) {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    if (recordset[0].result == 0) {
                                        res.json({
                                            success: true,
                                            code: 0,
                                            message: 'create successfully'
                                        });
                                    }
                                    else {
                                        if (recordset[0].result == 1) {
                                            res.json({
                                                success: false,
                                                code: 5,
                                                message: 'The community exists'
                                            });
                                        } else {
                                            if (recordset[0].result == 2) {
                                                res.json({
                                                    success: false,
                                                    code: 5,
                                                    message: 'User has already in that community'
                                                });
                                            }
                                            else {
                                                res.json({
                                                    success: false,
                                                    code: 5,
                                                    message: 'theme doesn\'t exist'
                                                });
                                            }
                                        }
                                    }
                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }
            )
        }
    });
});
apiRouter.post('/me/communityfight', function (req, res) {
    var email = req.email;
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var request = new sql.Request();
            request.query('EXEC ifPlayerExist ' + ' "' + email + '"', function (err, recordset) {
                    if (err) {
                        res.json({
                            success: false,
                            code: 2,
                            message: 'Request to SQL failed'
                        });
                    } else {
                        var test = JSON.stringify(recordset[0]);
                        if (test.includes('1')) {
                            var loginrequest = new sql.Request();
                            loginrequest.query('EXEC communityfight ' + '"' + email + '","' + req.body.cname1 + '","' + req.body.coname2 + '"', function (err, recordset) {
                                if (err) {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        code: 4,
                                        message: 'SQL UNKNOWN error'
                                    });
                                } else {
                                    if (recordset[0].result == 0) {
                                        res.json({
                                            success: true,
                                            code: 0,
                                            message: 'start fight'
                                        });
                                    }
                                    else {
                                        if (recordset[0].result == 1) {
                                            res.json({
                                                success: false,
                                                code: 5,
                                                message: 'My community does not exist'
                                            });
                                        } else {
                                            if (recordset[0].result == 2) {
                                                res.json({
                                                    success: false,
                                                    code: 5,
                                                    message: 'Other community does not exist'
                                                });
                                            }
                                            else {
                                                res.json({
                                                    success: false,
                                                    code: 5,
                                                    message: 'Do not have rights'
                                                });
                                            }
                                        }
                                    }
                                }

                            });
                        } else {
                            res.json({
                                success: false,
                                code: 3,
                                message: 'User doesnot exist'
                            });
                        }
                    }
                }
            )
        }
    });
});

//get all games information
//games:Array: Name, GType,GPrice,UploadUser
publicRouter.get('/games', function (req, res) {
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var loginrequest = new sql.Request();
            loginrequest.query('EXEC publicGames', function (err, recordset) {
                if (err) {
                    res.json({
                        success: false,
                        code: 4,
                        message: 'SQL UNKNOWN error'
                    });
                } else {
                    res.json({
                        success: true,
                        code: 0,
                        message: 'Get your games',
                        games: recordset
                    });

                }

            });
        }
    });
});

//get game's info:
//using route as param
//games:Name, GType,GPrice,UploadUser
publicRouter.get('/comments/:game_name', function (req, res) {
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var loginrequest = new sql.Request();
            loginrequest.query('EXEC publicGames_game ' + '"' + req.params.game_name + '"', function (err, recordset) {
                if (err) {
                    res.json({
                        success: false,
                        code: 4,
                        message: 'SQL UNKNOWN error'

                    });
                } else {
                    res.json({
                        success: true,
                        code: 0,
                        message: 'Get your game\'s comments',
                        comments: recordset[0]
                    });

                }

            });
        }
    });
});
//get all comments:
//comments:Array:ID,Rate,Likes,GName
publicRouter.get('/comments', function (req, res) {
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var loginrequest = new sql.Request();
            loginrequest.query('EXEC publicComments', function (err, recordset) {
                if (err) {
                    res.json({
                        success: false,
                        code: 4,
                        message: 'SQL UNKNOWN error'

                    });
                } else {
                    res.json({
                        success: true,
                        code: 0,
                        message: 'Get your comments',
                        comments: recordset
                    });

                }

            });
        }
    });
});

//get game's comments:
//using route as param
//comments:Array:ID,Rate,Likes,GName
publicRouter.get('/comments/:game_name', function (req, res) {
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var loginrequest = new sql.Request();
            loginrequest.query('EXEC publicComments_game ' + '"' + req.params.game_name + '"', function (err, recordset) {
                if (err) {
                    res.json({
                        success: false,
                        code: 4,
                        message: 'SQL UNKNOWN error'

                    });
                } else {
                    res.json({
                        success: true,
                        code: 0,
                        message: 'Get your game\'s comments',
                        comments: recordset
                    });

                }

            });
        }
    });
});

//get all fight record
//fights:Array:FighterName,FighteeName,Date,Result
publicRouter.get('/community_fight', function (req, res) {
    sql.connect(sqlconfig, function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                code: 1,
                message: 'Connect failed'
            });
        } else {
            var loginrequest = new sql.Request();
            loginrequest.query('EXEC publicFight', function (err, recordset) {
                if (err) {
                    res.json({
                        success: false,
                        code: 4,
                        message: 'SQL UNKNOWN error'

                    });
                } else {
                    res.json({
                        success: true,
                        code: 0,
                        message: 'Get your game\'s comments',
                        fights: recordset
                    });

                }

            });
        }
    });
});

app.use('/api', apiRouter);
app.use('/info', publicRouter);

app.listen(port);
console.log('Magic happens on port' + port);



