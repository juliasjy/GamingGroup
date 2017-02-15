#如果需要运行server, 需要在node_modules新建config.json  
格式如下:  
{	
	"user":"用户名",
	"password":"mssql的密码",
	"server": "titan.csse.rose-hulman.edu",   
	"database": "GamingGroup"
}   
---
Node_model:  
  server side libraries  
  //Added
  
Policies(optional):  
  .js  
  for example: cast the username to lower_case  

Public(static):  
  Images, Styles(css),Javascripte  
  添加了db.js 连接到mssql, 需要修改user password, 地址和database名字
  
Routes:  
  request handler(nodejs)  
    
###Service(optional):  
  post to port 8080 with username to check exist or not in db

Views:  
  put the html files  

