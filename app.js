const express = require('express');
const session = require('express-session')
var mongo = require('mongodb');
var assert = require('assert');
var bodyParser = require('body-parser');
const { debugPort } = require('process');
const { render } = require('ejs');
const { json } = require('body-parser');
const { captureRejectionSymbol } = require('events');
const { parse } = require('path');

var url = 'mongodb://localhost:27017/complainbox';

const TWO_HOUR = 1000 * 60 * 60 * 2;
const {
    PORT = 3000,
    NODE_ENV = 'development',
    SESS_NAME = 'katha',
    SESS_SECRET = 'SECRET!!!!!!!',
    SESS_LIFETIME = TWO_HOUR



} = process.env
const IN_PROD = NODE_ENV === 'production'

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({

   
        secret : 'yourSecret',
        resave : false,
        saveUninitialized : false,
    
}))
app.set('view engine', 'ejs')

app.use((req, res, next) => {
    
    next();
 
})


const redirectStudentlogin = (req, res, next) => {
    console.log(session);
    if (!session.studentId) {
        res.redirect('/studentlogin');
    } else {
        //res.redirect('/profile');
       return next();
    }
}


function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}



function setDate()
{
     var date = new Date();

    var DD = date.getFullYear() + "-" + (date.getMonth()<10?'0':'') + (date.getMonth() + 1) + "-" + (date.getDate()<10?'0':'') + date.getDate();
    return DD;
}
function setTime(){
    var date = new Date();
    var time = (date.getHours()<10?'0':'') + date.getHours()  + ":" + (date.getMinutes()<10?'0':'') + date.getMinutes()+":" + (date.getSeconds()<10?'0':'') + date.getSeconds();
    return time;
}

app.get('/',async(req,res)=>{
   


    mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then(async(client) => {
     var db = client.db('complainbox');
            var [result,like] = await Promise.all([
                db.collection('complains').find({}).toArray(),
                db.collection('like').find({}).toArray(),
            ]);    
                 
               
           
               
                var text="";
                for (var i = result.length-1; i>=0; i--) {
                 
                 text += "<h1>" + result[i].complaintopic + "</h1>";
                 text+="<p>Date: "+result[i].date+"  "; 
                 text+="Time: "+result[i].time+"</p>";
                 text+="<br>";
                 text += "<p>:" +result[i].discription+"</p>";
                 
                 
                 // text+=" <a href=\"#\"><span class=\"glyphicon glyphicon-thumbs-up\"></span></a>"
                
                 // text+="<div class=\"form-check-inline\"><label class=\"form-check-label\"\><input type=\"radio\" class=\"form-check-input\" name=\"optradio\" disabled>Agree</label><input type=\"radio\" class=\"form-check-input\" name=\"optradio\" disabled>Disagree</label></div>";
     
              
                if(session.studentId!=null && like!=null){
                    
                 
                     var check = true;
                     for(var j=0; j<like.length; j++){
                        // console.log(like[j].voterId);
                         // console.log(session.studentId+"jjjj");
                         // console.log(like[j].complaconsole.log(session.studentId+"jjjj");
                         // console.log(like[j].complainId+"JJJ"+result[i].key)inId+"JJJ"+result[i].key)
                          if(like[j].voterId===session.studentId && like[j].complainId===result[i].key){
                     
                          text+="<button class=\"btn1\" href=\"/like\"><i class=\"fa fa-thumbs-up\">Liked</i> </button>";
                          //text += "<hr>";
                 
                          check = false;
                          break;
                          }
                   
                       }
                       console.log(i+ "   " +check)
                     if(check){
                         text+=" <a class=\"btn\" href=\"/like/"+ result[i].key +"/\"><i class=\"fa fa-thumbs-up\">Like</i> </a>";
                         //text += "<hr>";
                     }
                }
                else{
                 text+=" <a class=\"btn\" href=\"/like/"+ result[i].key +"/\"><i class=\"fa fa-thumbs-up\">Like</i> </a>";
                 //text += "<hr>";
                }
             
                console.log('render dashboard');
                if(result[i].count!="0")text+="<a>"+result[i].count+" People like this!</a>";
                
                text+="<hr>"
                
                //client.close();
                
            }
            res.render('home', { text: text});
        console.log('DB Connected!')
     }).catch(err => {
         console.log(err);
     });
     //res.redirect('/addcomplain'); 
 
 
   
 });

 app.get('/like/:id',async(req,res)=>{
    if(!session.studentId){
        res.redirect('/studentlogin');
    }
    else{
        var like = { 
            voterId: session.studentId,
            complainId: req.params.id
        }

        mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then(async(client) => {
            var db = client.db('complainbox');
            var [result] = await Promise.all([
                db.collection('complains').findOne({key:req.params.id})
                //db.collection('like').find({}).toArray(),
            ]);    
                   var c = parseInt(result.count);

                   c++;
                   db.collection('complains').update({_id:result._id},{ $set: { count:c.toString()}});
                   db.collection('like').insertOne(like,(err,result)=>{
                       assert.equal(null,err);
                       console.log("inserted!!!!");
                       res.redirect('/');
                       client.close();
                       
                   }); 
               console.log('DB Connected!')
            }).catch(err => {
                console.log(err);
            });
    }
})


