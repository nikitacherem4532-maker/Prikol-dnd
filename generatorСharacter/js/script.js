// Главный файл генератора персонажей D&D

// Объект для хранения характеристик персонажа
let characterStats = {
    str: { base: 0, raceBonus: 0, playerBonus: 0 },
    dex: { base: 0, raceBonus: 0, playerBonus: 0 },
    con: { base: 0, raceBonus: 0, playerBonus: 0 },
    int: { base: 0, raceBonus: 0, playerBonus: 0 },
    wis: { base: 0, raceBonus: 0, playerBonus: 0 },
    cha: { base: 0, raceBonus: 0, playerBonus: 0 }
};

// Текущая раса и подраса
let currentRace = null;
let currentSubrace = null;

// Для полуэльфа: оставшиеся бонусы для распределения
let halfElfRemainingBonuses = 0;

// Вспомогательные функции
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const rollStat = () => {
    let rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    rolls.shift();
    return rolls.reduce((a, b) => a + b, 0);
};

// Получение бонусов расы
const getRaceBonuses = (race, subrace) => {
    const data = window.characterData;
    const raceData = data.races[race];
    let bonuses = {};
    
    if (!raceData) return bonuses;
    
    // Основные бонусы расы
    if (raceData.bonuses) {
        if (raceData.bonuses.all) {
            // +1 ко всем характеристикам (человек)
            bonuses = { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 };
        } else {
            Object.assign(bonuses, raceData.bonuses);
        }
    }
    
    // Бонусы подрасы
    if (raceData.subraceBonuses && raceData.subraceBonuses[subrace]) {
        Object.assign(bonuses, raceData.subraceBonuses[subrace]);
    }
    
    return bonuses;
};

// Обновление отображения характеристик
const updateStatsDisplay = () => {
    const bonusIndicator = document.getElementById('bonus-indicator');
    
    // Обновляем текст индикатора
    if (currentRace === "Полуэльф") {
        if (halfElfRemainingBonuses > 0) {
            bonusIndicator.textContent = `Распределите: +1, +1 (осталось: ${halfElfRemainingBonuses})`;
        } else {
            bonusIndicator.textContent = `Бонусы распределены. ПКМ венруть бонус`;
        }
        bonusIndicator.style.display = 'inline';
    } else {
        bonusIndicator.textContent = "";
        bonusIndicator.style.display = 'none';
    }
    
    // Обновляем значения характеристик
    for (const stat in characterStats) {
        const statItem = document.querySelector(`.stat-item[data-stat="${stat}"]`);
        const valueElement = statItem.querySelector('.stat-value');
        const bonusElement = statItem.querySelector('.stat-bonus');
        
        const total = characterStats[stat].base + characterStats[stat].raceBonus + characterStats[stat].playerBonus;
        valueElement.textContent = total;
        
        // Отображаем общий бонус (расовый + игровой)
        const totalBonus = characterStats[stat].raceBonus + characterStats[stat].playerBonus;
        if (totalBonus !== 0) {
            bonusElement.textContent = totalBonus > 0 ? `+${totalBonus}` : `${totalBonus}`;
            
            // Показываем разбивку бонусов при наведении
            let bonusTooltip = `Расовый бонус: +${characterStats[stat].raceBonus}`;
            if (characterStats[stat].playerBonus > 0) {
                bonusTooltip += `, Игровой бонус: +${characterStats[stat].playerBonus}`;
            }
            bonusElement.title = bonusTooltip;
        } else {
            bonusElement.textContent = ""; // Пустая строка вместо +0
            bonusElement.title = "";
        }
        
        // Управляем классом selectable для характеристик
        if (currentRace === "Полуэльф") {
            // Характеристика может быть выбрана, если:
            // 1. Есть оставшиеся бонусы И у характеристики нет расового бонуса (кроме харизмы) И нет игрового бонуса
            // 2. ИЛИ у характеристики уже есть игровой бонус (для возможности удаления)
            const canAddBonus = halfElfRemainingBonuses > 0 && 
                               stat !== 'cha' && 
                               characterStats[stat].raceBonus === 0 && 
                               characterStats[stat].playerBonus === 0;
            
            const hasPlayerBonus = characterStats[stat].playerBonus > 0;
            
            if (canAddBonus || hasPlayerBonus) {
                statItem.classList.add('selectable');
                
                // Если есть игровой бонус, показываем это через CSS класс
                if (hasPlayerBonus) {
                    statItem.classList.add('with-player-bonus');
                } else {
                    statItem.classList.remove('with-player-bonus');
                }
            } else {
                statItem.classList.remove('selectable', 'with-player-bonus');
            }
        } else {
            statItem.classList.remove('selectable', 'with-player-bonus');
        }
    }
};

