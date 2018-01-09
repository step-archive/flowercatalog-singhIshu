let fs = require('fs');
const http = require('http');
const WebApp = require('./webapp');
const updateGuestPage = require('./storeFeedBack.js').updateGuestPage;
const storeFeedBack = require('./storeFeedBack.js').storeFeedBack;
const makeFeedbackTable = require('./storeFeedBack.js').makeFeedbackTable;
let registered_users = [{userName:'bhanutv',name:'Bhanu Teja Verma'},{userName:'harshab',name:'Harsha Vardhana'}];
let toS = o=>JSON.stringify(o,null,2);

const storeComment = function(request) {
  request.on("data", function(text) {
    console.log("working");
    storeFeedBack(text.toString());
  });
}

let logRequest = (req,res)=>{
  let text = ['--------------------------',
    `${req.method} ${req.url}`,
    `HEADERS=> ${toS(req.headers)}`,
    `COOKIES=> ${toS(req.cookies)}`,
    `BODY=> ${toS(req.body)}`,''].join('\n');
  fs.appendFile('request.log',text,()=>{});
}

let loadUser = (req,res)=>{
  let sessionid = req.cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    req.user = user;
  }
};

let redirectLoggedInUserToHome = (req,res)=>{
  if(req.urlIsOneOf(['/','/login']) && req.user) res.redirect('/guestPage.html');
}
let redirectLoggedOutUserToLogin = (req,res)=>{
  if(req.urlIsOneOf(['/home','/logout']) && !req.user) res.redirect('/login');
}


let app = WebApp.create();
app.use(logRequest);
app.use(loadUser);
app.use(redirectLoggedInUserToHome);
app.use(redirectLoggedOutUserToLogin);
app.get('/',(req,res)=>{
  res.redirect('/index.html');
});

app.post('/feedback',(req,res)=>{
  storeComment(req);
  res.redirect("/guestPage.html");
});

app.get("/guestPage.html",(req,res)=>{
  let displayContents = updateGuestPage();
  console.log(displayContents);
  res.write(displayContents);
  res.end();
});

app.get('/login',(req,res)=>{
  res.setHeader('Content-type','text/html');
  res.write(`<form method="POST"> <input name="userName"><input name="place"> <input type="submit"></form>${makeFeedbackTable()}`);
  res.end();
});

app.post('/login',(req,res)=>{
  let sessionid = new Date().getTime();
  let user = req.body.userName;
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  res.redirect('/guestPage.html');
});


app.get('/logout',(req,res)=>{
  res.setHeader('Set-Cookie',[`loginFailed=false,Expires=${new Date(1).toUTCString()}`,`sessionid=0,Expires=${new Date(1).toUTCString()}`]);
  delete req.user.sessionid;
  res.redirect('/login');
});

const PORT = 5000;
let server = http.createServer(app);
server.on('error',e=>console.error('**error**',e.message));
server.listen(PORT,(e)=>console.log(`server listening at ${PORT}`));
