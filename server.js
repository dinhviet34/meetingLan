const express = require("express");
const fs = require("fs");
const app = express();
var privateKey = fs.readFileSync('Key/privateKeyRTC.key', 'utf8');
var certificate = fs.readFileSync('Key/certificateRTC.crt', 'utf8');
var credentials = { key: privateKey, cert: certificate };
const server = require("https").Server(credentials,app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
// Peer
var listuser =[];
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, rsp) => {
  rsp.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});
app.get("/goodbye/gooo",function(req,res){
  res.render("goodbye.ejs");
});
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on('disconnect', () => {
      var username;
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
      for(var i=0;i<listuser.length;i++){
        var tachlistuser = listuser[i].split(":");
        //var removehtml = tachlistuser[1].replace( /(<([^>]+)>)/ig, '');
        var useridfromlist = tachlistuser[1].split("|");
        if(useridfromlist[0].trim() === userId.trim()){
          listuser.splice(i, 1); 
          username = useridfromlist[1].trim();
        }
      }
      socket.to(roomId).broadcast.emit("usernamedis",username);
      var userofroom = [];   
      for(var i =0;i<listuser.length;i++){
        var tachuser = listuser[i].split(":");
        if(tachuser[0] == roomId){
          userofroom.push('<div><img alt="Avtar" class="user-img" src="avatar2.png"></img>'+ tachuser[1].split("|")[1]  + '</div></br>');
        }
      } 
      io.to(roomId).emit("servergivelistuser",userofroom);
      
    })
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });
    socket.on("videoonoff",function(data){
      io.to(roomId).emit("bvideoonoff",data);
    });
    socket.on("audioonoff",function(data){
      io.to(roomId).emit("baudioonoff",data);
    });
    socket.on("username",function(data){
      var userofroom = [];     
      listuser.push(roomId+':'+ data);
      
      for(var i =0;i<listuser.length;i++){
        var tachuser = listuser[i].split(":");
        if(tachuser[0] == roomId){
          userofroom.push('<div><img alt="Avtar" class="user-img" src="avatar2.png"></img>'+ tachuser[1].split("|")[1]  + '</div></br>');
        }
      }
      io.to(roomId).emit("servergivelistuser",userofroom);
      io.to(roomId).emit("servergivename",data);
      io.to(roomId).emit("slistuser",listuser);
    });
    
  });
});

server.listen(process.env.PORT || 346,function(){
  console.log("Server Start!")
});