// Генерация базовых характеристик
const generateBaseStats = () => {
    // Генерируем базовые значения
    characterStats.str.base = rollStat();
    characterStats.dex.base = rollStat();
    characterStats.con.base = rollStat();
    characterStats.int.base = rollStat();
    characterStats.wis.base = rollStat();
    characterStats.cha.base = rollStat();
    
    // Сбрасываем все бонусы
    for (const stat in characterStats) {
        characterStats[stat].raceBonus = 0;
        characterStats[stat].playerBonus = 0;
    }
    
    // Сбрасываем оставшиеся бонусы полуэльфа
    halfElfRemainingBonuses = 0;
};

// Применение расовых бонусов
const applyRaceBonuses = () => {
    if (!currentRace || !currentSubrace) return;
    
    const bonuses = getRaceBonuses(currentRace, currentSubrace);
    
    // Сбрасываем расовые бонусы
    for (const stat in characterStats) {
        characterStats[stat].raceBonus = 0;
    }
    
    // Применяем новые расовые бонусы
    for (const stat in bonuses) {
        if (characterStats[stat]) {
            characterStats[stat].raceBonus = bonuses[stat];
        }
    }
    
    // Особый случай: для полуэльфа устанавливаем начальное количество бонусы
    if (currentRace === "Полуэльф") {
        halfElfRemainingBonuses = 2;
        console.log("Полуэльф: доступно 2 бонуса +1 для распределения");
    }
};

// Обработчик кликов на характеристики
const handleStatClick = (event) => {
    event.preventDefault(); // Предотвращаем стандартное поведение контекстного меню для ПКМ
    
    const statItem = event.currentTarget;
    const stat = statItem.getAttribute('data-stat');
    
    if (!stat || !characterStats[stat]) return;
    
    // Проверяем, можно ли взаимодействовать с этой характеристикой
    if (!statItem.classList.contains('selectable') || currentRace !== "Полуэльф") return;
    
    // ЛКМ - добавить бонус
    if (event.button === 0) { // Левая кнопка мыши
        // Проверяем условия для добавления бонуса
        const canAddBonus = halfElfRemainingBonuses > 0 && 
                           stat !== 'cha' && 
                           characterStats[stat].raceBonus === 0 && 
                           characterStats[stat].playerBonus === 0;
        
        if (canAddBonus) {
            characterStats[stat].playerBonus = 1;
            halfElfRemainingBonuses--;
            console.log(`Добавлен бонус +1 к ${stat}. Осталось бонусов: ${halfElfRemainingBonuses}`);
            updateStatsDisplay();
        }
    }
    // ПКМ - убрать бонус
    else if (event.button === 2) { // Правая кнопка мыши
        // Проверяем условия для удаления бонуса
        if (characterStats[stat].playerBonus === 1) {
            characterStats[stat].playerBonus = 0;
            halfElfRemainingBonuses++;
            console.log(`Убран бонус +1 с ${stat}. Осталось бонусов: ${halfElfRemainingBonuses}`);
            updateStatsDisplay();
        }
    }
};

// Генерация характеристик
const generateStats = () => {
    generateBaseStats();
    applyRaceBonuses();
    updateStatsDisplay();
};

// Генерация расы с учетом баланса
const generateRace = () => {
    const data = window.characterData;
    const raceKeys = Object.keys(data.races);
    const randomRaceKey = getRandomElement(raceKeys);
    const subraces = data.races[randomRaceKey].subraces;
    const subrace = getRandomElement(subraces);
    
    // Сохраняем текущую расу
    currentRace = randomRaceKey;
    currentSubrace = subrace;
    
    return subrace;
};

// Генерация класса с учетом баланса
const generateClass = () => {
    const data = window.characterData;
    const classKeys = Object.keys(data.classes);
    const randomClassKey = getRandomElement(classKeys);
    const subclasses = data.classes[randomClassKey];
    const subclass = getRandomElement(subclasses);
    return `${randomClassKey} (${subclass})`;
};

// Анимация генерации
const animateGeneration = () => {
    const resultTexts = document.querySelectorAll('.result-text');
    resultTexts.forEach(el => {
        if (el.textContent !== '—') {
            el.style.opacity = '0.5';
            el.style.transition = 'opacity 0.3s ease';
        }
    });
    
    setTimeout(() => {
        resultTexts.forEach(el => {
            el.style.opacity = '1';
        });
    }, 300);
};

