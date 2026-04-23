async function loadSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/1Y8smJO49K72P7MmTs4hIYEoFjdW18bEOFghcn-Wql0w/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));
  return json.table.rows.map((r) => r.c.map((c) => (c ? c.v : "")));
}

function renderTable(targetId, header, rows) {
  const table = document.getElementById(targetId);
  const visibleIndexes = [
    0,
    ...header.slice(2, header.length - 1).map((_, i) => i + 2),
  ];
  const visibleHeader = visibleIndexes.map((i) => header[i]);

  let html =
    "<tr>" + visibleHeader.map((h) => `<th>${h}</th>`).join("") + "</tr>";

  rows.forEach((r) => {
    const trimmed = visibleIndexes.map((i) => r[i] ?? "");
    html += "<tr>" + trimmed.map((v) => `<td>${v}</td>`).join("") + "</tr>";
  });

  table.innerHTML = html;
}

const teamH_Pitchers = ["伊藤", "村上", "東", "北山"];
const teamN_Pitchers = ["才木", "上沢", "達", "高橋遥"];
const teamU_Pitchers = ["高橋宏", "隅田", "種市", "竹丸"];
const teamK_Pitchers = ["栗林", "平良", "九里", "ターノック"];
const teamH_Batters = ["レイエス", "牧", "サノー", "水谷"];
const teamN_Batters = ["サトテル", "細川", "頓宮", "杉本"];
const teamU_Batters = ["清宮", "森下", "ダルベック", "ボイト"];
const teamK_Batters = ["山川", "万波", "ファビアン", "モンテロ"];

function renderTeamTable(
  teamName,
  pitcherNames,
  batterNames,
  pitchers,
  batters,
  pitcherHeader,
  batterHeader,
  teamClass,
) {
  const winIndex = pitcherHeader.indexOf("勝利");
  const hrIndex = batterHeader.indexOf("本塁打");

  const winRows = pitcherNames.map((name) => {
    const row = pitchers.find((r) => r[0] === name);
    const value = row ? Number(row[winIndex] || 0) : 0;
    return `<tr><td>${name}</td><td>${value}</td></tr>`;
  });

  const hrRows = batterNames.map((name) => {
    const row = batters.find((r) => r[0] === name);
    const value = row ? row[hrIndex] : 0;
    return `<tr><td>${name}</td><td>${value}</td></tr>`;
  });

  const winTotal = pitcherNames.reduce((sum, name) => {
    const row = pitchers.find((r) => r[0] === name);
    return sum + (row ? row[winIndex] : 0);
  }, 0);

  const hrTotal = batterNames.reduce((sum, name) => {
    const row = batters.find((r) => r[0] === name);
    return sum + Number(row?.[hrIndex] || 0);
  }, 0);

  return `
    <div class="team-block ${teamClass}">
      <h3>${teamName}</h3>
      <div class="team-inner">
        <table class="mini-table">
          <tr><th colspan="2">勝利</th></tr>
          ${winRows.join("")}
          <tr class="total-row"><td>合計</td><td>${winTotal}</td></tr>
        </table>
        <table class="mini-table">
          <tr><th colspan="2">本塁打</th></tr>
          ${hrRows.join("")}
          <tr class="total-row"><td>合計</td><td>${hrTotal}</td></tr>
        </table>
      </div>
    </div>
  `;
}

function calcTeamTotals(pitchers, batters, pitcherHeader, batterHeader) {
  const winIndex = pitcherHeader.indexOf("勝利");
  const hrIndex = batterHeader.indexOf("本塁打");

  return {
    win: [
      teamH_Pitchers.reduce(
        (s, n) => s + (pitchers.find((r) => r[0] === n)?.[winIndex] || 0),
        0,
      ),
      teamN_Pitchers.reduce(
        (s, n) => s + (pitchers.find((r) => r[0] === n)?.[winIndex] || 0),
        0,
      ),
      teamU_Pitchers.reduce(
        (s, n) => s + (pitchers.find((r) => r[0] === n)?.[winIndex] || 0),
        0,
      ),
      teamK_Pitchers.reduce(
        (s, n) => s + (pitchers.find((r) => r[0] === n)?.[winIndex] || 0),
        0,
      ),
    ],
    hr: [
      teamH_Batters.reduce(
        (s, n) => s + (batters.find((r) => r[0] === n)?.[hrIndex] || 0),
        0,
      ),
      teamN_Batters.reduce(
        (s, n) => s + (batters.find((r) => r[0] === n)?.[hrIndex] || 0),
        0,
      ),
      teamU_Batters.reduce(
        (s, n) => s + (batters.find((r) => r[0] === n)?.[hrIndex] || 0),
        0,
      ),
      teamK_Batters.reduce(
        (s, n) => s + (batters.find((r) => r[0] === n)?.[hrIndex] || 0),
        0,
      ),
    ],
  };
}

