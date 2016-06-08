/* TO DO: 
- add playback controls for each loaded sample. scrub, etc.; Also, master play button, solo/mute?
- add delays (slider input (http://stackoverflow.com/questions/8696731/creating-a-vertical-slider-html-element for vert slider) and nodes.
- click/drag to change panning position. display pan position.
- move each speaker icon independently
- midi input to control pan position.
- pan automation.
*/



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
audioContext.bufferList = new Array();


// File load setup

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
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
    //Set channel numbers, add gain nodes
    var numSpeakers = document.getElementById("channels").value;
    audioContext.destination.channelCount = numSpeakers;
    if(numSpeakers == 0) {
        for (var i = 0; i < speakerArray.length; i++) {
            speakerArray[i][2].gain.value = 0;
        }
        return;
    }

    //Make a merger (routes audio to diff channels)
    audioContext.merger = audioContext.createChannelMerger(numSpeakers);
    audioContext.merger.connect(audioContext.destination);


    //Draw speakers
    var angleOffset = document.getElementById("slider").value;
    if(typeof speakerArray == 'undefined') speakerArray = [];
    else speakerArray.splice(0,speakerArray.length);   //clear the array without making a new one (which would mess up references)
    drawSpeakers(numSpeakers, angleOffset);

    //Add DOM elements for sample selection (dropdown menu with id="thisSpeakerNumber", and delay inputs in ms. 
    var spanNode = document.getElementById("sampleMenu");

    for (var i = 1; i <= numSpeakers; i++) {

        var newInput = document.createElement("input");
        newInput.addEventListener('change', handleFileSelect, false);
        newInput.setAttribute("type", "file");
        newInput.setAttribute("id", "files");
        newInput.setAttribute("name", "files[]");

        spanNode.appendChild(newInput);
        spanNode.appendChild(document.createElement("br"));


        // // OLD VERSION OF CLIP SELECTION
        // var newSelect = document.createElement("select");
        // newSelect.setAttribute("id", "speaker" + i);
        // newSelect.setAttribute("onchange", "connectBuffer(this)");
        // newSelect.setAttribute("class", "light");

        // var newLabel = document.createElement("label");
        // newLabel.innerHTML = i + " :";
        // // newElement.setAttribute("id", i);
        // spanNode.appendChild(newLabel);
        // spanNode.appendChild(newSelect);
        // spanNode.appendChild(document.createElement("br"));
    

        // for(var j = audioContext.bufferList.length-1; j >= 0; j--) {    //SET THIS DYNAMICALLY LATER... not sure how with async fileload (i < audioContext.bufferList.length)
        //     var option = document.createElement('option');
        //     option.text = option.value = audioContext.bufferList[j][0];
        //     newSelect.add(option, 0);
        // }

        // var blankOption = document.createElement('option');
        // blankOption.value = -1;
        // blankOption.text = "--choose a clip--";
        // newSelect.add(blankOption, 0);
    //Add delay fields

    }

}


function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    console.log("here");

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}




function connectBuffer(element) {
    // Get speaker number
    var speakerNum = element.id.slice(7,8) - 1; 
    var sampleName = element.value;
    console.log(sampleName);
    console.log(speakerNum);

    //Add&remove buffer nodes for each channel.
    var source = audioContext.createBufferSource(); //Creates an AudioBufferSourceNode

    //If already a sample on current channel: turn down gain (necessary to avoid click?) and disconnect node.
    if(typeof speakerArray[speakerNum][2] != 'undefined') {
        speakerArray[speakerNum][2].gain.value = 0;
        speakerArray[speakerNum][2].disconnect();
    }

    for(var i=0; i < audioContext.bufferList.length; i++) {                                                 //REDO THIS USING OBJECTS STORED IN ARRAY for bufferlist (not nested arrays)
        if(audioContext.bufferList[i][0] == sampleName) {    // If name matches array element...
            source.buffer = audioContext.bufferList[i][1]; //...load the buffer into the source node.
        }
    }
    // source.buffer = audioContext.bufferList[0][1]; //Loads the buffer into the source node
    var gainNode = audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(audioContext.merger, 0, speakerNum); // Assigns the source to a specific channel input on the destination
    gainNode.gain.value = 0;
    source.loop = true;
    source.start(0);

    speakerArray[speakerNum][2] = gainNode;
        //Add dom elements for selecting sample for each speaker.
    // addSampleMenu(speakerNum);

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
    // var center = canvas.width/2;
    // var spriteSize = canvas.width / 30.0;

    // canvasContext.fillStyle = "#5a5c51";
    // canvasContext.fillRect(mouseX, mouseY, spriteSize, spriteSize);

    if(typeof speakerArray != 'undefined') {
        var r = (canvas.width / 2.0) - 20;
        for (var i = 0; i < speakerArray.length; i++) {
            if(typeof speakerArray[i][2] != 'undefined') {
                //get distance from current event point in canvas to current speaker in array
                var a = mouseX - speakerArray[i][0];
                var b = mouseY - speakerArray[i][1];
                var c = Math.sqrt((a*a) + (b*b));   //distance from mouse to speaker
                // console.log("c = " + c);
                // console.log("r = " + r);

                //gain as percentage of radius (roughly)
                var gainAmt = Math.max(0, 1-(c/(1.4*r)));
                // console.log("gain = " + gainAmt);

                //set gain for each channel
                speakerArray[i][2].gain.value = gainAmt;
            }
        }
    }
}









function loadFile(file) {
    var getSound = new XMLHttpRequest();
    getSound.open("GET", file, true);
    getSound.responseType = "arraybuffer";
    getSound.onload = function() {
        audioContext.decodeAudioData(getSound.response, function(buffer){  //decodeAudioData returns an AudioBuffer object to use with AudioBufferSourceNode(same as AudioContext.createBuffer())
            audioContext.bufferList.push([file, buffer]);
        });
    }
    getSound.send();
}



// loadFile("sample1.wav");
// loadFile("sample2.wav");
// loadFile("sample3.wav");
// loadFile("sample4.wav");


loadFile("round/round1.wav");
loadFile("round/round2.wav");
loadFile("round/round3.wav");
loadFile("round/round4.wav");
loadFile("round/round5.wav");
loadFile("round/round6.wav");
loadFile("round/round7.wav");

