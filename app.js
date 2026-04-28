const colors = ["#0f766e", "#2563eb", "#b7791f", "#c2410c", "#7c3aed"];
const annuityTypes = [
  { id: "fia", label: "FIA - Fixed Indexed Annuity" },
  { id: "rila", label: "RILA - Registered Index-Linked Annuity" },
  { id: "spia", label: "SPIA - Single Premium Immediate Annuity" },
  { id: "dia", label: "DIA - Deferred Income Annuity" },
  { id: "myga", label: "MYGA - Multi-Year Guaranteed Annuity" },
  { id: "fixed", label: "Fixed Annuity" },
  { id: "variable", label: "Variable Annuity" },
  { id: "qlac", label: "QLAC - Qualified Longevity Annuity" },
];
const markets = [
  {
    id: "sp500",
    name: "S&P 500",
    scenarios: [-30, -20, -10, -5, 0, 5, 10, 15, 20, 30],
  },
  {
    id: "nasdaq100",
    name: "Nasdaq-100",
    scenarios: [-40, -28, -15, -7, 0, 8, 16, 24, 32, 45],
  },
  {
    id: "russell2000",
    name: "Russell 2000",
    scenarios: [-38, -26, -14, -6, 0, 7, 14, 21, 28, 38],
  },
  {
    id: "djia",
    name: "Dow Jones Industrial Average",
    scenarios: [-26, -18, -9, -4, 0, 4, 8, 13, 18, 25],
  },
  {
    id: "msciEafe",
    name: "MSCI EAFE",
    scenarios: [-34, -23, -12, -6, 0, 5, 10, 16, 22, 31],
  },
  {
    id: "balanced",
    name: "Balanced / volatility-control index",
    scenarios: [-16, -11, -6, -3, 0, 3, 6, 9, 12, 17],
  },
];
const productNameIdeas = [
  "Carrier Shield 10",
  "Secure Growth Plus",
  "Index Advantage",
  "Retirement Builder",
  "Protected Growth",
  "Income Edge",
];

let products = [
  {
    id: crypto.randomUUID(),
    name: "Growth Shield",
    type: "fia",
    dualDirection: true,
    cap: 9.5,
    participation: 80,
    buffer: 10,
    floor: -10,
    fee: 0.8,
  },
  {
    id: crypto.randomUUID(),
    name: "Balanced Buffer",
    type: "rila",
    dualDirection: false,
    cap: 7,
    participation: 100,
    buffer: 15,
    floor: -8,
    fee: 0.4,
  },
  {
    id: crypto.randomUUID(),
    name: "Income Guard",
    type: "fia",
    dualDirection: false,
    cap: 5.5,
    participation: 65,
    buffer: 20,
    floor: 0,
    fee: 0.2,
  },
];

const formsEl = document.querySelector("#productForms");
const rowsEl = document.querySelector("#comparisonRows");
const payoffChartEl = document.querySelector("#payoffChart");
const barChartEl = document.querySelector("#barChart");
const recommendationTitleEl = document.querySelector("#recommendationTitle");
const recommendationTextEl = document.querySelector("#recommendationText");
const leadScoreEl = document.querySelector("#leadScore");
const addProductButton = document.querySelector("#addProductButton");
const marketSelectEl = document.querySelector("#marketSelect");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function payoff(product, marketReturn) {
  if (product.dualDirection && marketReturn < 0) {
    const inverseCredit = Math.min(product.cap, Math.abs(marketReturn) * (product.participation / 100));
    return Number(Math.max(0, inverseCredit - product.fee).toFixed(2));
  }

  const upside = Math.min(product.cap, Math.max(0, marketReturn * (product.participation / 100)));
  const protectedLoss = marketReturn < 0 ? Math.min(0, marketReturn + product.buffer) : 0;
  const flooredLoss = Math.max(protectedLoss, product.floor);
  const credited = marketReturn >= 0 ? upside : flooredLoss;
  return Number((credited - product.fee).toFixed(2));
}

function selectedMarket() {
  return markets.find((market) => market.id === marketSelectEl.value) || markets[0];
}

