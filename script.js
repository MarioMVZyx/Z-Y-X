const colors = {
  cyan: "#00D5FF",
  blue: "#318BFF",
  red: "#FF5555",
  green: "#39D6A0",
  orange: "#FF9D42",
  muted: "#9AA6B2"
};

Chart.defaults.font.family = "'Segoe UI', Inter, Arial, sans-serif";
Chart.defaults.color = colors.muted;

const financeChart = new Chart(document.getElementById("financeChart"), {
  type: "bar",
  data: {
    labels: ["30 clientes", "15 clientes"],
    datasets: [{
      label: "Flujo neto mensual",
      data: [6000, -3000],
      backgroundColor: [colors.cyan, colors.red],
      borderRadius: 5,
      borderSkipped: false,
      barThickness: 58
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1100, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1A222D",
        borderColor: "rgba(244,247,250,.12)",
        borderWidth: 1,
        callbacks: {
          label: context => {
            const value = context.raw;
            return value < 0 ? ` −$${Math.abs(value).toLocaleString("es-MX")}` : ` $${value.toLocaleString("es-MX")}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        beginAtZero: true,
        min: -4000,
        max: 8000,
        grid: { color: "rgba(244,247,250,.055)" },
        border: { display: false },
        ticks: {
          callback: value => value === 0 ? "$0" : `$${value / 1000}k`,
          font: { size: 9 }
        }
      }
    }
  }
});

const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...document.querySelectorAll(".section-panel")];
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

function activateNavigation(id) {
  navLinks.forEach(link => link.classList.toggle("active", link.dataset.target === id));
  window.dispatchEvent(new CustomEvent("zyx-section-change", { detail: { id } }));
}

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

menuToggle.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) activateNavigation(entry.target.dataset.section);
  });
}, { rootMargin: "-35% 0px -55%", threshold: 0 });
sections.forEach(section => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(element => revealObserver.observe(element));

const progressBar = document.querySelector("#sectionProgress span");
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.height = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
}, { passive: true });

document.querySelectorAll(".tilt").forEach(card => {
  card.addEventListener("mousemove", event => {
    if (!window.matchMedia("(pointer:fine)").matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--rx", `${-y * 2.5}deg`);
    card.style.setProperty("--ry", `${x * 2.5}deg`);
  });
  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
});

const coverObject = document.querySelector(".cover-object");
window.addEventListener("mousemove", event => {
  if (!coverObject || !window.matchMedia("(pointer:fine)").matches) return;
  const x = (event.clientX / window.innerWidth - 0.5) * 10;
  const y = (event.clientY / window.innerHeight - 0.5) * 10;
  coverObject.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
}, { passive: true });

const audio = document.getElementById("decisionAudio");
const playButton = document.getElementById("playButton");
const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const audioStatus = document.getElementById("audioStatus");

const evidencePhoto = document.getElementById("evidencePhoto");
const pendingMedia = document.querySelector(".pending-media");
evidencePhoto.hidden = false;
pendingMedia.hidden = true;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

audio.addEventListener("error", () => {
  audioStatus.textContent = "Archivo pendiente: assets/decision.mp3";
  audioStatus.style.color = colors.orange;
});
audio.addEventListener("loadedmetadata", () => {
  duration.textContent = formatTime(audio.duration);
  audioStatus.textContent = "Audio listo para reproducción";
  audioStatus.style.color = colors.green;
});
playButton.addEventListener("click", () => {
  if (!audio.getAttribute("src")) audio.src = "./assets/decision.mp3";
  if (audio.paused) {
    audio.play().then(() => {
      playButton.classList.add("playing");
      audioStatus.textContent = "Reproduciendo decisión profesional";
      audioStatus.style.color = colors.cyan;
    }).catch(() => {
      audioStatus.textContent = "Archivo pendiente: assets/decision.mp3";
      audioStatus.style.color = colors.orange;
    });
  } else {
    audio.pause();
    playButton.classList.remove("playing");
  }
});
audio.addEventListener("pause", () => playButton.classList.remove("playing"));
audio.addEventListener("ended", () => {
  playButton.classList.remove("playing");
  audioStatus.textContent = "Reproducción finalizada";
});
audio.addEventListener("timeupdate", () => {
  const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progress.value = percent;
  progress.style.setProperty("--progress", `${percent}%`);
  currentTime.textContent = formatTime(audio.currentTime);
});
progress.addEventListener("input", () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
});
volume.addEventListener("input", () => {
  audio.volume = Number(volume.value);
});

const groupInput = document.getElementById("groupInput");
groupInput.addEventListener("input", () => {
  document.querySelectorAll(".editable-group input").forEach(input => {
    if (document.activeElement !== input) input.value = groupInput.value;
  });
});