async function init() {
  const pitchers = await loadSheet("Pitchers");
  const pitcherHeader = [
    "選手名",
    "選手ID",
    "防御率",
    "登板",
    "先発",
    "完投",
    "完封",
    "無四球",
    "QS",
    "交代完了",
    "勝利",
    "敗戦",
    "ホールド",
    "HP",
    "セーブ",
    "勝率",
    "投球回",
    "最終更新",
  ];
  renderTable("pitchersTable", pitcherHeader, pitchers);

  const batters = await loadSheet("Batters");
  const batterHeader = [
    "選手名",
    "選手ID",
    "打率",
    "試合",
    "打席",
    "打数",
    "安打",
    "二塁打",
    "三塁打",
    "本塁打",
    "塁打",
    "打点",
    "得点",
    "三振",
    "最終更新",
  ];
  renderTable("battersTable", batterHeader, batters);

  const lastUpdate = pitchers[pitchers.length - 1][pitcherHeader.length - 1];
  document.getElementById("lastUpdate").textContent = `最終更新：${lastUpdate}`;

  const teamTables = document.getElementById("teamTables");
  teamTables.innerHTML = `
    ${renderTeamTable("Team はむ", teamH_Pitchers, teamH_Batters, pitchers, batters, pitcherHeader, batterHeader, "team-h")}
    ${renderTeamTable("Team ねこ", teamN_Pitchers, teamN_Batters, pitchers, batters, pitcherHeader, batterHeader, "team-n")}
    ${renderTeamTable("Team うさぎ", teamU_Pitchers, teamU_Batters, pitchers, batters, pitcherHeader, batterHeader, "team-u")}
    ${renderTeamTable("Team こい", teamK_Pitchers, teamK_Batters, pitchers, batters, pitcherHeader, batterHeader, "team-k")}
  `;

  const totals = calcTeamTotals(pitchers, batters, pitcherHeader, batterHeader);
  const labels = ["はむ", "ねこ", "うさぎ", "こい"];
  // ▼ グラフ全体の外枠を黒で描くプラグイン
  const chartBorder = {
    id: "chartBorder",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        chartArea.left,
        chartArea.top,
        chartArea.width,
        chartArea.height,
      );
      ctx.restore();
    },
  };
  const teamColors = {
    はむ: "#4a90e2", // 青
    ねこ: "#f5d742", // 黄
    うさぎ: "#f5a742", // オレンジ
    こい: "#e24a4a", // 赤
  };

  // ▼ 勝利ランキングを降順に並べ替える
  const winData = labels.map((label, i) => ({
    label,
    value: totals.win[i],
  }));

  winData.sort((a, b) => b.value - a.value);

  // 並べ替え後の配列を作り直す
  const sortedWinLabels = winData.map((d) => d.label);
  const sortedWinValues = winData.map((d) => d.value);
  const sortedWinColors = sortedWinLabels.map((label) => teamColors[label]);

  const hrData = labels.map((label, i) => ({
    label,
    value: totals.hr[i],
  }));

  hrData.sort((a, b) => b.value - a.value);

  const sortedHrLabels = hrData.map((d) => d.label);
  const sortedHrValues = hrData.map((d) => d.value);
  const sortedHrColors = sortedHrLabels.map((label) => teamColors[label]);

  Chart.register(chartBorder);

  new Chart(document.getElementById("winChart"), {
    type: "bar",
    data: {
      labels: sortedWinLabels,
      datasets: [
        {
          label: "勝利合計",
          data: sortedWinValues,
          backgroundColor: sortedWinColors,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { beginAtZero: true },
        y: { grid: { display: false } },
      },
    },
  });

  new Chart(document.getElementById("hrChart"), {
    type: "bar",
    data: {
      labels: sortedHrLabels,
      datasets: [
        {
          label: "本塁打合計",
          data: sortedHrValues,
          backgroundColor: sortedHrColors,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { beginAtZero: true },
        y: { grid: { display: false } },
      },
    },
  });

  // ▼ 管理者コメントを読み込む
  const admin = await loadSheet("Admin");
  const commentText = admin.map((r) => r[0]).join("\n");
  document.getElementById("adminComment").textContent = commentText;
}

init();