// Генерация ТОЛЬКО характеристик (без персонажа)
const generateStatsOnly = () => {
    // Для полуэльфа сбрасываем игровые бонусы при новой генерации
    if (currentRace === "Полуэльф") {
        for (const stat in characterStats) {
            characterStats[stat].playerBonus = 0;
        }
        halfElfRemainingBonuses = 2;
    }
    
    generateStats();
    console.log("Сгенерированы только характеристики");
    console.log(`Текущая раса: ${currentRace} (${currentSubrace})`);
};

// Генерация персонажа с характеристиками
const generateCharacterWithStats = () => {
    const data = window.characterData;
    
    // Анимация перед генерации
    animateGeneration();
    
    // Генерация основной информации о персонаже
    document.getElementById("char-name").textContent = getRandomElement(data.names);
    document.getElementById("char-race").textContent = generateRace();
    document.getElementById("char-class").textContent = generateClass();
    document.getElementById("char-alignment").textContent = getRandomElement(data.alignments);
    document.getElementById("char-backstory").textContent = getRandomElement(data.backstories);
    
    // Черты характера (3 случайные без повторов)
    const shuffledTraits = [...data.characterTraits].sort(() => 0.5 - Math.random());
    const threeTraits = shuffledTraits.slice(0, 3).join(", ");
    document.getElementById("feat-character").textContent = threeTraits;
    
    // Остальные черты
    document.getElementById("feat-ideal").textContent = getRandomElement(data.ideals);
    document.getElementById("feat-attachment").textContent = getRandomElement(data.attachments);
    document.getElementById("feat-weakness").textContent = getRandomElement(data.weaknesses);
    
    // Генерация характеристик
    generateStats();
    
    console.log("Сгенерирован персонаж с характеристиками");
    console.log(`Раса: ${currentRace} (${currentSubrace})`);
};

// Основная функция генерации (выбирает в зависимости от переключателя)
const generateCharacter = () => {
    const generateStatsToggle = document.getElementById("generate-stats-toggle");
    
    if (generateStatsToggle.checked) {
        // Если переключатель ВКЛ - генерируем ТОЛЬКО характеристики
        generateStatsOnly();
    } else {
        // Если переключатель ВЫКЛ - генерируем персонажа С характеристиками
        generateCharacterWithStats();
    }
};

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    console.log("Генератор персонажей D&D загружен!");
    console.log("Логика переключателя:");
    console.log("- ВКЛ (checked): ТОЛЬКО характеристики (без генерации персонажа)");
    console.log("- ВЫКЛ (unchecked): персонаж С характеристиками");
    
    // Кнопка генерации
    document.getElementById("generate-btn").addEventListener("click", generateCharacter);
    
    // Обработчики кликов на характеристики
    document.querySelectorAll('.stat-item').forEach(item => {
        // ЛКМ
        item.addEventListener('click', handleStatClick);
        // ПКМ
        item.addEventListener('contextmenu', handleStatClick);
    });
    
    // Переключатель
    const toggle = document.getElementById("generate-stats-toggle");
    const toggleText = document.querySelector('.toggle-text');
    
    // Функция обновления внешнего вида переключателя
    const updateToggleAppearance = () => {
        // Текст всегда остается "Генерация характеристик"
        toggleText.textContent = "Генерация характеристик";
        
        if (toggle.checked) {
            toggleText.style.color = '#c79a3a';
            toggleText.style.textShadow = '0 0 5px rgba(199, 154, 58, 0.5)';
        } else {
            toggleText.style.color = '#f5e7a1';
            toggleText.style.textShadow = 'none';
        }
    };
    
    // Обновляем при загрузке (переключатель по умолчанию выключен)
    updateToggleAppearance();
    
    // Обновляем при изменении
    toggle.addEventListener("change", function() {
        updateToggleAppearance();
        
        const status = this.checked ? "ВКЛ: только характеристики" : "ВЫКЛ: персонаж с характеристиками";
        console.log(`Режим генерации: ${status}`);
    });
    
    // Показываем количество вариантов в консоли
    const data = window.characterData;
    const totalRaces = Object.values(data.races).flatMap(race => race.subraces).length;
    const totalClasses = Object.values(data.classes).flat().length;
    
    console.log(`Всего рас: ${Object.keys(data.races).length} основных, ${totalRaces} вариантов с подрасами`);
    console.log(`Всего классов: ${Object.keys(data.classes).length} основных, ${totalClasses} вариантов с подклассами`);
    console.log(`Всего имён: ${data.names.length}`);
    console.log(`Всего предысторий: ${data.backstories.length}`);
    
    // Генерация первого персонажа при загрузке (по умолчанию выключено - персонаж с характеристиками)
    if (!toggle.checked) {
        generateCharacterWithStats();
        console.log("Автоматически сгенерирован первый персонаж");
    }
});