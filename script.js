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

function selectSpeakerNum() {
    var numSpeakers = document.getElementById("channels").value;
    audioContext.destination.channelCount = numSpeakers;
    if(numSpeakers == 0) {
        for (var i = 0; i < speakerArray.length; i++) {
            speakerArray[i][2].gain.value = 0;
        }

        return;
    }
    console.log("speakers: ", numSpeakers);

    var angleOffset = document.getElementById("slider").value;
    if(typeof speakerArray == 'undefined') speakerArray = [];
    else speakerArray.splice(0,speakerArray.length);   //clear the array without making a new one (which would mess up references)

    drawSpeakers(numSpeakers, angleOffset);

    //Add DOM elements for sample selection (dropdown menu with id="thisSpeakerNumber", and delay inputs in ms. (need to add sampleSelect function later). 
    var spanNode = document.getElementById("sampleMenu");

    for (var i = 1; i <= numSpeakers; i++) {
        var newSelect = document.createElement("select");
        newSelect.setAttribute("id", "speaker" + i);

        var newLabel = document.createElement("label");
        newLabel.innerHTML = i + " :";
        // newElement.setAttribute("id", i);
        spanNode.appendChild(newLabel);
        spanNode.appendChild(newSelect);

        // for(var i = numSpeakers; i >= 0; i--) {
        //     var option = document.createElement('option');
        //     option.text = option.value = i;
        //     newLabel.add(option, 0);
        // }
    }
    //Add delay nodes



    //MOVE STUFF BELOW HERE TO SAMPLESELECT FUNCTION

    //Add or remove buffer nodes for each channel (drawSpeakers() takes care of clearing the old speakerArray?). DO I NEED TO REMOVE POINTERS TO DELETED NODES?
    merger = audioContext.createChannelMerger(numSpeakers);
    merger.connect(audioContext.destination);
    for (var i = 0; i < numSpeakers; i++) {
        var source = audioContext.createBufferSource(); //Creates an AudioBufferSourceNode
        source.buffer = audioContext.audioBuffer; //Loads the buffer into the source node
        gain = audioContext.createGain();
        source.connect(gain);
        gain.connect(merger, 0, i); // Assigns the source to a specific channel input on the destination
        source.loop = true;
        source.start(0);

        speakerArray[i][2] = gain;
            //Add dom elements for selecting sample for each speaker.
        // addSampleMenu(speakerNum);
    }
}

function rotateSpeakers() {
    var numSpeakers = document.getElementById("channels").value;
    var angleOffset = document.getElementById("slider").value * -1; //flipping sign here b/c can't do in html tag
    drawSpeakers(numSpeakers, angleOffset);

}



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

        canvasContext.fillStyle = "#5a5c51";
        canvasContext.fillRect(x-(spriteSize/2),y-(spriteSize/2),spriteSize, spriteSize);

        canvasContext.fillStyle = "#bcd5d1";
        canvasContext.font = fontSize + "px serif";
        canvasContext.fillText(speakerIndex.toString(), speakerPosX, speakerPosY);

        if (typeof speakerArray[speakerIndex-1] == 'undefined') speakerArray[speakerIndex-1] = [speakerPosX, speakerPosY];
        else {
            speakerArray[speakerIndex-1][0] = speakerPosX;
            speakerArray[speakerIndex-1][1] = speakerPosY;
        }
    }
}



canvas.onmousemove = function assignChannelVolume(event) {
    //need to: take speakerArray. get current mouse pos. find eucl distance from each speaker to mouse pos. update gains for each node based on this
    var canvasRect = canvas.getBoundingClientRect();
    var mouseX = Math.floor((event.clientX-canvasRect.left)/(canvasRect.right-canvasRect.left)*canvas.width);   //mouse position rel to canvas
    var mouseY = Math.floor((event.clientY-canvasRect.top)/(canvasRect.bottom-canvasRect.top)*canvas.height);
    var center = canvas.width/2;

    if(typeof speakerArray != 'undefined') {
        var r = (canvas.width / 2.0) - 20;
        for (var i = 0; i < speakerArray.length; i++) {
            //get distance from current event point in canvas to current speaker in array
            var a = mouseX - speakerArray[i][0];
            var b = mouseY - speakerArray[i][1];
            var c = Math.sqrt((a*a) + (b*b));   //distance from mouse to speaker
            console.log("c = " + c);
            console.log("r = " + r);

            //gain as percentage of diameter
            var gainAmt = Math.max(0, 1-(c/(1.2*r)));
            console.log("gain = " + gainAmt);

            //set gain for each channel
            speakerArray[i][2].gain.value = gainAmt;
        }
    }
}









function loadFile(file) {
    var getSound = new XMLHttpRequest();
    getSound.open("GET", file, true);
    getSound.responseType = "arraybuffer";
    getSound.onload = function() {
        audioContext.decodeAudioData(getSound.response, function(buffer){  //decodeAudioData returns an AudioBuffer object to use with AudioBufferSourceNode(same as AudioContext.createBuffer())
            audioContext.audioBuffer = buffer;
            // audioContext.audioBuffers
        });
    }
    getSound.send();
}

loadFile("sample.wav");
loadFile("sample.wav");
loadFile("sample.wav");
loadFile("sample.wav");
