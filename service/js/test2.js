var express=require('express');
var app=express();
app.get('/',function(req,res){
 var sql=require('mssql');
 
//config for your database
 var config={
    user:'wuy8',
    password:'wyl1995',
	server: 'titan.csse.rose-hulman.edu',   
	database: 'NWindwuy81710',  
 };
 
//connect to your database
 sql.connect(config,function (err) {
   if(err) console.log(err);
 
//create Request object
   var request=new sql.Request();
request.query('select * from fff',function(err,recordset){
   if(err) console.log(err);
 
//send records as a response
   res.send(recordset);
   });
 });
 
});
 
var server=app.listen(5050,function(){
 console.log('Server is running!');
});