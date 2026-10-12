// confetti.js
//
// Dependency-free confetti on a full-screen canvas. fireCornerConfetti() shoots
// a few waves from the bottom-left and bottom-right corners towards the middle
// of the screen, then removes the canvas once the last piece has faded.
// Returns a cleanup function that stops it early.

const COLORS = ["#f43f5e", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];
const WAVES_MS = [0, 450, 900, 1600];
const PIECES_PER_CORNER = 70;
const GRAVITY = 0.32;
const DRAG = 0.985;
const LIFE_FRAMES = 260;

const rand = (min, max) => min + Math.random() * (max - min);

function makePiece(fromLeft, width, height) {
  // Up and in towards the centre: ~45-80° from the floor
  const angle = rand(Math.PI * 0.25, Math.PI * 0.45);
  const speed = rand(14, 24) * Math.min(1.4, Math.max(0.8, height / 800));
  return {
    x: fromLeft ? -10 : width + 10,
    y: height + 10,
    vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
    vy: -Math.sin(angle) * speed * 1.35,
    size: rand(6, 11),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: Math.random() < 0.3 ? "circle" : "rect",
    tilt: rand(0, Math.PI * 2),
    tiltSpeed: rand(0.08, 0.25),
    wobble: rand(0, Math.PI * 2),
    age: 0,
  };
}

export function fireCornerConfetti({ zIndex = 1100 } = {}) {
  if (typeof window === "undefined") return () => {};

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: String(zIndex),
  });
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  let pieces = [];
  const timers = WAVES_MS.map((delay) =>
    setTimeout(() => {
      for (let i = 0; i < PIECES_PER_CORNER; i++) {
        pieces.push(makePiece(true, width, height), makePiece(false, width, height));
      }
    }, delay)
  );

  let frame = 0;
  let stopped = false;
  const lastWaveAt = WAVES_MS[WAVES_MS.length - 1];
  const startedAt = performance.now();

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    window.removeEventListener("resize", resize);
    canvas.remove();
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    pieces = pieces.filter((p) => p.age < LIFE_FRAMES && p.y < height + 40);

    pieces.forEach((p) => {
      p.age += 1;
      p.vx *= DRAG;
      p.vy = p.vy * DRAG + GRAVITY;
      p.wobble += 0.1;
      p.tilt += p.tiltSpeed;
      p.x += p.vx + Math.sin(p.wobble) * 0.6;
      p.y += p.vy;

      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p.age - LIFE_FRAMES * 0.7) / (LIFE_FRAMES * 0.3));
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tilt);
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // cos(tilt) squashes the strip so it looks like it's flipping
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * Math.abs(Math.cos(p.tilt)) + 1);
      }
      ctx.restore();
    });

    if (!pieces.length && performance.now() - startedAt > lastWaveAt + 100) {
      stop();
      return;
    }
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);

  return stop;
}
