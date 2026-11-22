const chartColors = {
  purple: "#8b7cf6",
  cyan: "#55c9df",
  green: "#55d6a7",
  orange: "#f3ad68",
  pink: "#df7aaf"
};

Chart.defaults.font.family = "'Segoe UI', Inter, Arial, sans-serif";
Chart.defaults.color = "#858b98";

const inventoryData = {
  month: {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    entradas: [132, 148, 141, 168, 174, 163, 188, 192, 184, 205, 218, 226],
    salidas: [118, 126, 135, 151, 158, 149, 172, 176, 179, 188, 202, 214]
  },
  quarter: {
    labels: ["T1", "T2", "T3", "T4"],
    entradas: [421, 505, 544, 649],
    salidas: [379, 458, 527, 604]
  }
};

const inventoryCtx = document.getElementById("inventoryChart");
const inventoryChart = new Chart(inventoryCtx, {
  type: "line",
  data: {
    labels: inventoryData.month.labels,
    datasets: [
      { label: "Entradas", data: inventoryData.month.entradas, borderColor: chartColors.purple, backgroundColor: "rgba(139,124,246,.08)", fill: true, tension: .38, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
      { label: "Salidas", data: inventoryData.month.salidas, borderColor: chartColors.cyan, backgroundColor: "rgba(85,201,223,.03)", fill: true, tension: .38, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: { legend: { position: "top", align: "end", labels: { boxWidth: 8, boxHeight: 8, useBorderRadius: true, borderRadius: 8, padding: 14, font: { size: 10 } } }, tooltip: { backgroundColor: "#242731", borderColor: "rgba(255,255,255,.08)", borderWidth: 1, padding: 10 } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 9 } } },
      y: { beginAtZero: false, min: 100, grid: { color: "rgba(255,255,255,.045)" }, border: { display: false }, ticks: { font: { size: 9 } } }
    }
  }
});

const categoryValues = [38, 26, 21, 15];
const categoryLabels = ["Electronica", "Alimentos", "Hogar", "Otros"];
const categoryChart = new Chart(document.getElementById("categoryChart"), {
  type: "doughnut",
  data: {
    labels: categoryLabels,
    datasets: [{ data: categoryValues, backgroundColor: [chartColors.purple, chartColors.cyan, chartColors.orange, chartColors.pink], borderWidth: 5, borderColor: "#171922", hoverOffset: 4 }]
  },
  options: { responsive: true, maintainAspectRatio: false, cutout: "74%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` ${context.label}: ${context.raw}%` } } } }
});

const legend = document.getElementById("categoryLegend");
categoryLabels.forEach((label, index) => {
  const item = document.createElement("div");
  item.className = "legend-item";
  item.innerHTML = `<i style="background:${categoryChart.data.datasets[0].backgroundColor[index]}"></i><span>${label}</span><strong>${categoryValues[index]}%</strong>`;
  legend.appendChild(item);
});

const financeChart = new Chart(document.getElementById("financeChart"), {
  type: "bar",
  data: {
    labels: ["Energia", "Logistica", "Almacen", "Adquisicion", "Personal"],
    datasets: [
      { label: "Costo", data: [44, 72, 58, 88, 65], backgroundColor: "rgba(139,124,246,.68)", borderRadius: 5, barThickness: 18 },
      { label: "Demanda", data: [58, 64, 78, 92, 71], backgroundColor: "rgba(85,201,223,.55)", borderRadius: 5, barThickness: 18 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "top", align: "end", labels: { boxWidth: 8, boxHeight: 8, padding: 14, font: { size: 10 } } } },
    scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, max: 100, grid: { color: "rgba(255,255,255,.045)" }, border: { display: false } } }
  }
});

const periodSelect = document.getElementById("periodSelect");
periodSelect.addEventListener("change", () => {
  const data = inventoryData[periodSelect.value];
  inventoryChart.data.labels = data.labels;
  inventoryChart.data.datasets[0].data = data.entradas;
  inventoryChart.data.datasets[1].data = data.salidas;
  inventoryChart.update();
});

