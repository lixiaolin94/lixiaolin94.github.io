let Time = { 
    currentTime: 0,
    lastTime: 0,
    deltaTime: 0
};

function TimeUpdate() {
    Time.currentTime = performance.now() / 1000;
    Time.deltaTime = Time.currentTime - Time.lastTime;
    Time.lastTime = Time.currentTime;
    window.requestAnimationFrame(TimeUpdate);
}

Time.lastTime = performance.now() / 1000;
window.requestAnimationFrame(TimeUpdate); 