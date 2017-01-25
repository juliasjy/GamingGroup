var db = require('./db');  
db.sql('select * from Login',function(err,result){  
    if (err) {  
        console.log(err);  
        return;  
    }  
    console.log('Number of LoginID',result.length);  
});  