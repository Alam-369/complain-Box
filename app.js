const express = require('express');
const session = require('express-session')
var mongo = require('mongodb');
var assert = require('assert');
var bodyParser = require('body-parser');
const { debugPort } = require('process');
const { render } = require('ejs');
const { json } = require('body-parser');
const { captureRejectionSymbol } = require('events');
const path = require('path');

const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');


var url = 'mongodb://localhost:27017/complainbox';
var mongoURI = 'mongodb://localhost:27017/picture';

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
app.use(methodOverride('_method'));
app.use(session({

   
        secret : 'yourSecret',
        resave : false,
        saveUninitialized : false,
    
}))
app.set('view engine', 'ejs')

app.use((req, res, next) => {
    
    next();
 
})

const conn = mongoose.createConnection(mongoURI);


// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});
// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          //const filename = buf.toString('hex') + path.extname(file.originalname);
          const filename = session.Studentemail;
          const fileInfo = {
           
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });
  // @route GET /
// @desc Loads form
app.get('/pic', (req, res) => {
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        res.render('index', { files: false });
      } else {
        files.map(file => {
          if (
            file.contentType === 'image/jpeg' ||
            file.contentType === 'image/png'
          ) {
            file.isImage = true;
          } else {
            file.isImage = false;
          }
        });
        session.currentStudent=req.params.id
        res.render('index', { files: files});
      } 
    });
  });

  // @route POST /upload
// @desc  Uploads file to DB
app.post('/pic/upload', upload.single('file'), (req, res) => {
   // res.json({ file: req.file });
    res.redirect('/');
  });
  
  // @route GET /files
  // @desc  Display all files in JSON
  app.get('/pic/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: 'No files exist'
        });
      }
  
      // Files exist
      return res.json(files);
    });
  });


  app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
      // File exists
      return res.json(file);
    });
  });
  
  // @route GET /image/:filename
  // @desc Display Image
  app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'

        });
      }
  
      // Check if image
      if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
        // Read output to browser
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        res.status(404).json({
          err: 'Not an image'
        });
      }
    });
  });
  app.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
  
      res.redirect('/pic');
    });
  });
  

///////////////////////////////////////////////////