function metrics(product, scenarios) {
  const payoffs = scenarios.map((scenario) => payoff(product, scenario));
  const average = payoffs.reduce((sum, value) => sum + value, 0) / payoffs.length;
  const downsideScenarios = scenarios.filter((scenario) => scenario < 0);
  const upsideScenarios = scenarios.filter((scenario) => scenario > 0);
  const downsideValues = downsideScenarios.map((scenario) => payoff(product, scenario));
  const downsideAverage = downsideValues.reduce((sum, value) => sum + value, 0) / downsideValues.length;
  const upsideAverage = upsideScenarios
    .map((scenario) => payoff(product, scenario))
    .reduce((sum, value) => sum + value, 0) / upsideScenarios.length;
  const score = average * 1.7 + downsideAverage * 1.05 + upsideAverage * 0.55 - product.fee * 0.8;

  return {
    payoffs,
    average,
    downsideAverage,
    upsideAverage,
    score,
  };
}

function renderMarketOptions() {
  marketSelectEl.innerHTML = markets
    .map((market) => `<option value="${market.id}">${market.name}</option>`)
    .join("");
  marketSelectEl.value = markets[0].id;
}

function typeLabel(typeId) {
  return annuityTypes.find((type) => type.id === typeId)?.label || "Custom annuity";
}