app.get('/admin',(req,res)=>{
    console.log(session);
    if(session.adminId!=null){
        res.redirect('/addstudent');
    }
    else {
        res.render('admin');
    }
})
app.post('/admin',(req,res)=>{
    var email = req.body.Email;
    var password = req.body.Password;
    

    mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then((client) => {
        var db = client.db('complainbox');
        
                db.collection('admin').findOne({"Email":req.body.Email},(err,result)=>{
                  try{ assert.equal(null,err);
                   assert.equal(req.body.Email,result.Email);
                   
                   assert.equal(req.body.Password,result.Password);
                   
                   console.log("found!!!!"+ result._id);
                   session.adminId=result._id;
                   
                   
                   res.redirect('/addstudent');
                   client.close();
                  }
                  catch(e){
                    session.studentId=null;
                    session.studentname = null;
                    session.registration=null;
                    session.Studentemail=null;
                    session.adminId=null;
                      console.log(e);
                      res.redirect('/admin');
                  }
                   
               })
           

            
           console.log('DB Connecmted!')
        }).catch(err => {
            
            
          console.log(err);

        });
    
   
})

app.post('/login',(req,res)=>{

})

app.get('/profile',redirectStudentlogin,(req,res)=>{
    console.log(req.session.name);
    res.render('profile',{
        name: session.studentname,
        email: session.Studentemail,
        registration: session.registration
    });
})

app.get('/addcomplain',(req,res)=>{
    res.render('complain');
})
app.get('/addstudent',(req,res)=>{
    res.render('addstudent');
})
app.get('/studentlogin',(req,res)=>{
    console.log(session);
    if(session.studentId!=null){
        res.redirect('/profile');
    }
    else {
    
    res.render('studentlogin');
    }
})
app.post('/studentlogin',(req,res)=>{
    var student = {
        
    }
  
   
    mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then((client) => {
    var db = client.db('complainbox');
           db.collection('student').findOne({"registration":req.body.regnumber},(err,result)=>{
               try{
               assert.equal(null,err);
               assert.equal(req.body.regnumber,result.registration);
               assert.equal(req.body.Password,result.password);
               console.log("found!!!!"+ result.password); 
               session.studentId=result.key;
               session.studentname = result.name;
               session.registration=result.registration; 
               session.Studentemail=result.email;
               
               res.redirect('/profile');
               client.close();
               }catch(e){
                session.studentId=null;
                session.studentname = null;
                session.registration= null; 
                session.Studentemail= null;
                res.redirect('/studentlogin');
                client.close();
               }
               
           });
       console.log('DB Connected!')
    }).catch(err => {
        console.log(err);
    });
    //res.redirect('/addcomplain');
   
})

app.post('/addcomplain',(req,res)=>{
  var date = setDate();
  var time = setTime();
   var complain = {
       complaintopic: req.body.name,
       date: date,
       time: time,
       count:"0",
       compare: date+"::"+time,
       discription: req.body.comment,
       key : makeid(20)
   }
   var date = new Date();
   console.log(setDate());
   console.log(setTime());
//    var kkk = req.body.comment;
//    console.log(req.body.name);
//    console.log(kkk);
   mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then((client) => {
    var db = client.db('complainbox');
           db.collection('complains').insertOne(complain,(err,result)=>{
               assert.equal(null,err);
               console.log("inserted!!!!");
               client.close();
           });
       console.log('DB Connected!')
    }).catch(err => {
        console.log(err);
    });
    res.redirect('/addcomplain');
})

app.post('/addstudent',(req,res)=>{
    var student = {
        name: req.body.studentname,
        registration: req.body.registration,
        email: req.body.email,
        department: req.body.dept, 
        session: req.body.session,
        password:req.body.registration,
        key:makeid(20)
    }
    console.log(student);
    mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then((client) => {
        var db = client.db('complainbox');
               db.collection('student').insertOne(student,(err,result)=>{
                   assert.equal(null,err);
                   console.log("inserted!!!!");
                   client.close();
               });
           console.log('DB Connected!')
        }).catch(err => {
            console.log(err);
        });
        res.redirect('/addstudent');
})
app.get('/changepassword',(req,res)=>{
    if(session.studentId==null){
        res.redirect('/studentlogin');
    }
    res.render('changepassword');
});

app.post('/changepassword',async(req,res)=>{
    mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then(async(client) => {
    var db = client.db('complainbox');
           var [result ]= await Promise.all([
               db.collection('student').findOne({"registration":session.registration})
               
           ]);
            assert(result.password,req.body.oldpassword);
            db.collection('student').updateOne({_id:result._id},{ $set: { Password:req.body.newpassword}});

    }).catch(err => {
        console.log(err);
    });
    res.redirect('/profile');


});

app.get('/logout', function (req, res) {
    session.studentId=null;
    session.studentname = null;
    session.registration=null;
    session.Studentemail=null;
    session.adminId=null;
    // req.session.destroy(function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     else {
    //         res.redirect('/');
    //     }
    // });
    res.redirect('/');

});

app.listen(3001)