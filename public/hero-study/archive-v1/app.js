const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const navLinks = [...document.querySelectorAll(".pill-nav a")];
const observedSections = [...document.querySelectorAll("main > section[id]")];

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      const target = link.getAttribute("href").slice(1);
      link.classList.toggle("is-active", target === visible.target.id);
    });
  },
  { threshold: [0.25, 0.55] },
);
observedSections.forEach((section) => observer.observe(section));

document.querySelectorAll(".spotlight-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

const hero = document.querySelector(".hero");
const titleLines = [...document.querySelectorAll(".pressure-line")];
const floaters = [...document.querySelectorAll(".floating-window")];

if (!prefersReducedMotion) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    titleLines.forEach((line, index) => {
      const stretch = 0.94 + x * 0.12;
      const skew = (x - 0.5) * (index ? -5 : 5);
      const spacing = -0.085 + y * 0.025;
      line.style.transform = `scaleX(${stretch}) skewX(${skew}deg)`;
      line.style.letterSpacing = `${spacing}em`;
    });
    floaters.forEach((floater, index) => {
      const dx = (x - 0.5) * (index ? -22 : 28);
      const dy = (y - 0.5) * (index ? 18 : -20);
      const rotate = index ? -7 : 3;
      floater.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;
    });
  });

  hero.addEventListener("pointerleave", () => {
    titleLines.forEach((line) => {
      line.style.transform = "";
      line.style.letterSpacing = "";
    });
    floaters.forEach((floater) => { floater.style.transform = ""; });
  });
}

const canvas = document.querySelector("#hero-field");
const context = canvas.getContext("2d");
let points = [];
let pointer = { x: -999, y: -999 };

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  points = [];
  const step = window.innerWidth < 700 ? 42 : 34;
  for (let y = step; y < rect.height; y += step) {
    for (let x = step; x < rect.width; x += step) {
      points.push({ x, y, ox: x, oy: y });
    }
  }
}

function drawField() {
  const rect = canvas.getBoundingClientRect();
  context.clearRect(0, 0, rect.width, rect.height);
  context.fillStyle = "rgba(16, 16, 16, 0.28)";
  points.forEach((point) => {
    const dx = point.ox - pointer.x;
    const dy = point.oy - pointer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const force = Math.max(0, 1 - distance / 180);
    const angle = Math.atan2(dy, dx);
    point.x += (point.ox + Math.cos(angle) * force * 28 - point.x) * 0.12;
    point.y += (point.oy + Math.sin(angle) * force * 28 - point.y) * 0.12;
    const radius = 1 + force * 3;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
  });
  if (!prefersReducedMotion) requestAnimationFrame(drawField);
}

hero.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
});
hero.addEventListener("pointerleave", () => { pointer = { x: -999, y: -999 }; });
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawField();

const projectCards = [...document.querySelectorAll(".project-card")];
if (!prefersReducedMotion) {
  window.addEventListener("scroll", () => {
    projectCards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (100 - rect.top) / 420));
      const scale = 1 - progress * 0.025 * (projectCards.length - index);
      card.style.transform = `scale(${scale})`;
    });
  }, { passive: true });
}