function formatPct(value) {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderForms() {
  formsEl.innerHTML = products
    .map(
      (product, index) => `
      <article class="product-card" data-id="${product.id}">
        <div class="product-card-header">
          <h3>${escapeHtml(product.name || "Untitled annuity")}</h3>
          <button class="remove-button" type="button" title="Remove product" aria-label="Remove ${escapeHtml(product.name)}" ${products.length <= 1 ? "disabled" : ""}>×</button>
        </div>
        <div class="field-grid">
          <div class="field field-full">
            <label>Product name</label>
            <input class="product-name" value="${escapeHtml(product.name)}" placeholder="e.g., Allianz 222 or Athene Performance Elite" aria-label="Product name" data-field="name">
          </div>
          <div class="field field-full">
            <label>Annuity type</label>
            <select aria-label="Annuity type" data-field="type">
              ${annuityTypes
                .map((type) => `<option value="${type.id}" ${product.type === type.id ? "selected" : ""}>${type.label}</option>`)
                .join("")}
            </select>
          </div>
          <div class="field">
            <label>Dual direction</label>
            <select aria-label="Dual direction" data-field="dualDirection">
              <option value="true" ${product.dualDirection ? "selected" : ""}>Yes</option>
              <option value="false" ${!product.dualDirection ? "selected" : ""}>No</option>
            </select>
          </div>
          ${numberField("Cap rate", "cap", product.cap)}
          ${numberField("Participation", "participation", product.participation)}
          ${numberField("Buffer", "buffer", product.buffer)}
          ${numberField("Floor", "floor", product.floor)}
          ${numberField("Annual fee", "fee", product.fee)}
          <div class="field">
            <label>Chart Color</label>
            <input type="color" value="${colors[index % colors.length]}" disabled aria-label="Chart color">
          </div>
        </div>
      </article>`
    )
    .join("");
}

function numberField(label, field, value) {
  return `
    <div class="field">
      <label>${label}</label>
      <input type="number" step="0.1" value="${value}" data-field="${field}">
    </div>
  `;
}

function renderComparison(enriched) {
  rowsEl.innerHTML = enriched
    .map(
      ({ product, metric, color }) => `
      <tr>
        <td><span class="product-pill"><span class="swatch" style="background:${color}"></span>${escapeHtml(product.name)}</span></td>
        <td><span class="type-badge">${escapeHtml(typeLabel(product.type).split(" - ")[0])}</span></td>
        <td><span class="direction-badge ${product.dualDirection ? "is-dual" : ""}">${product.dualDirection ? "Yes" : "No"}</span></td>
        <td>${formatPct(product.cap)}</td>
        <td>${formatPct(product.participation)}</td>
        <td>${formatPct(product.buffer)}</td>
        <td>${formatPct(product.floor)}</td>
        <td>${formatPct(metric.average)}</td>
        <td>${formatPct(metric.downsideAverage)}</td>
        <td>${metric.score.toFixed(1)}</td>
      </tr>`
    )
    .join("");
}

function renderRecommendation(enriched, market) {
  const sorted = [...enriched].sort((a, b) => b.metric.score - a.metric.score);
  const leader = sorted[0];
  const runnerUp = sorted[1];
  const protection = leader.product.buffer >= 15 || leader.product.floor >= 0;
  const upside = leader.product.cap >= 8 || leader.product.participation >= 90;
  const directionNote = leader.product.dualDirection
    ? " Its dual-direction design can turn negative index returns into positive credited returns, subject to the cap and participation rate."
    : "";

  recommendationTitleEl.textContent = `${leader.product.name} (${typeLabel(leader.product.type).split(" - ")[0]})`;
  leadScoreEl.textContent = leader.metric.score.toFixed(1);

  const profile = protection && upside
    ? "offers the strongest blend of upside capture and downside protection"
    : protection
      ? "stands out for downside protection in weak markets"
      : "leads primarily through stronger upside participation";

  const comparison = runnerUp
    ? ` It edges ${runnerUp.product.name} by ${(leader.metric.score - runnerUp.metric.score).toFixed(1)} score points across the scenario set.`
    : "";

  recommendationTextEl.textContent = `${leader.product.name} ${profile} in the ${market.name} scenario set, with an average credited return of ${formatPct(leader.metric.average)} and downside average of ${formatPct(leader.metric.downsideAverage)}.${directionNote}${comparison}`;
}

function chartFrame(width = 760, height = 320) {
  return {
    width,
    height,
    left: 52,
    right: 22,
    top: 24,
    bottom: 44,
  };
}

function renderPayoffChart(enriched, market) {
  const scenarios = market.scenarios;
  const frame = chartFrame();
  const plotWidth = frame.width - frame.left - frame.right;
  const plotHeight = frame.height - frame.top - frame.bottom;
  const allValues = enriched.flatMap(({ metric }) => metric.payoffs);
  const minY = Math.min(-20, Math.floor(Math.min(...allValues) / 5) * 5);
  const maxY = Math.max(20, Math.ceil(Math.max(...allValues) / 5) * 5);
  const xFor = (value) => frame.left + ((value - scenarios[0]) / (scenarios.at(-1) - scenarios[0])) * plotWidth;
  const yFor = (value) => frame.top + (1 - (value - minY) / (maxY - minY)) * plotHeight;
  const yTicks = [minY, minY / 2, 0, maxY / 2, maxY].map((value) => Math.round(value));

  const lines = enriched
    .map(({ metric, color }) => {
      const points = scenarios.map((scenario, index) => `${xFor(scenario)},${yFor(metric.payoffs[index])}`).join(" ");
      return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></polyline>`;
    })
    .join("");

  const dots = enriched
    .flatMap(({ metric, color }) =>
      scenarios.map((scenario, index) => `<circle cx="${xFor(scenario)}" cy="${yFor(metric.payoffs[index])}" r="3.5" fill="${color}"></circle>`)
    )
    .join("");

  payoffChartEl.innerHTML = `
    <svg viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="Line chart of annuity payoff scenarios">
      ${yTicks
        .map(
          (tick) => `
        <line class="${tick === 0 ? "zero-line" : "grid-line"}" x1="${frame.left}" x2="${frame.width - frame.right}" y1="${yFor(tick)}" y2="${yFor(tick)}"></line>
        <text class="axis-label" x="12" y="${yFor(tick) + 4}">${tick}%</text>`
        )
        .join("")}
      ${scenarios
        .map(
          (scenario) => `
        <text class="axis-label" x="${xFor(scenario)}" y="${frame.height - 14}" text-anchor="middle">${scenario}%</text>`
        )
        .join("")}
      ${lines}
      ${dots}
      <text class="axis-label" x="${frame.left + plotWidth / 2}" y="${frame.height - 2}" text-anchor="middle">${market.name} annual return scenario</text>
    </svg>
  `;
}

function renderBarChart(enriched) {
  const frame = chartFrame(520, 320);
  const plotWidth = frame.width - frame.left - frame.right;
  const plotHeight = frame.height - frame.top - frame.bottom;
  const max = Math.max(...enriched.flatMap(({ metric }) => [metric.average, metric.upsideAverage]), 1);
  const min = Math.min(...enriched.map(({ metric }) => metric.downsideAverage), -1);
  const yFor = (value) => frame.top + (1 - (value - min) / (max - min)) * plotHeight;
  const zeroY = yFor(0);
  const groupWidth = plotWidth / enriched.length;
  const barWidth = Math.min(34, groupWidth / 4);
  const labels = ["Avg", "Down", "Up"];

  const bars = enriched
    .map(({ product, metric, color }, productIndex) => {
      const values = [metric.average, metric.downsideAverage, metric.upsideAverage];
      const groupX = frame.left + productIndex * groupWidth + groupWidth / 2;
      const label = `<text class="axis-label" x="${groupX}" y="${frame.height - 14}" text-anchor="middle">${escapeHtml(product.name.slice(0, 12))}</text>`;
      const rects = values
        .map((value, valueIndex) => {
          const x = groupX + (valueIndex - 1) * (barWidth + 5) - barWidth / 2;
          const y = Math.min(yFor(value), zeroY);
          const height = Math.max(2, Math.abs(yFor(value) - zeroY));
          const opacity = valueIndex === 1 ? 0.55 : valueIndex === 2 ? 0.85 : 1;
          return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="4" fill="${color}" opacity="${opacity}"></rect>
            <text class="axis-label" x="${x + barWidth / 2}" y="${value >= 0 ? y - 6 : y + height + 14}" text-anchor="middle">${value.toFixed(1)}%</text>`;
        })
        .join("");
      return rects + label;
    })
    .join("");

  barChartEl.innerHTML = `
    <svg viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="Bar chart of average, downside, and upside returns">
      <line class="zero-line" x1="${frame.left}" x2="${frame.width - frame.right}" y1="${zeroY}" y2="${zeroY}"></line>
      ${bars}
      ${labels
        .map((label, index) => `<text class="axis-label" x="${frame.left + index * 44}" y="16">${label}</text>`)
        .join("")}
    </svg>
  `;
}

