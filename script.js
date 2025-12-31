const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

window.addEventListener('resize', () => {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
});

// Helper function to get random number within a range
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Helper function to calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

// Firework Class
class Firework {
    constructor(sx, sy, tx, ty) {
        this.x = sx;
        this.y = sy;
        this.sx = sx;
        this.sy = sy;
        this.tx = tx;
        this.ty = ty;
        this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.coordinateCount = 3;

        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }

        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2;
        this.acceleration = 1.05;
        this.brightness = random(50, 70);
        // Circle target indicator radius
        this.targetRadius = 1;
    }

    update(index) {
        // Remove last item in coordinates array
        this.coordinates.pop();
        // Add current coordinates to the start of the array
        this.coordinates.unshift([this.x, this.y]);

        // Cycle the target circle radius
        if (this.targetRadius < 8) {
            this.targetRadius += 0.3;
        } else {
            this.targetRadius = 1;
        }

        // Speed up the firework
        this.speed *= this.acceleration;

        // Calculate current velocities
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;

        // How far will the firework have traveled with velocities applied?
        this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

        // If the distance traveled, including velocities, is greater than the initial distance to the target, then the target has been reached
        if (this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.tx, this.ty);
            // Remove the firework, use the index passed to the update function to determine which to remove
            fireworks.splice(index, 1);
        } else {
            // Target not reached, keep traveling
            this.x += vx;
            this.y += vy;
        }
    }

    draw() {
        ctx.beginPath();
        // Move to the last coordinate in the array, then draw a line to the current x and y
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsl(${hue}, 100%, ${this.brightness}%)`;
        ctx.stroke();

        ctx.beginPath();
        // Draw the target for this firework with a pulsing circle
        ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Particle Class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.coordinates = [];
        this.coordinateCount = 5;
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }

        this.angle = random(0, Math.PI * 2);
        this.speed = random(5, 25); // MASSIVE speed for HUGE explosion

        this.friction = 0.95;
        this.gravity = 1;

        // Use the global hue but with some variation for each particle to make it more colorful
        this.hue = random(hue - 50, hue + 50);
        this.brightness = random(50, 80);
        this.alpha = 1;

        // Set how fast the particle fades out
        this.decay = random(0.003, 0.01); // Even slower fade for persistence

        // Sparkle properties
        this.sparkle = Math.random() < 0.3; // 30% chance to sparkle
    }

    update(index) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;

        this.alpha -= this.decay;

        if (this.alpha <= this.decay) {
            particles.splice(index, 1);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);

        let currentBrightness = this.brightness;

        // Sparkle effect
        if (this.sparkle) {
            currentBrightness = random(50, 100);
            if (Math.random() < 0.1) {
                ctx.lineWidth = 2; // Occasional flare
            } else {
                ctx.lineWidth = 1;
            }
        }

        ctx.strokeStyle = `hsla(${this.hue}, 100%, ${currentBrightness}%, ${this.alpha})`;
        ctx.stroke();
        ctx.lineWidth = 1; // Reset
    }
}

// Variables
let fireworks = [];
let particles = [];
let hue = 120;
let limiterTotal = 5;
let limiterTick = 0;
let timerTotal = 80;
let timerTick = 0;
let mousedown = false;
let mx, my;
let isNewYear = false;

// Countdown Logic
const countdownContainer = document.getElementById('countdown');
const greetingContainer = document.getElementById('greeting-container'); // NEW CONTAINER
const newYearMessage = document.getElementById('new-year-message');
const instruction = document.getElementById('instruction');
const hoursSpan = document.getElementById('hours');
const minutesSpan = document.getElementById('minutes');
const secondsSpan = document.getElementById('seconds');

// Set target to upcoming Jan 1 00:00:00
const now = new Date();
// SIMULATION is REMOVED for final product
// const targetDate = now.getTime() + 5000;
let targetYear = now.getFullYear() + 1;
const targetDate = new Date(`Jan 1, ${targetYear} 00:00:00`).getTime();

function updateCountdown() {
    const currentTime = new Date().getTime();
    const distance = targetDate - currentTime;

    if (distance <= 0) {
        // It's New Year!
        if (!isNewYear) {
            isNewYear = true;
            countdownContainer.style.display = 'none';
            greetingContainer.style.display = 'block';
            showAllGreetings(); // Call the static word cloud function
        }
    } else {
        isNewYear = false;

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        hoursSpan.textContent = hours < 10 ? '0' + hours : hours;
        minutesSpan.textContent = minutes < 10 ? '0' + minutes : minutes;
        secondsSpan.textContent = seconds < 10 ? '0' + seconds : seconds;

        // Hide New Year message if it was visible (e.g. going back in time? unlikely but good practice)
        greetingContainer.style.display = 'none';

        instruction.style.display = 'none';
        countdownContainer.style.display = 'flex';
    }
}


// Multilingual Greetings
const greetings = [
    { text: "Happy New Year!", lang: "English" },
    { text: "新年快樂!", lang: "Traditional Chinese" },
    { text: "新年快乐!", lang: "Simplified Chinese" },
    { text: "明けましておめでとうございます!", lang: "Japanese" },
    { text: "새해 복 많이 받으세요!", lang: "Korean" },
    { text: "Bonne Année!", lang: "French" },
    { text: "Frohes Neues Jahr!", lang: "German" },
    { text: "¡Feliz Año Nuevo!", lang: "Spanish" },
    { text: "Felice Anno Nuovo!", lang: "Italian" },
    { text: "Feliz Ano Novo!", lang: "Portuguese" },
    { text: "С Новым Годом!", lang: "Russian" },
    { text: "नव वर्ष की शुभकामनाएँ!", lang: "Hindi" },
    { text: "كل عام وأنتم بخير", lang: "Arabic" },
    { text: "สวัสดีปีใหม่!", lang: "Thai" },
    { text: "Chúc Mừng Năm Mới!", lang: "Vietnamese" },
    { text: "Selamat Tahun Baru!", lang: "Indonesian" },
    { text: "Mutlu Yıllar!", lang: "Turkish" },
    { text: "Gelukkig Nieuwjaar!", lang: "Dutch" },
    { text: "Gott Nytt År!", lang: "Swedish" },
    { text: "Szczęśliwego Nowego Roku!", lang: "Polish" },
    { text: "Καλή Χρονιά!", lang: "Greek" },
    { text: "שנה טובה!", lang: "Hebrew" },
    { text: "Sakeny Wakeny!", lang: "Dwarvish (Fantasy)" }
];

const colorClasses = [
    'color-gold', 'color-ruby', 'color-sapphire', 'color-amethyst', 'color-emerald', 'color-cyber'
];

function showAllGreetings() {
    greetingContainer.innerHTML = ''; // Clear existing

    // Create Main English Greeting
    const mainWrapper = document.createElement('div');
    mainWrapper.style.position = 'absolute';
    mainWrapper.style.top = '50%';
    mainWrapper.style.left = '50%';
    mainWrapper.style.transform = 'translate(-50%, -50%)';
    mainWrapper.style.zIndex = '10';

    const mainGreeting = document.createElement('h1');
    mainGreeting.id = 'new-year-message';
    // Use Gold or Cyber for main message
    const mainColor = Math.random() < 0.5 ? 'color-gold' : 'color-cyber';
    mainGreeting.className = `greeting-text greeting-visible ${mainColor}`;
    mainGreeting.innerText = "Happy New Year!";
    mainGreeting.style.animationDelay = `0s, ${random(0, 2)}s, ${random(0, 2)}s`;

    mainWrapper.appendChild(mainGreeting);
    greetingContainer.appendChild(mainWrapper);

    // Create other greetings scattered around
    greetings.slice(1).forEach((item) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';

        const el = document.createElement('div');
        // Pick random color
        const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
        el.className = `greeting-text secondary-greeting greeting-visible ${randomColor}`;
        el.innerText = item.text;

        // Random Position logic
        let top, left;
        let safe = false;
        while (!safe) {
            top = random(10, 90);
            left = random(10, 90);

            // Simple center exclusion check
            if ((top < 35 || top > 65) || (left < 30 || left > 70)) {
                safe = true;
            }
        }

        wrapper.style.top = `${top}%`;
        wrapper.style.left = `${left}%`;

        // Apply rotation to wrapper
        wrapper.style.transform = `translate(-50%, -50%) rotate(${random(-25, 25)}deg)`;

        // Randomize font size slightly
        el.style.fontSize = `${random(1.5, 3.5)}rem`; // Bigger and bolder

        // Random animation delays/durations for "popcorn" feel
        const shineDelay = random(0, 5);
        // Randomize pulse delay (Desync)
        const pulseDelay = random(0, 2);

        // Smooth pulse duration
        const pulseDuration = random(1.8, 2.2);

        el.style.animationDelay = `0s, ${shineDelay}s, ${pulseDelay}s`;
        el.style.animationDuration = `0.8s, 4s, ${pulseDuration}s`;

        wrapper.appendChild(el);
        greetingContainer.appendChild(wrapper);
    });
}

// Main loop
function loop() {
    requestAnimationFrame(loop);

    // Update countdown every frame (efficient enough)
    updateCountdown();

    // Increase hue for next cycle to get different colors over time
    hue += 0.5;

    // Create a trail effect by filling the canvas with a transparent rectangle instead of clearing it completely
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set composition to lighter to make overlapping particles brighter
    ctx.globalCompositeOperation = 'lighter';

    // Update and draw existing fireworks
    let i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    // Update and draw existing particles
    let j = particles.length;
    while (j--) {
        particles[j].draw();
        particles[j].update(j);
    }

    // Only launch fireworks if it's new year!
    if (isNewYear) {
        // Launch fireworks automatically
        if (timerTick >= timerTotal) {
            if (!mousedown) {
                // Start the firework at the bottom middle of the screen
                // Target a random position in the upper half of the screen
                fireworks.push(new Firework(canvasWidth / 2, canvasHeight, random(0, canvasWidth), random(0, canvasHeight / 2)));
                timerTick = 0;
            }
        } else {
            timerTick++;
        }

        // Limit the rate at which fireworks can be launched by mouse
        if (limiterTick >= limiterTotal) {
            if (mousedown) {
                fireworks.push(new Firework(canvasWidth / 2, canvasHeight, mx, my));
                limiterTick = 0;
            }
        } else {
            limiterTick++;
        }
    } else {
        // Optional: Allow manual clicks BEFORE New Year? 
        // User probably wants to wait. 
        // Keep it restricted to New Year only for maximum impact.
    }
}

function createParticles(x, y) {
    let particleCount = 150; // MORE particles!
    while (particleCount--) {
        particles.push(new Particle(x, y));
    }
}

// Mouse event bindings
canvas.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    // Only allow interaction if it's new year
    if (isNewYear) {
        mousedown = true;

        // Hide instruction on click
        if (instruction && instruction.style.opacity !== '0') {
            instruction.style.opacity = '0';
            setTimeout(() => instruction.style.display = 'none', 1000);
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    e.preventDefault();
    mousedown = false;
});

// Start loop
window.onload = loop;
