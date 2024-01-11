const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const myvideoDiv = document.createElement("div");
const mynameDiv = document.createElement("div");
myVideo.muted = true;
const peers = {}
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "localhost",
  port: "346",
});

let myVideoStream;

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
$(document).ready(function () {
  hidechatbox();
  $(document).on('keypress', function (e) {
  
    if (e.which == 13 && $("#chat_message").val() != "") {
      socket.emit("message",$("#myname").text()+": "+ $("#chat_message").val());
      
      
      $("#chat_message").val("");
     
    }

  });
  $('#leave-meeting').click(function () {
    window.location.href = '/goodbye/gooo';
  });
  //$("#chatbox").hide();
  $("#myModal").modal('show');
  $("#signin").click(function () {
    if ($("#fullname").val() == "") {
      alert("Nhap ho va ten de vao cuoc hop");
    }
    else {
      $("#myModal").modal('hide');
      $("#myname").text($("#fullname").val());
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((stream) => {
          myVideoStream = stream;
          addVideoStream(myVideo, stream,myvideoDiv,mynameDiv);
          myVideo.setAttribute("id",$("#peerid").text());
          myvideoDiv.setAttribute("class","videobg");
          mynameDiv.setAttribute("class","namediv");
          mynameDiv.setAttribute("id","div" + $("#peerid").text())
          peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");
            const videoDiv = document.createElement("div");
            const nameDiv = document.createElement("div");
            call.on("stream", (userVideoStream) => {
              addVideoStream(video, userVideoStream,videoDiv,nameDiv);
              video.setAttribute("id",$("#peerid").text());
              videoDiv.setAttribute("class","videobg");
              nameDiv.setAttribute("class","namediv");
              nameDiv.setAttribute("id","div" +  $("#peerid").text());
            });
          });
          socket.emit("username", $("#peerid").text() + "|" + $("#fullname").val())
          socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);

          });
          socket.on('servergivename',function(data){
            var tachdata = data.split("|");
            toastshow(tachdata[1] + " đã vào cuộc họp")
           
            

          });
          socket.on("slistuser",function(data){
            console.log(data);
            for(var i=0;i< data.length;i++){
              console.log(data[i]);
              var tachdata1 = data[i].split(":");
              var tachdata = tachdata1[1].split("|");
              console.log(tachdata[0])
              //var classs = document.getElementById("div"+tachdata[0]);
              console.log(tachdata[1]);
              //classs.innerHTML = "dmm";
              console.log("div" + tachdata[0])
              $("#div"+tachdata[0]).text(tachdata[1]);
              
            }
          });
          socket.on('user-disconnected', userId => {
            if (peers[userId]) peers[userId].close()
          });
          socket.on('usernamedis',function(data){
            toastshow(data + " đã thoát khỏi cuộc họp")
          
          });
          socket.on("servergivelistuser", function (data) {
 
            $('#items').remove()
            $('#listid').append('<div id="items"></div>')
            $('#items').append(data)

           
          });
         
          socket.on("bvideoonoff",function(data){
            var datatach = data.split("|");
            var myVideo = document.getElementById(datatach[0]);
            if(datatach[1] == "off"){
              //alert(datatach[0])
              //myVideo.getAudioTracks()[0].enabled = false;
              myVideo.pause();
              myVideo.style.display = "none";
              toastshow(datatach[2] + " đã tắt camera")
             
            }
            else{
              //myVideo.getAudioTracks()[0].enabled = true;
              myVideo.play();
              myVideo.style.display = "block";
              toastshow(datatach[2] + " đã bật camera")
             
            }
          });
          socket.on("baudioonoff",function(data){
            var datatach = data.split("|");
            var myVideo = document.getElementById(datatach[0]);
            if(datatach[1] == "off"){
              //alert(datatach[0])
              //myVideo.getAudioTracks()[0].enabled = false;
              myVideo.muted = true;
              //myVideo.style.display = "none";
              toastshow(datatach[2] + " đã tắt mic")
            
            }
            else{
              //myVideo.getAudioTracks()[0].enabled = true;
              myVideo.muted =false;
              //myVideo.style.display = "block";
              toastshow(datatach[2] + " đã bật mic")
            
            }
          });


        

          socket.on("createMessage", (msg) => {
            //console.log(msg);
            var tachmsg = msg.split(":");
            if (tachmsg[0] == $("#myname").text()) {
              $("#all_messages").append('<li class="in"><div class="chat-img"><img alt="Avtar" src="avatar1.png"></div><div class="chat-body"><div class="chat-message">Tôi: ' + tachmsg[1] + '</div></div></li>')
            }
            else {
              $("#all_messages").append('<li class="out"><div class="chat-img"><img alt="Avtar" src="avatar2.png"></div><div class="chat-body"><div class="chat-message">' + msg + '</div></div></li>')
            }
            $("#all_messages").scrollTop = $("#all_messages").scrollHeight;
            if($("#chatbox").is(":hidden") ==true){
              toastshow(msg);
            }
          



          });
        });
    }
  });
});
//document.addEventListener("contextmenu", function(e){
// e.preventDefault();
//}, false);

