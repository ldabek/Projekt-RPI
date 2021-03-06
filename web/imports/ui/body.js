import { Template } from 'meteor/templating';
import { Session } from 'meteor/session'

import { Data } from '../api/data.js';

import './body.html';

Session.set("showVideo", true);
Session.set("showCurrentMeasurement", false);
Session.set("showHistory", false);


var signalling_server_hostname = "192.168.1.15"; //adres urządzenia Rpi
var signalling_server_address = signalling_server_hostname + ':' + (location.port || 80);
signalling_server_address = signalling_server_hostname + ':8090';

var ws = null;
var pc;
var pcConfig = {
  "iceServers": [
    {urls: ["stun:stun.l.google.com:19302", "stun:" + signalling_server_hostname + ":3478"]}
  ]
};
var pcOptions = {
  optional: [
    {DtlsSrtpKeyAgreement: true}
  ]
};
var mediaConstraints = {
  optional: [],
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  }
};

RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
URL = window.webkitURL || window.URL;

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig, pcOptions);
    pc.onicecandidate = onIceCandidate;
    pc.onaddstream = onRemoteStreamAdded;
    pc.onremovestream = onRemoteStreamRemoved;
    console.log("peer connection successfully created!");
  } catch (e) {
    console.log("createPeerConnection() failed");
  }
}

function onIceCandidate(event) {
  if (event.candidate) {
    var candidate = {
      sdpMLineIndex: event.candidate.sdpMLineIndex,
      sdpMid: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    };
    var command = {
      command_id: "addicecandidate",
      data: JSON.stringify(candidate)
    };
    ws.send(JSON.stringify(command));
  } else {
    console.log("End of candidates.");
  }
}

function onRemoteStreamAdded(event) {
  console.log("Remote stream added:", URL.createObjectURL(event.stream));
  var remoteVideoElement = document.getElementById('stream-video');
  remoteVideoElement.src = URL.createObjectURL(event.stream);
  remoteVideoElement.play();
}

function onRemoteStreamRemoved(event) {
  var remoteVideoElement = document.getElementById('stream-video');
  remoteVideoElement.src = '';
}

function start() {
  if ("WebSocket" in window) {
    document.getElementById("stopbutton").disabled = false;
    document.getElementById("startbutton").disabled = true;
    document.documentElement.style.cursor = 'wait';
    server = signalling_server_address;

    ws = new WebSocket('wss://' + server + '/stream/webrtc');
    ws.onopen = function () {
      console.log("onopen()");
      createPeerConnection();
      var command = {
        command_id: "offer"
      };
      ws.send(JSON.stringify(command));
      console.log("onopen(), command=" + JSON.stringify(command));
    };

    ws.onmessage = function (evt) {
      var msg = JSON.parse(evt.data);
      //console.log("message=" + msg);
      console.log("type=" + msg.type);

      switch (msg.type) {
        case "offer":
          pc.setRemoteDescription(new RTCSessionDescription(msg),
            function onRemoteSdpSuccess() {
              console.log('onRemoteSdpSucces()');
              pc.createAnswer(function (sessionDescription) {
                pc.setLocalDescription(sessionDescription);
                var command = {
                  command_id: "answer",
                  data: JSON.stringify(sessionDescription)
                };
                ws.send(JSON.stringify(command));
                console.log(command);

              }, function (error) {
                alert("Failed to createAnswer: " + error);

              }, mediaConstraints);
            },
            function onRemoteSdpError(event) {
              alert('Failed to setRemoteDescription: ' + event);
            }
          );

          var command = {
            command_id: "geticecandidate"
          };
          console.log(command);
          ws.send(JSON.stringify(command));
          break;

        case "answer":
          break;

        case "message":
          alert(msg.data);
          break;

        case "geticecandidate":
          var candidates = JSON.parse(msg.data);
          for (var i = 0; i < candidates.length; i++) {
            var elt = candidates[i];
            var candidate = new RTCIceCandidate({sdpMLineIndex: elt.sdpMLineIndex, candidate: elt.candidate});
            pc.addIceCandidate(candidate,
              function () {
                console.log("IceCandidate added: " + JSON.stringify(candidate));
              },
              function (error) {
                console.log("addIceCandidate error: " + error);
              }
            );
          }
          document.documentElement.style.cursor = 'default';
          break;
      }
    };

    ws.onclose = function (evt) {
      if (pc) {
        pc.close();
        pc = null;
      }
      document.getElementById("stopbutton").disabled = true;
      document.getElementById("startbutton").disabled = false;
      document.documentElement.style.cursor = 'default';
    };

    ws.onerror = function (evt) {
      var msg = JSON.parse(evt.data);
      alert("Blad!" + msg);
      ws.close();
    };

  } else {
    alert("Twoja przegladarka nie obsluguje WebSocket oraz WebRTC.");
  }
}

function stop() {
  if (pc) {
    pc.close();
    pc = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  document.getElementById("stopbutton").disabled = true;
  document.getElementById("startbutton").disabled = false;
  document.documentElement.style.cursor = 'default';
}

window.onbeforeunload = function () {
  if (ws) {
    ws.onclose = function () {
    };
    stop();
  }
};



Template.body.helpers({
  data() {
    var modified = [];
    Data.find({}, {sort: {date: -1}, limit: 100}).forEach(function(ob){
      ob.date = moment(ob.date).format('DD-MM-YYYY hh:mm');
      modified.push(ob);
    });
    return modified;
  },
  newestData() {
    var modified = [];
    Data.find({}, {sort: {date: -1}, limit: 1}).forEach(function(ob){
      var moment_date = moment(ob.date);
      ob.date = moment_date.format('hh:mm');
      modified.push(ob);
    });
    return modified
  },
  showVideo() {
    return Session.get("showVideo")
  },
  showCurrentMeasurement() {
    return Session.get("showCurrentMeasurement")
  },
  showHistory() {
    return Session.get("showHistory")
  }


});

Template.body.events({
  'click #showVideo'(event) {
    Session.set("showVideo", true);
    Session.set("showCurrentMeasurement", false);
    Session.set("showHistory", false);
    console.log('video')
  },
  'click #showhistory'(event) {
    Session.set("showVideo", false);
    Session.set("showCurrentMeasurement", false);
    Session.set("showHistory", true);
    console.log('history')
  },
  'click #showcurrentmeasurement'(event) {
    Session.set("showVideo", false);
    Session.set("showCurrentMeasurement", true);
    Session.set("showHistory", false);
    console.log('measurement')
  },
  'click #startbutton'(event) {
    start()
  },
  'click #stopbutton'(event) {
    stop()
  }

});

Template.record.helpers({
  showVideo() {
    return Session.get("showVideo")
  },
  showCurrentMeasurement() {
    return Session.get("showCurrentMeasurement")
  },
  showHistory() {
    return Session.get("showHistory")
  }

});