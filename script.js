//Canvas setup

var canvas = document.getElementById("canvas");
var canvasContext = canvas.getContext("2d");

canvas.width  = window.innerHeight - 100;
canvas.height = window.innerHeight - 100;

////Webaudio setup

var contextClass = (window.AudioContext || 
  window.webkitAudioContext || 
  window.mozAudioContext || 
  window.oAudioContext || 
  window.msAudioContext);
if (contextClass) {
  // Web Audio API is available.
  var audioContext = new contextClass();
} else {
  // Web Audio API is not available. Ask the user to use a supported browser.
  window.alert("webaudio is not available! use chrome please")
}



// Populate dropdown for selecting number of channels

var numChannels = audioContext.destination.maxChannelCount;
var select = document.getElementById("channels");

for(var i = numChannels; i >= 0; i--) {
    var option = document.createElement('option');
    option.text = option.value = i;
    select.add(option, 0);
}


function selectSpeakerNum() {
    var numSpeakers = document.getElementById("channels").value;
    console.log("speakers: ", numSpeakers);

    drawSpeakers(numSpeakers);
    audioContext.destination.channelCount = numChannels;

}


function drawSpeakers(numSpeaks) {
    var center = canvas.innerHeight / 2.0;
    var maxRadius = center - 100.0;
    var r = maxRadius;
    var h = center;
    var k = center;

    for(var i = 1; i <= numSpeaks; i++) {
        var t = i * ((2.0 * Math.PI) / numSpeaks);
        var x = (r * Math.cos(t)) + h;
        var y = (r * Math.sin(t)) + k;

        console.log("x: " + x + "; y: " + y);
        // canvasContext.fillStyle = "black";
        // canvasContext.fillRect(0, 0, window.innerHeight - 100, window.innerHeight - 100);

        canvasContext.fillStyle = "green";
        canvasContext.fillRect(x,y,10,10);

    }

    //location of points on circle given angle and radius

}


document.onmousemove = handleMouseMove;
function handleMouseMove(event, prevX, prevY) {
    // var dot, eventDoc, doc, body, pageX, pageY;
    // console.log("prev x:" + prevX + "; prev y: " + prevY);
    // canvasContext.fillStyle = "black";
    // canvasContext.fillRect(prevX, prevY,50,50);
    // canvasContext.fillStyle = "green";
    // canvasContext.fillRect(event.pageX, event.pageY,50,50);
    // prevX = event.pageX;
    // prevY = event.pageY;
}





function loadFile(file) {
    var getSound = new XMLHttpRequest();
    getSound.open("GET", file, true);
    getSound.responseType = "arraybuffer";
    getSound.onload = function() {
    audioContext.decodeAudioData(getSound.response, function(buffer){  //decodeAudioData returns an AudioBuffer object to use with AudioBufferSourceNode(same as AudioContext.createBuffer())
    audioContext.audioBuffer = buffer;
    });
    }
    getSound.send();
}

loadFile("sample.wav")

// Connect buffer to destination, and start play/loop
canvas.onclick = function playBuffer(){
    var source = audioContext.createBufferSource(); //Creates an AudioBufferSourceNode
    source.buffer = audioContext.audioBuffer; //Loads the buffer into the source node
    var merger = audioContext.createChannelMerger(2);

    source.connect(merger, 0, 1); // This assigns the source to a specific channel output on the destination
    merger.connect(audioContext.destination);

    source.loop = true;
    source.start(0);
}