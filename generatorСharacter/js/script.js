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

// Объект для хранения закрепленных полей
let lockedFields = {
    name: { locked: false, value: null },
    race: { locked: false, value: null },
    class: { locked: false, value: null },
    alignment: { locked: false, value: null },
    backstory: { locked: false, value: null },
    traits: { locked: false, value: null },
    ideals: { locked: false, value: null },
    attachments: { locked: false, value: null },
    weakness: { locked: false, value: null }
};

// Счетчик закрепленных полей
let lockedCount = 0;
const MAX_LOCKS = 3;

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
            bonusIndicator.textContent = `Бонусы распределены. Нажмите на характеристику для снятия бонуса`;
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
            // 2. ИЛИ у характеристики уже есть игровой бонус (для возможности удаления при повторном нажатии)
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

// Обновление счетчика закрепленных полей
const updateLockedCounter = () => {
    const counter = document.getElementById('locked-counter');
    counter.textContent = `Закреплено: ${lockedCount}/${MAX_LOCKS}`;
    
    // Меняем цвет в зависимости от количества закрепленных полей
    if (lockedCount === MAX_LOCKS) {
        counter.style.background = 'rgba(199, 154, 58, 0.6)';
        counter.style.borderColor = '#f5c95a';
        counter.style.color = '#f5c95a';
    } else {
        counter.style.background = 'rgba(199, 154, 58, 0.2)';
        counter.style.borderColor = '#c79a3a';
        counter.style.color = '#d9c97c';
    }
};

// Закрепление/открепление поля
const toggleLockField = (field) => {
    const lockBtn = document.querySelector(`.lock-btn[data-field="${field}"]`);
    const infoRow = document.querySelector(`.info-row[data-field="${field}"]`);
    const fieldElement = document.getElementById(getFieldElementId(field));
    
    // Если поле уже закреплено - открепляем
    if (lockedFields[field].locked) {
        lockedFields[field].locked = false;
        lockedFields[field].value = null;
        lockedCount--;
        
        lockBtn.classList.remove('locked');
        lockBtn.textContent = '🔓';
        lockBtn.title = 'Закрепить это поле';
        infoRow.classList.remove('locked');
        
        console.log(`Поле "${field}" откреплено. Закреплено полей: ${lockedCount}`);
    } 
    // Если поле не закреплено и можно закрепить (не превышен лимит)
    else if (lockedCount < MAX_LOCKS) {
        lockedFields[field].locked = true;
        lockedFields[field].value = fieldElement.textContent;
        lockedCount++;
        
        lockBtn.classList.add('locked');
        lockBtn.textContent = '🔒';
        lockBtn.title = 'Открепить это поле';
        infoRow.classList.add('locked');
        
        console.log(`Поле "${field}" закреплено со значением: "${fieldElement.textContent}". Закреплено полей: ${lockedCount}`);
    } 
    // Если пытаемся закрепить, но лимит исчерпан
    else {
        console.log(`Невозможно закрепить поле "${field}". Достигнут лимит в ${MAX_LOCKS} закрепленных полей.`);
        // Можно добавить визуальную обратную связь, например, анимацию
        lockBtn.style.animation = 'shake 0.5s';
        setTimeout(() => {
            lockBtn.style.animation = '';
        }, 500);
        return;
    }
    
    // Обновляем счетчик
    updateLockedCounter();
};

// Получение ID элемента по названию поля
const getFieldElementId = (field) => {
    switch(field) {
        case 'name': return 'char-name';
        case 'race': return 'char-race';
        case 'class': return 'char-class';
        case 'alignment': return 'char-alignment';
        case 'backstory': return 'char-backstory';
        case 'traits': return 'feat-character';
        case 'ideals': return 'feat-ideal';
        case 'attachments': return 'feat-attachment';
        case 'weakness': return 'feat-weakness';
        default: return '';
    }
};