function render() {
  products = products.map((product) => ({
    ...product,
    type: annuityTypes.some((type) => type.id === product.type) ? product.type : "fia",
    dualDirection: Boolean(product.dualDirection),
    cap: clamp(Number(product.cap) || 0, 0, 100),
    participation: clamp(Number(product.participation) || 0, 0, 300),
    buffer: clamp(Number(product.buffer) || 0, 0, 100),
    floor: clamp(Number(product.floor) || 0, -100, 20),
    fee: clamp(Number(product.fee) || 0, 0, 20),
  }));

  const market = selectedMarket();
  const enriched = products.map((product, index) => ({
    product,
    metric: metrics(product, market.scenarios),
    color: colors[index % colors.length],
  }));

  renderComparison(enriched);
  renderRecommendation(enriched, market);
  renderPayoffChart(enriched, market);
  renderBarChart(enriched);
}

function updateProductFromField(event) {
  const card = event.target.closest(".product-card");
  if (!card) return;

  const product = products.find((item) => item.id === card.dataset.id);
  const field = event.target.dataset.field;
  if (!field) return;
  if (field === "name" || field === "type") {
    product[field] = event.target.value;
  } else if (field === "dualDirection") {
    product[field] = event.target.value === "true";
  } else {
    product[field] = Number(event.target.value);
  }
  if (field === "name") {
    card.querySelector(".product-card-header h3").textContent = product.name || "Untitled annuity";
  }
  render();
}

formsEl.addEventListener("input", updateProductFromField);
formsEl.addEventListener("change", updateProductFromField);

formsEl.addEventListener("click", (event) => {
  if (!event.target.matches(".remove-button")) return;
  const card = event.target.closest(".product-card");
  products = products.filter((product) => product.id !== card.dataset.id);
  renderForms();
  render();
});

addProductButton.addEventListener("click", () => {
  const nextName = productNameIdeas[products.length % productNameIdeas.length];
  products.push({
    id: crypto.randomUUID(),
    name: `${nextName}`,
    type: "fia",
    dualDirection: false,
    cap: 8,
    participation: 80,
    buffer: 10,
    floor: -10,
    fee: 0.5,
  });
  renderForms();
  render();
});

marketSelectEl.addEventListener("change", render);

renderMarketOptions();
renderForms();
render();
