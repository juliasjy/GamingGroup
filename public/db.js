var mssql = require('mssql');  
var db = {};  
var config = {  
  user: '**',  
  password: '**',  
  server: 'titan.csse.rose-hulman.edu',   
  database: '**',  
  port:1433,  
  options: {  
    encrypt: true // Use this if you're on Windows Azure  
  },  
  pool: {  
    min: 0,  
    max: 10,  
    idleTimeoutMillis: 3000  
  }  
};  
  
//ִ��sql,��������.  
db.sql = function (sql, callBack) {  
  var connection = new mssql.Connection(config, function (err) {  
    if (err) {  
      console.log(err);  
      return;  
    }  
    var ps = new mssql.PreparedStatement(connection);  
    ps.prepare(sql, function (err) {  
      if (err){  
        console.log(err);  
        return;  
      }  
      ps.execute('', function (err, result) {  
        if (err){  
          console.log(err);  
          return;  
        }  
  
        ps.unprepare(function (err) {  
          if (err){  
            console.log(err);  
            callback(err,null);  
            return;  
          }  
            callBack(err, result);  
        });  
      });  
    });  
  });  
};  
  
module.exports = db;  