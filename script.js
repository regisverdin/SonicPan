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

var speakerArray;   //speakerArray[i][0] is xpos, [i][1] is ypos, [i][2] is the node. i is the speaker/channel number

function drawSpeakers(numSpeaks, offset) {
    var center = canvas.width / 2.0;
    var maxRadius = center - 20.0;
    var r = maxRadius;
    var h = center;
    var k = center;
    var tOffset = offset; 
    var spriteSize = canvas.width / 20.0;
    var fontSize = canvas.width / 18.0;
    var fontXOffset;
    var fontYOffset = -(canvas.width / 200.0);
    speakerArray = [];

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    for(var i = 1; i <= numSpeaks; i++) {
        var t = i * ((2 * Math.PI) / numSpeaks) - tOffset;
        var x = (r * Math.cos(t)) + h;
        var y = (r * Math.sin(t)) + k;
        var speakerIndex = numSpeaks - i + 1;
        
        if (speakerIndex >= 10) { fontXOffset = -(canvas.width / 170.0);}
        else { fontXOffset = canvas.width / 160.0; }

        var speakerPosX = x-(spriteSize/2) + fontXOffset;
        var speakerPosY = y+(spriteSize/2) + fontYOffset;

        canvasContext.fillStyle = "blue";
        canvasContext.fillRect(x-(spriteSize/2),y-(spriteSize/2),spriteSize, spriteSize);
        canvasContext.fillStyle = "black";
        canvasContext.font = fontSize + "px serif";
        canvasContext.fillText(speakerIndex.toString(), speakerPosX, speakerPosY);

        speakerArray[speakerIndex-1] = [speakerPosX, speakerPosY];
    }
}

canvas.onmousemove = assignChannelVolume;

function assignChannelVolume(event) {
    //need to: take speakerArray. get current mouse pos. find eucl distance from each speaker to mouse pos. update gains for each node based on this
    var canvasRect = canvas.getBoundingClientRect();
    var mouseX = Math.floor((event.clientX-canvasRect.left)/(canvasRect.right-canvasRect.left)*canvas.width);   //mouse position rel to canvas
    var mouseY = Math.floor((event.clientY-canvasRect.top)/(canvasRect.bottom-canvasRect.top)*canvas.height);
    console.log(mouseX + ", " + mouseY);

    if(speakerArray) {
        var r = (canvas.width / 2.0) - 20;
        for (var i = 0; i < speakerArray.length; i++) {
            //get distance from current event point in canvas to current speaker in array
            var a = mouseX - speakerArray[i][0];
            var b = mouseY - speakerArray[i][1];
            var c = Math.sqrt((a*a) + (b*b));
            console.log("c = " + c);
            console.log("r = " + r);

            //gain as percentage of diameter
            var gainAmt = 1-(c/(2*r));
            console.log("gain = " + gainAmt);

            //set gain for each channel
            speakerArray[i][2].gain.value = gainAmt;
        }
    }
}


function selectSpeakerNum() {
    var numSpeakers = document.getElementById("channels").value;
    audioContext.destination.channelCount = numSpeakers;
    if(numSpeakers == 0) return;
    console.log("speakers: ", numSpeakers);

    var angleOffset = document.getElementById("slider").value;
    drawSpeakers(numSpeakers, angleOffset);

    //add or remove buffer nodes for each channel (drawSpeakers() takes care of clearing the old speakerArray). DO I NEED TO REMOVE POINTERS TO DELETED NODES?
    merger = audioContext.createChannelMerger(numSpeakers);
    merger.connect(audioContext.destination);
    for (var i = 0; i < numSpeakers; i++) {
        var source = audioContext.createBufferSource(); //Creates an AudioBufferSourceNode
        source.buffer = audioContext.audioBuffer; //Loads the buffer into the source node
        gain = audioContext.createGain();
        source.connect(gain);
        gain.connect(merger, 0, i); // This assigns the source to a specific channel output on the destination
        source.loop = true;
        source.start(0);

        speakerArray[i][2] = gain;
    }
}

function rotateSpeakers() {
    var numSpeakers = document.getElementById("channels").value;
    var angleOffset = document.getElementById("slider").value;
    drawSpeakers(numSpeakers, angleOffset);
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
var merger;
canvas.onload = function playBuffer(){
    // var source = audioContext.createBufferSource(); //Creates an AudioBufferSourceNode
    // source.buffer = audioContext.audioBuffer; //Loads the buffer into the source node
    // merger = audioContext.createChannelMerger(2);

    // source.connect(merger, 0, 1); // This assigns the source to a specific channel output on the destination
    // merger.connect(audioContext.destination);

    // source.loop = true;
    // source.start(0);
}