peer.on("call", function (call) {
  console.log(call)
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      //console.log(stream)  
      const video = document.createElement("video");
      const videoDiv = document.createElement("div");
      const nameDiv = document.createElement("div");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream,videoDiv,nameDiv);
        video.setAttribute("id",call.peer);
        videoDiv.setAttribute("class","videobg");
        nameDiv.setAttribute("class","namediv");
        nameDiv.setAttribute("id","div" + call.peer);
      });

    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  $("#peerid").text(id);
});

// CHAT

const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  console.log(call);
  var video = document.createElement("video");
  var videoDiv = document.createElement("div");
  var nameDiv = document.createElement("div");
  call.on("stream", (userVideoStream) => {
    //console.log(userVideoStream);
    addVideoStream(video, userVideoStream,videoDiv,nameDiv);
    video.setAttribute("id",userId);
    videoDiv.setAttribute("class","videobg");
    nameDiv.setAttribute("class","namediv");
    nameDiv.setAttribute("id","div" + userId);
  });
  call.on('close', () => {
    video.remove();
    videoDiv.remove();
  });
  

  peers[userId] = call
};

const addVideoStream = (videoEl, stream,videoDiv,nameDiv) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });
  videoDiv.append(videoEl);
  videoDiv.append(nameDiv);
  videoGrid.append(videoDiv); 
  
  
  //let totalUsers = document.getElementsByTagName("video").length;
  //if (totalUsers > 1) {
    
    //for (let index = 0; index < totalUsers; index++) {
    
        //document.getElementsByTagName("video")[index].style.width = 100 / totalUsers + "%";
       // document.getElementsByClassName("videobg")[index].style.width = document.getElementsByTagName("video")[index].offsetHeight + 20 + "px";
      
     
    //}
  //}
};

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
    socket.emit("videoonoff",$("#peerid").text()+"|off|"+ $("#myname").text());
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
    socket.emit("videoonoff",$("#peerid").text()+"|on|"+ $("#myname").text());
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
    socket.emit("audioonoff",$("#peerid").text()+"|off|"+ $("#myname").text());
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
    socket.emit("audioonoff",$("#peerid").text()+"|on|"+ $("#myname").text());
  }
};

const setPlayVideo = () => {
  const html = `<span class="unmute"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-off-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l6.69 9.365zm-10.114-9A2.001 2.001 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728L.847 3.366zm9.746 11.925-10-14 .814-.58 10 14-.814.58z"/>
</svg>
  Bật hình ảnh</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<span class=""><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/>
</svg>
  Tắt hình ảnh</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<span class="unmute"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16">
  <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z"/>
  <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
</svg>
  Bật âm thanh</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16">
  <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/>
  <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
</svg>
  Tắt âm thanh</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
function hidechatbox(){
  $("#chatbox").hide();
  $('#chatonoff').text('Mở chat');
  $("#chatbox").css('flex', '0');
  $('.main__left').css('flex','1');
}
function showchatbox(){
  $("#chatbox").show();
  $('#chatonoff').text('Tắt chat');
  $("#chatbox").css('flex', '0.2');
  $('.main__left').css('flex','0.8');
}
function chatonoff1(){
  if($("#chatbox").is(":hidden") ==true){
    showchatbox();
  }
  else{
    hidechatbox();
  }
}
function toastshow(noidung){
  $(".toast").toast({ delay: 3000 });
  $('.toast').toast('show');
  
  $(".toast-body").text(noidung);
}

function getlink(){
  
  var copyText = $(location).attr('href');

  /* Select the text field */
  
   /* Copy the text inside the text field */
  navigator.clipboard.writeText(copyText);

  /* Alert the copied text */
  toastshow("Đã copy RoomID vào Clipboard: " + copyText);
}