const sections = [...document.querySelectorAll(".section")];
const navLinks = [...document.querySelectorAll(".nav-link")];
const titles = { overview: "Panel general", analytics: "Analitica", inventory: "Inventario", forecast: "Pronostico", decisions: "Centro de decision" };
function showSection(id) {
  sections.forEach(section => section.classList.toggle("active-section", section.id === id));
  navLinks.forEach(link => link.classList.toggle("active", link.dataset.section === id));
  document.getElementById("pageTitle").textContent = titles[id] || "Panel general";
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
navLinks.forEach(link => link.addEventListener("click", event => {
  event.preventDefault();
  showSection(link.dataset.section);
}));

const menuToggle = document.getElementById("menuToggle");
menuToggle.addEventListener("click", () => {
  const open = document.getElementById("sidebar").classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".tilt-card").forEach(card => {
  card.addEventListener("mousemove", event => {
    if (window.matchMedia("(pointer:fine)").matches) {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty("--rx", `${-y * 3}deg`);
      card.style.setProperty("--ry", `${x * 3}deg`);
    }
  });
  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
});

document.getElementById("themeButton").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

const inventory = [
  { name: "Sensor MX-240", sku: "SN-MX240", stock: 824, state: "healthy", value: "$42,840" },
  { name: "Modulo Carga C7", sku: "MC-C7001", stock: 318, state: "healthy", value: "$28,620" },
  { name: "Controlador AX-12", sku: "CT-AX120", stock: 64, state: "low", value: "$18,240" },
  { name: "Bateria Nova L", sku: "BT-NVL09", stock: 496, state: "healthy", value: "$35,712" },
  { name: "Unidad Optica K2", sku: "OP-K2004", stock: 38, state: "low", value: "$12,480" },
  { name: "Kit Conexion Pro", sku: "KC-PR301", stock: 212, state: "healthy", value: "$21,720" }
];

function renderInventory(filter = "all") {
  const rows = inventory.filter(item => filter === "all" || item.state === filter);
  document.getElementById("visibleCount").textContent = rows.length;
  document.getElementById("inventoryTable").innerHTML = rows.map(item => `
    <tr>
      <td><div class="product-cell"><span class="product-thumb">${item.name.split(" ").map(word => word[0]).join("").slice(0,2)}</span><span><strong>${item.name}</strong><small>Componentes</small></span></div></td>
      <td>${item.sku}</td>
      <td><strong>${item.stock}</strong> uds.</td>
      <td><span class="stock-state ${item.state}"><i></i>${item.state === "healthy" ? "Saludable" : "Stock bajo"}</span></td>
      <td><strong>${item.value}</strong></td>
    </tr>`).join("");
}
renderInventory();
document.getElementById("stockFilters").addEventListener("click", event => {
  if (event.target.tagName !== "BUTTON") return;
  document.querySelectorAll("#stockFilters button").forEach(button => button.classList.remove("active"));
  event.target.classList.add("active");
  renderInventory(event.target.dataset.filter);
});

document.getElementById("searchInput").addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();
  const match = inventory.find(item => `${item.name} ${item.sku}`.toLowerCase().includes(query));
  if (query && match) showSection("inventory");
});

const audio = document.getElementById("decisionAudio");
const playButton = document.getElementById("playButton");
const progress = document.getElementById("progress");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

playButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().then(() => playButton.classList.add("playing")).catch(() => showToast("Agrega assets/decision.mp3 para reproducir el reporte"));
  } else {
    audio.pause();
    playButton.classList.remove("playing");
  }
});
audio.addEventListener("loadedmetadata", () => { duration.textContent = formatTime(audio.duration); });
audio.addEventListener("timeupdate", () => {
  const value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progress.value = value;
  progress.style.setProperty("--progress", `${value}%`);
  currentTime.textContent = formatTime(audio.currentTime);
});
audio.addEventListener("ended", () => playButton.classList.remove("playing"));
progress.addEventListener("input", () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
});

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.getElementById("exportButton").addEventListener("click", () => {
  const csv = ["Producto,SKU,Stock,Estado,Valor", ...inventory.map(item => `${item.name},${item.sku},${item.stock},${item.state},${item.value}`)].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "zyx-inventario.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Reporte exportado");
});
document.getElementById("reviewButton").addEventListener("click", () => showSection("inventory"));
