// Получаем элементы
const rollBtn = document.getElementById("roll-btn");
const resultText = document.getElementById("result-text");
const winsEl = document.getElementById("wins");
const lossesEl = document.getElementById("losses");
const resetBtn = document.getElementById("reset-btn");
const playerDice = document.getElementById("player-dice");
const enemyDice = document.getElementById("enemy-dice");
const playerScoreEl = document.getElementById("player-score");
const enemyScoreEl = document.getElementById("enemy-score");
localStorage.clear(); // сбрасывает всё при загрузке

// Загружаем счётчики
let wins = parseInt(localStorage.getItem("wins")) || 0;
let losses = parseInt(localStorage.getItem("losses")) || 0;

winsEl.textContent = wins;
lossesEl.textContent = losses;

// 🧙‍♂️ Бойцы
const fighters = [
    { emoji: "🐉", power: 8 }, { emoji: "🧙‍♂️", power: 7 },
    { emoji: "🤴", power: 7 }, { emoji: "🧞", power: 6 },
    { emoji: "🧛", power: 6 }, { emoji: "🦑", power: 6 },
    { emoji: "👹", power: 5 }, { emoji: "👻", power: 5 },
    { emoji: "🤺", power: 4 }, { emoji: "🧝", power: 4 },
    { emoji: "🧜‍♂️", power: 4 }, { emoji: "👳‍♂️", power: 4 },
    { emoji: "👼", power: 4 }, { emoji: "💂‍♀️", power: 3 },
    { emoji: "🕷️", power: 3 }, { emoji: "👾", power: 3 },
    { emoji: "🦂", power: 3 }, { emoji: "🤡", power: 2 },
    { emoji: "🐍", power: 2 }, { emoji: "👺", power: 2 },
    { emoji: "😈", power: 2 }, { emoji: "🐀", power: 1 },
    { emoji: "💀", power: 1 }, { emoji: "🧟", power: 1 },
    { emoji: "🦽", power: 0 }, { emoji: "🥶", power: -1 },
    { emoji: "🤢", power: -1 }, { emoji: "🥵", power: -1 },
];

// 🎲 Выбираем случайных бойцов
function getRandomFighters(count = 3) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(fighters[Math.floor(Math.random() * fighters.length)]);
    }
    return result;
}

// ⚔️ Бой
rollBtn.addEventListener("click", () => {
    const playerTeam = getRandomFighters();
    const enemyTeam = getRandomFighters();

    const playerPower = playerTeam.reduce((a, f) => a + f.power, 0);
    const enemyPower = enemyTeam.reduce((a, f) => a + f.power, 0);

    // Показываем бойцов в блоках
    playerDice.innerHTML = playerTeam.map(f => f.emoji).join(" ");
    enemyDice.innerHTML = enemyTeam.map(f => f.emoji).join(" ");

    playerScoreEl.textContent = playerPower;
    enemyScoreEl.textContent = enemyPower;

    // Результат
    if (playerPower > enemyPower) {
        wins++;
        resultText.innerHTML = `🏆 Победа! (${playerPower} vs ${enemyPower})`;
        resultText.style.color = "#ffd700";
    } else if (playerPower < enemyPower) {
        losses++;
        resultText.innerHTML = `💀 Поражение... (${playerPower} vs ${enemyPower})`;
        resultText.style.color = "#ff4a4a";
    } else {
        resultText.innerHTML = `🤝 Ничья! (${playerPower} vs ${enemyPower})`;
        resultText.style.color = "#e0b94a";
    }

    // Обновляем счётчики
    localStorage.setItem("wins", wins);
    localStorage.setItem("losses", losses);
    winsEl.textContent = wins;
    lossesEl.textContent = losses;
});

// 🔄 Сброс
resetBtn.addEventListener("click", () => {
    wins = 0;
    losses = 0;
    localStorage.setItem("wins", wins);
    localStorage.setItem("losses", losses);
    winsEl.textContent = wins;
    lossesEl.textContent = losses;
    playerDice.textContent = "";
    enemyDice.textContent = "";
    playerScoreEl.textContent = "0";
    enemyScoreEl.textContent = "0";
    resultText.textContent = "Счётчики сброшены!";
    resultText.style.color = "#e0b94a";
});
// 🧾 Таблица сил героев
const toggleTableBtn = document.getElementById("toggle-table");
const fightersTable = document.getElementById("fighters-table");
const fightersBody = document.getElementById("fighters-body");

// Создаём строки таблицы
function renderFightersTable() {
    fightersBody.innerHTML = fighters
        .sort((a, b) => b.power - a.power)
        .map(f => `<tr><td>${f.emoji}</td><td>${f.power}</td></tr>`)
        .join("");
}
renderFightersTable();

// Кнопка показать/скрыть
toggleTableBtn.addEventListener("click", () => {
    fightersTable.classList.toggle("hidden");
    toggleTableBtn.textContent = fightersTable.classList.contains("hidden")
        ? "📜 Показать таблицу сил"
        : "❌ Скрыть таблицу сил";

});


