const audioElement = document.getElementById('puppetAudio');
const faceElement = document.getElementById('face');
const statusElement = document.getElementById('status');

let audioCtx = null;
let analyser = null;
let source = null;

// Mouth viseme frames based on volume thresholds
const VISEMES = {
  REST: '😐',
  LOW: '😮',
  MID: '🗣️',
  LOUD: '😲'
};

function initAudioContext() {
  if (audioCtx) return;

  // Initialize Web Audio API pipeline
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  // Route: Node.js Stream -> Audio Element -> Web Audio Analyser -> Hardware Speakers
  source = audioCtx.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  animatePuppet();
}

function animatePuppet() {
  requestAnimationFrame(animatePuppet);

  if (!analyser || audioElement.paused) {
    faceElement.innerText = VISEMES.REST;
    return;
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  // Compute average volume/energy across voice frequency bands
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    sum += dataArray[i];
  }
  const averageVolume = sum / bufferLength;

  // Map audio energy to puppet visemes/mouth shapes
  if (averageVolume > 45) {
    faceElement.innerText = VISEMES.LOUD;
  } else if (averageVolume > 25) {
    faceElement.innerText = VISEMES.MID;
  } else if (averageVolume > 8) {
    faceElement.innerText = VISEMES.LOW;
  } else {
    faceElement.innerText = VISEMES.REST;
  }
}

// User interaction unlocks audio context
audioElement.addEventListener('play', () => {
  initAudioContext();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  statusElement.innerText = 'Status: Streaming audio & driving lip-sync';
});

audioElement.addEventListener('pause', () => {
  statusElement.innerText = 'Status: Paused';
});