// Получение названия поля по ID элемента
const getFieldNameFromId = (id) => {
    switch(id) {
        case 'char-name': return 'name';
        case 'char-race': return 'race';
        case 'char-class': return 'class';
        case 'char-alignment': return 'alignment';
        case 'char-backstory': return 'backstory';
        case 'feat-character': return 'traits';
        case 'feat-ideal': return 'ideals';
        case 'feat-attachment': return 'attachments';
        case 'feat-weakness': return 'weakness';
        default: return null;
    }
};

// Восстановление закрепленных значений
const restoreLockedFields = () => {
    for (const field in lockedFields) {
        if (lockedFields[field].locked && lockedFields[field].value) {
            const elementId = getFieldElementId(field);
            const element = document.getElementById(elementId);
            
            if (element) {
                element.textContent = lockedFields[field].value;
                
                // Особый случай: если закреплена раса, нужно обновить currentRace и currentSubrace
                if (field === 'race') {
                    // Находим расу по отображаемому значению
                    const raceValue = lockedFields[field].value;
                    // Это упрощенная логика - в реальности нужно парсить значение
                    // Предполагаем, что значение содержит только подрасу
                    currentSubrace = raceValue;
                    // Находим основную расу по подрасе
                    const data = window.characterData;
                    for (const raceKey in data.races) {
                        if (data.races[raceKey].subraces.includes(raceValue)) {
                            currentRace = raceKey;
                            break;
                        }
                    }
                }
            }
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

// Обработчик кликов на характеристики (только левая кнопка мыши)
const handleStatClick = (event) => {
    // Используем только левую кнопку мыши
    const statItem = event.currentTarget;
    const stat = statItem.getAttribute('data-stat');
    
    if (!stat || !characterStats[stat]) return;
    
    // Проверяем, можно ли взаимодействовать с этой характеристикой
    if (!statItem.classList.contains('selectable') || currentRace !== "Полуэльф") return;
    
    // Если у характеристики уже есть игровой бонус, снимаем его
    if (characterStats[stat].playerBonus === 1) {
        characterStats[stat].playerBonus = 0;
        halfElfRemainingBonuses++;
        console.log(`Убран бонус +1 с ${stat}. Осталось бонусов: ${halfElfRemainingBonuses}`);
    } 
    // Если нет игрового бонуса, но можно добавить
    else if (halfElfRemainingBonuses > 0 && 
             stat !== 'cha' && 
             characterStats[stat].raceBonus === 0 && 
             characterStats[stat].playerBonus === 0) {
        characterStats[stat].playerBonus = 1;
        halfElfRemainingBonuses--;
        console.log(`Добавлен бонус +1 к ${stat}. Осталось бонусов: ${halfElfRemainingBonuses}`);
    }
    
    // Обновляем отображение
    updateStatsDisplay();
};

// Генерация характеристик
const generateStats = () => {
    generateBaseStats();
    applyRaceBonuses();
    updateStatsDisplay();
};

// Генерация расы с учетом баланса
const generateRace = () => {
    // Если раса закреплена, возвращаем закрепленное значение
    if (lockedFields.race.locked && lockedFields.race.value) {
        return lockedFields.race.value;
    }
    
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
    // Если класс закреплен, возвращаем закрепленное значение
    if (lockedFields.class.locked && lockedFields.class.value) {
        return lockedFields.class.value;
    }
    
    const data = window.characterData;
    const classKeys = Object.keys(data.classes);
    const randomClassKey = getRandomElement(classKeys);
    const subclasses = data.classes[randomClassKey];
    const subclass = getRandomElement(subclasses);
    return `${randomClassKey} (${subclass})`;
};

// Генерация случайного элемента с учетом закрепленных полей
const generateField = (field, dataArray) => {
    // Если поле закреплено, возвращаем закрепленное значение
    if (lockedFields[field].locked && lockedFields[field].value) {
        return lockedFields[field].value;
    }
    
    return getRandomElement(dataArray);
};

// Генерация черт характера (3 случайные без повторов)
const generateTraits = () => {
    // Если черты закреплены, возвращаем закрепленное значение
    if (lockedFields.traits.locked && lockedFields.traits.value) {
        return lockedFields.traits.value;
    }
    
    const data = window.characterData;
    const shuffledTraits = [...data.characterTraits].sort(() => 0.5 - Math.random());
    return shuffledTraits.slice(0, 3).join(", ");
};

// Анимация генерации
const animateGeneration = () => {
    const resultTexts = document.querySelectorAll('.result-text');
    resultTexts.forEach(el => {
        // Не анимируем закрепленные поля
        const fieldName = getFieldNameFromId(el.id);
        if (!fieldName || !lockedFields[fieldName] || !lockedFields[fieldName].locked) {
            if (el.textContent !== '—') {
                el.style.opacity = '0.5';
                el.style.transition = 'opacity 0.3s ease';
            }
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
    
    // Анимация перед генерации (только для незакрепленных полей)
    animateGeneration();
    
    // Генерация основной информации о персонаже
    document.getElementById("char-name").textContent = generateField('name', data.names);
    document.getElementById("char-race").textContent = generateRace();
    document.getElementById("char-class").textContent = generateClass();
    document.getElementById("char-alignment").textContent = generateField('alignment', data.alignments);
    document.getElementById("char-backstory").textContent = generateField('backstory', data.backstories);
    
    // Черты характера
    document.getElementById("feat-character").textContent = generateTraits();
    
    // Остальные черты
    document.getElementById("feat-ideal").textContent = generateField('ideals', data.ideals);
    document.getElementById("feat-attachment").textContent = generateField('attachments', data.attachments);
    document.getElementById("feat-weakness").textContent = generateField('weakness', data.weaknesses);
    
    // Генерация характеристик
    generateStats();
    
    // Восстанавливаем закрепленные значения (на случай, если они были перезаписаны)
    restoreLockedFields();
    
    console.log("Сгенерирован персонаж с характеристиками");
    console.log(`Раса: ${currentRace} (${currentSubrace})`);
    console.log(`Закреплено полей: ${lockedCount}`);
};

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    console.log("Генератор персонажей D&D загружен!");
    console.log("Новая функция: Закрепление полей!");
    console.log("- Нажмите на замок 🔓 рядом с полем, чтобы закрепить его");
    console.log("- Можно закрепить до 3 полей одновременно");
    console.log("- Закрепленные поля не меняются при генерации");
    
    // Кнопка генерации персонажа
    document.getElementById("generate-character-btn").addEventListener("click", generateCharacterWithStats);
    
    // Кнопка генерации только характеристик
    document.getElementById("generate-stats-btn").addEventListener("click", generateStatsOnly);
    
    // Обработчики кликов на характеристики (только левая кнопка мыши)
    document.querySelectorAll('.stat-item').forEach(item => {
        item.addEventListener('click', handleStatClick);
    });
    
    // Обработчики кликов на кнопки замков
    document.querySelectorAll('.lock-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const field = btn.getAttribute('data-field');
            toggleLockField(field);
        });
    });
    
    // Показываем количество вариантов в консоли
    const data = window.characterData;
    const totalRaces = Object.values(data.races).flatMap(race => race.subraces).length;
    const totalClasses = Object.values(data.classes).flat().length;
    
    console.log(`Всего рас: ${Object.keys(data.races).length} основных, ${totalRaces} вариантов с подрасами`);
    console.log(`Всего классов: ${Object.keys(data.classes).length} основных, ${totalClasses} вариантов с подклассами`);
    console.log(`Всего имён: ${data.names.length}`);
    console.log(`Всего предысторий: ${data.backstories.length}`);
    
    // Инициализация счетчика закрепленных полей
    updateLockedCounter();
    
    // Генерация первого персонажа при загрузке
    generateCharacterWithStats();
    console.log("Автоматически сгенерирован первый персонаж при загрузке страницы");
});