const redirectStudentlogin = (req, res, next) => {
    console.log(session);
    if (!session.studentId) {
        res.redirect('/login');
    } else {
        //res.redirect('/profile');
       return next();
    }
}
const redirectAdminlogin = (req, res, next) => {
    console.log(session);
    if (!session.adminId) {
        res.redirect('/login');
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
   

    var user, type;
    if(!session.adminId)user = session.adminId, type = "admin";
    else if(!session.studentId)user = session.studentname, type = "student";
    else user = "";
    console.log(user+"hahah");
    mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then(async(client) => {
     var db = client.db('complainbox');
            var [result,like] = await Promise.all([
                db.collection('complains').find({}).toArray(),
                db.collection('like').find({}).toArray(),
            ]);    
                 
               
           
               
                var text="";
                for (var i = result.length-1; i>=0; i--) {
                
                 text += "<div class=\"align_side\" ><img class=\"circular--square\" width=\"60\" height=\"50\" src=\"/image/sust.jpg\" alt=\"\">";
                 text += " &ensp;<h1>" + result[i].complaintopic + "</h1></div>";
                 text+="<h6 class =\"text_size_h4\">Date: "+result[i].date+" &ensp;"; 
                 text+="       Time: "+result[i].time+"</h6>";
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
                if(result[i].count!="0")text+=" &ensp;<a>"+result[i].count+" People like this!</a>";
                
                text+="<hr>"
                
                //client.close();
                
            }
         res.render('home', {text: text, admin: session.adminId, student: session.studentname});
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


app.get('/login',(req,res)=>{
  console.log(session);
    if(session.adminId!=null){
        res.redirect('/addstudent');
    }
    else if(session.Studentemail!=null){
        res.redirect('/profile');
    }
    else {
         
        res.render('login',{admin: session.adminId, student: session.studentname});
    }
})

app.post('/login',(req,res)=>{
     var user = req.body.user;
     console.log(user);
     if(user=="admin"){

      var email = req.body.username;
      var password = req.body.Password;
      mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then((client) => {
        var db = client.db('complainbox');
        
                db.collection('admin').findOne({"Email":req.body.username},(err,result)=>{
                  try{ assert.equal(null,err);
                   assert.equal(req.body.username,result.Email);
                   
                   assert.equal(req.body.Password,result.Password);
                   
                   console.log("found!!!!"+ result._id);
                   session.adminId=result._id;
                   
                   session.currentStudent=null;
                   
                   
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
                      res.redirect('/login');
                  }
                   
               })
           

            
           console.log('DB Connecmted!')
        }).catch(err => {
            
            
          console.log(err);

        });

     }else{

      mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then((client) => {
        var db = client.db('complainbox');
               db.collection('student').findOne({"registration":req.body.username},(err,result)=>{
                   try{
                   assert.equal(null,err);
                   assert.equal(req.body.username,result.registration);
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
                    res.redirect('/login');
                    client.close();
                   }
                   
               });
           console.log('DB Connected!')
        }).catch(err => {
            console.log(err);
        });

     }
})


// app.get('/admin',(req,res)=>{
//     console.log(session);
//     if(session.adminId!=null){
//         res.redirect('/addstudent');
//     }
//     else {
//         res.render('admin',{admin: session.adminId, student: session.studentname});
//     }
// })
// app.post('/admin',(req,res)=>{
//     var email = req.body.Email;
//     var password = req.body.Password;
    

//     mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then((client) => {
//         var db = client.db('complainbox');
        
//                 db.collection('admin').findOne({"Email":req.body.Email},(err,result)=>{
//                   try{ assert.equal(null,err);
//                    assert.equal(req.body.Email,result.Email);
                   
//                    assert.equal(req.body.Password,result.Password);
                   
//                    console.log("found!!!!"+ result._id);
//                    session.adminId=result._id;
                   
                   
//                    res.redirect('/addstudent');
//                    client.close();
//                   }
//                   catch(e){
//                     session.studentId=null;
//                     session.studentname = null;
//                     session.registration=null;
//                     session.Studentemail=null;
//                     session.adminId=null;
//                       console.log(e);
//                       res.redirect('/admin');
//                   }
                   
//                })
           

            
//            console.log('DB Connecmted!')
//         }).catch(err => {
            
            
//           console.log(err);

//         });
    
   
// })
app.get('/studentlist/:id',redirectAdminlogin,(req,res)=>{

})

app.get('/studentlist',redirectAdminlogin,async(req,res)=>{


    mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then(async(client) => {
        var db = client.db('complainbox');
               var [student] = await Promise.all([
                   db.collection('student').find({}).toArray()
               ]);    
                    
               console.log(student);
                  
              
                  
            

          res.render('studentList', { students: student,admin: session.adminId, student: session.studentname});
           console.log('DB Connected!')
        }).catch(err => {
            console.log(err);
        });

})


app.get('/profile',redirectStudentlogin,async(req,res)=>{

  mongo.connect('mongodb://localhost',{useUnifiedTopology: true}).then(async(client) => {
    var db = client.db('complainbox');
           var [result,like] = await Promise.all([
               db.collection('complains').find({"complainerId":session.studentId}).toArray(),
               db.collection('like').find({}).toArray(),
           ]);    
                
              
          
              
               var text="";
               for (var i = result.length-1; i>=0; i--) {
                 console.log("1 "+result[i].voterId);
               
                text += "<div class=\"align_side backG1\" ><img class=\"circular--square\" width=\"60\" height=\"50\" src=\"/image/sust1.jpg\" alt=\"\">";
                text += " &ensp;<h1>" + result[i].complaintopic + "</h1></div>";
                text+="<h6 class =\"text_size_h4\">Date: "+result[i].date+" &ensp;"; 
                text+="       Time: "+result[i].time+"</h6>";
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
               if(result[i].count!="0")text+=" &ensp;<a>"+result[i].count+" People like this!</a>";
               
               text+="<hr>"
               
               //client.close();
               
           }
           console.log(text+"hdsikj");
           gfs.files.findOne({ filename: session.Studentemail }, (err, file) => {

            res.render('profile',{
              text: text,
           files: file,
           name: session.studentname,
           email: session.Studentemail,
           registration: session.registration,
           admin: session.adminId,
            student: session.studentname
          });
           
         });
        //res.render('home', {text: text, admin: session.adminId, student: session.studentname});
       console.log('DB Connected!')
    }).catch(err => {
        console.log(err);
    });
    //res.redirect('/addcomplain'); 

    // gfs.files.findOne({ filename: session.Studentemail }, (err, file) => {

    //      res.render('profile',{
    //     files: file,
    //     name: session.studentname,
    //     email: session.Studentemail,
    //     registration: session.registration,
    //     admin: session.adminId,
    //      student: session.studentname
    // });
        
    //   });
    
})

// app.get('/profile',redirectStudentlogin,(req,res)=>{
   
//     res.render('profile',{
        
//         name: session.studentname,
//         email: session.Studentemail,
//         registration: session.registration
//     });
// })





app.get('/addcomplain',(req,res)=>{
    res.render('complain',{admin: session.adminId, student: session.studentname});
})
app.get('/addstudent',(req,res)=>{
    res.render('addstudent',{admin: session.adminId, student: session.studentname});
})
app.get('/studentlogin',(req,res)=>{
    console.log(session);
    if(session.studentId!=null){
        res.redirect('/profile');
    }
    else {
    
    res.render('studentlogin',{admin: session.adminId, student: session.studentname});
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
       complainerId: session.studentId,
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
    res.render('changepassword',{admin: session.adminId, student: session.studentname});
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

app.listen(3000)