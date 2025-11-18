class DiceGame {
    constructor() {
        // Инициализируем статистику ТОЛЬКО при создании игры
        this.wins = 0;
        this.losses = 0;
        
        this.initializeGame();
        this.bindEvents();
    }

    initializeGame() {
        this.playerBoard = this.createEmptyBoard();
        this.enemyBoard = this.createEmptyBoard();
        this.currentPlayer = 'player';
        this.currentDiceValue = null;
        this.gameOver = false;
        
        // НЕ сбрасываем wins и losses здесь!
        
        this.renderBoards();
        this.resetDiceDisplay();
        this.updateUI();
    }

    resetDiceDisplay() {
        const diceElement = document.getElementById('current-dice');
        const diceValueElement = document.getElementById('current-dice-value');
        
        diceElement.textContent = '?';
        diceValueElement.textContent = '-';
        this.currentDiceValue = null;
    }

    createEmptyBoard() {
        return {
            columns: [
                { cells: [null, null, null], score: 0 },
                { cells: [null, null, null], score: 0 },
                { cells: [null, null, null], score: 0 }
            ],
            totalScore: 0
        };
    }

    bindEvents() {
        document.getElementById('roll-dice').addEventListener('click', () => this.rollDice());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('toggle-rules').addEventListener('click', () => this.toggleRules());
        
        this.bindCellClickEvents();
    }

    bindCellClickEvents() {
        const playerBoard = document.getElementById('player-board');
        playerBoard.addEventListener('click', (e) => {
            if (this.currentPlayer !== 'player' || !this.currentDiceValue || this.gameOver) return;
            
            const cell = e.target.closest('.cell');
            if (cell && cell.classList.contains('highlight')) {
                const columnIndex = parseInt(cell.dataset.column);
                this.placeDice('player', columnIndex);
            }
        });
    }

    rollDice() {
        if (this.gameOver) return;
        
        const diceElement = document.getElementById('current-dice');
        const diceValueElement = document.getElementById('current-dice-value');
        
        // Анимация броска
        diceElement.classList.add('dice-rolling');
        diceElement.textContent = '?';
        
        // Блокируем кнопку сразу
        const rollBtn = document.getElementById('roll-dice');
        rollBtn.disabled = true;
        rollBtn.textContent = 'Размести кубик';
        
        setTimeout(() => {
            this.currentDiceValue = Math.floor(Math.random() * 6) + 1;
            diceElement.textContent = this.getDiceEmoji(this.currentDiceValue);
            diceValueElement.textContent = this.currentDiceValue;
            diceElement.classList.remove('dice-rolling');
            
            this.updateHighlightedCells();
            
            // Если ход противника, он автоматически размещает кубик
            if (this.currentPlayer === 'enemy') {
                setTimeout(() => this.enemyMove(), 1000);
            }
        }, 600);
    }

    getDiceEmoji(value) {
        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return diceEmojis[value - 1];
    }

    updateHighlightedCells() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlight');
        });
        
        if (this.currentPlayer === 'player' && this.currentDiceValue) {
            this.playerBoard.columns.forEach((column, columnIndex) => {
                if (column.cells.includes(null)) {
                    const emptyCellIndex = column.cells.findIndex(cell => cell === null);
                    const cellElement = document.querySelector(`#player-board .column:nth-child(${columnIndex + 1}) .cell:nth-child(${emptyCellIndex + 1})`);
                    if (cellElement) {
                        cellElement.classList.add('highlight');
                    }
                }
            });
        }
    }

    updateCombos(player) {
        const board = player === 'player' ? this.playerBoard : this.enemyBoard;
        const boardElement = document.getElementById(`${player}-board`);
        
        // Сначала убираем все классы комбо
        boardElement.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('combo-2', 'combo-3', 'combo-glow');
        });
        
        // Проверяем каждую колонку на комбинации
        board.columns.forEach((column, columnIndex) => {
            const values = column.cells.filter(cell => cell !== null);
            
            if (values.length === 0) return;
            
            // Считаем количество каждого значения
            const valueCounts = {};
            values.forEach(value => {
                valueCounts[value] = (valueCounts[value] || 0) + 1;
            });
            
            // Подсвечиваем комбинации
            Object.entries(valueCounts).forEach(([value, count]) => {
                if (count >= 2) {
                    // Находим все ячейки с этим значением в колонке
                    column.cells.forEach((cellValue, cellIndex) => {
                        if (cellValue === parseInt(value)) {
                            const cellElement = boardElement.querySelector(
                                `.column:nth-child(${columnIndex + 1}) .cell:nth-child(${cellIndex + 1})`
                            );
                            if (cellElement) {
                                if (count === 2) {
                                    cellElement.classList.add('combo-2');
                                } else if (count === 3) {
                                    cellElement.classList.add('combo-3');
                                }
                                cellElement.classList.add('combo-glow');
                            }
                        }
                    });
                }
            });
        });
        
        // Убираем анимацию через время
        setTimeout(() => {
            boardElement.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('combo-glow');
            });
        }, 500);
    }

    placeDice(player, columnIndex) {
        const board = player === 'player' ? this.playerBoard : this.enemyBoard;
        const column = board.columns[columnIndex];
        
        const cellIndex = column.cells.findIndex(cell => cell === null);
        if (cellIndex === -1) return false;
        
        column.cells[cellIndex] = this.currentDiceValue;
        
        this.updateColumnScore(player, columnIndex);
        this.destroyOpponentDice(player, columnIndex, this.currentDiceValue);
        this.updateTotalScore(player);
        this.animateDicePlacement(player, columnIndex, cellIndex);
        
        // ОБНОВЛЯЕМ КОМБО ПОСЛЕ РАЗМЕЩЕНИЯ
        this.updateCombos(player);
        
        // ОБНОВЛЯЕМ ИНТЕРФЕЙС ПЕРЕД ПРОВЕРКОЙ КОНЦА ИГРЫ
        this.updateUI();
        
        // ТЕПЕРЬ ПРОВЕРЯЕМ КОНЕЦ ИГРЫ
        if (this.checkGameEnd()) {
            this.endGame();
            return true;
        }
        
        // АВТОМАТИЧЕСКАЯ ПЕРЕДАЧА ХОДА
        if (player === 'player') {
            this.currentPlayer = 'enemy';
            this.currentDiceValue = null;
            this.resetDiceDisplay();
            this.updateUI();
            
            setTimeout(() => {
                this.rollDice();
            }, 800);
        } 
        else if (player === 'enemy') {
            this.currentPlayer = 'player';
            this.currentDiceValue = null;
            this.resetDiceDisplay();
            this.updateUI();
        }
        
        return true;
    }

    updateColumnScore(player, columnIndex) {
        const board = player === 'player' ? this.playerBoard : this.enemyBoard;
        const column = board.columns[columnIndex];
        const values = column.cells.filter(cell => cell !== null);
        
        if (values.length === 0) {
            column.score = 0;
            return;
        }
        
        const valueCounts = {};
        values.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        let columnScore = 0;
        
        Object.entries(valueCounts).forEach(([value, count]) => {
            const numValue = parseInt(value);
            if (count === 2) {
                columnScore += (numValue + numValue) * 2;
            } else if (count === 3) {
                columnScore += (numValue + numValue + numValue) * 3;
            } else {
                columnScore += numValue;
            }
        });
        
        column.score = columnScore;
        
        // ОБНОВЛЯЕМ КОМБО ПОСЛЕ ПЕРЕСЧЁТА ОЧКОВ
        this.updateCombos(player);
    }

    destroyOpponentDice(player, columnIndex, diceValue) {
        const opponent = player === 'player' ? 'enemy' : 'player';
        const opponentBoard = opponent === 'player' ? this.playerBoard : this.enemyBoard;
        const column = opponentBoard.columns[columnIndex];
        
        let destroyed = false;
        column.cells = column.cells.map((cell, index) => {
            if (cell === diceValue) {
                this.animateDiceDestruction(opponent, columnIndex, index);
                destroyed = true;
                return null;
            }
            return cell;
        });
        
        if (destroyed) {
            this.updateColumnScore(opponent, columnIndex);
            this.updateTotalScore(opponent);
            // ОБНОВЛЯЕМ КОМБО ПОСЛЕ УНИЧТОЖЕНИЯ
            this.updateCombos(opponent);
        }
    }

    animateDicePlacement(player, columnIndex, cellIndex) {
        const boardElement = document.getElementById(`${player}-board`);
        const cell = boardElement.querySelector(`.column:nth-child(${columnIndex + 1}) .cell:nth-child(${cellIndex + 1})`);
        
        cell.textContent = this.getDiceEmoji(this.currentDiceValue);
        cell.classList.add('dice-placed');
        setTimeout(() => cell.classList.remove('dice-placed'), 300);
    }

    animateDiceDestruction(player, columnIndex, cellIndex) {
        const boardElement = document.getElementById(`${player}-board`);
        const cell = boardElement.querySelector(`.column:nth-child(${columnIndex + 1}) .cell:nth-child(${cellIndex + 1})`);
        
        cell.classList.add('dice-destroyed');
        setTimeout(() => {
            cell.textContent = '';
            cell.classList.remove('dice-destroyed');
        }, 400);
    }

    // ===== УМНЫЙ БОТ С ТАКТИКОЙ =====
    enemyMove() {
        if (this.currentPlayer !== 'enemy' || !this.currentDiceValue || this.gameOver) return;
        
        let bestColumn = -1;
        let bestTotalScore = -Infinity;
        
        this.enemyBoard.columns.forEach((column, columnIndex) => {
            if (column.cells.includes(null)) {
                // 1. ОСНОВНАЯ ОЦЕНКА - потенциальный счёт
                const scoreEvaluation = this.evaluateColumnScore(column, this.currentDiceValue);
                
                // 2. ТАКТИКА РАЗРУШЕНИЯ - атака игрока
                const destructionEvaluation = this.evaluateDestructionPotential(columnIndex, this.currentDiceValue);
                
                // 3. ЗАЩИТА - избегание уязвимых позиций
                const defenseEvaluation = this.evaluateDefenseNeed(column, columnIndex, this.currentDiceValue);
                
                // 4. ДОЛГОСРОЧНОЕ ПЛАНИРОВАНИЕ - гибкость колонки
                const flexibilityEvaluation = this.evaluateColumnFlexibility(column, this.currentDiceValue);
                
                // ИТОГОВАЯ ОЦЕНКА с весами
                const totalScore = 
                    scoreEvaluation * 0.4 +           // 40% - немедленная выгода
                    destructionEvaluation * 0.3 +     // 30% - атака игрока
                    defenseEvaluation * 0.2 +         // 20% - защита
                    flexibilityEvaluation * 0.1;      // 10% - долгосрочная гибкость
                
                if (totalScore > bestTotalScore) {
                    bestTotalScore = totalScore;
                    bestColumn = columnIndex;
                }
            }
        });
        
        // Резервная стратегия - первая доступная колонка
        if (bestColumn === -1) {
            bestColumn = this.enemyBoard.columns.findIndex(column => column.cells.includes(null));
        }
        
        if (bestColumn !== -1) {
            this.placeDice('enemy', bestColumn);
        }
    }

    // 1. ОЦЕНКА ПОТЕНЦИАЛЬНОГО СЧЁТА (основная логика)
    evaluateColumnScore(column, diceValue) {
        const tempCells = [...column.cells];
        const emptyIndex = tempCells.findIndex(cell => cell === null);
        tempCells[emptyIndex] = diceValue;
        
        const currentScore = column.score;
        const valueCounts = {};
        tempCells.forEach(value => {
            if (value !== null) valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        let newScore = 0;
        Object.entries(valueCounts).forEach(([value, count]) => {
            const numValue = parseInt(value);
            if (count === 2) newScore += (numValue + numValue) * 2;
            else if (count === 3) newScore += (numValue + numValue + numValue) * 3;
            else newScore += numValue;
        });
        
        return newScore - currentScore;
    }

    // 2. ТАКТИКА РАЗРУШЕНИЯ - оценка потенциала атаки
    evaluateDestructionPotential(columnIndex, diceValue) {
        const playerColumn = this.playerBoard.columns[columnIndex];
        let destructionScore = 0;
        
        // Проверяем, сколько кубиков игрока мы уничтожим
        playerColumn.cells.forEach(cellValue => {
            if (cellValue === diceValue) {
                destructionScore += 10; // Большой бонус за уничтожение
            }
        });
        
        // Дополнительный бонус за разрушение комбо игрока
        const playerValues = playerColumn.cells.filter(cell => cell !== null);
        const playerValueCounts = {};
        playerValues.forEach(value => {
            playerValueCounts[value] = (playerValueCounts[value] || 0) + 1;
        });
        
        // Если разрушаем потенциальное комбо игрока
        Object.entries(playerValueCounts).forEach(([value, count]) => {
            if (parseInt(value) === diceValue) {
                if (count === 2) destructionScore += 15; // Очень выгодно разрушить комбо из 2
                if (count === 1) destructionScore += 5;  // Выгодно разрушить одиночный кубик
            }
        });
        
        return destructionScore;
    }

    // 3. ЗАЩИТА - оценка уязвимости позиции
    evaluateDefenseNeed(column, columnIndex, diceValue) {
        let defenseScore = 0;
        
        // Проверяем, создаём ли мы уязвимое комбо
        const tempCells = [...column.cells];
        const emptyIndex = tempCells.findIndex(cell => cell === null);
        tempCells[emptyIndex] = diceValue;
        
        // Если создаём комбо из 2 одинаковых - проверяем уязвимость
        const valueCounts = {};
        tempCells.forEach(value => {
            if (value !== null) valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        Object.entries(valueCounts).forEach(([value, count]) => {
            if (count === 2) {
                const numValue = parseInt(value);
                // Проверяем, может ли игрок легко уничтожить это комбо
                const playerHasThisValue = this.playerBoard.columns.some(playerColumn => 
                    playerColumn.cells.includes(numValue)
                );
                
                if (playerHasThisValue) {
                    defenseScore -= 8; // Штраф за создание уязвимого комбо
                } else {
                    defenseScore += 5; // Бонус за безопасное комбо
                }
            }
        });
        
        // Бонус за заполнение колонки (защита от будущих атак)
        if (tempCells.filter(cell => cell !== null).length === 3) {
            defenseScore += 3;
        }
        
        return defenseScore;
    }

    // 4. ДОЛГОСРОЧНОЕ ПЛАНИРОВАНИЕ - гибкость колонки
    evaluateColumnFlexibility(column, diceValue) {
        let flexibilityScore = 0;
        const currentValues = column.cells.filter(cell => cell !== null);
        const emptyCells = column.cells.filter(cell => cell === null).length;
        
        // Бонус за разнообразие значений (меньше уязвимости)
        const uniqueValues = new Set(currentValues);
        if (uniqueValues.size >= 2) {
            flexibilityScore += 3;
        }
        
        // Штраф за создание "моноколонки" (только один тип значения)
        const tempCells = [...column.cells];
        const emptyIndex = tempCells.findIndex(cell => cell === null);
        tempCells[emptyIndex] = diceValue;
        
        const tempUniqueValues = new Set(tempCells.filter(cell => cell !== null));
        if (tempUniqueValues.size === 1) {
            flexibilityScore -= 5; // Большой штраф за моноколонку
        }
        
        // Бонус за сохранение пустых ячеек для будущих ходов
        if (emptyCells > 1) {
            flexibilityScore += 2;
        }
        
        return flexibilityScore;
    }

    checkGameEnd() {
        const playerFull = !this.playerBoard.columns.some(column => column.cells.includes(null));
        const enemyFull = !this.enemyBoard.columns.some(column => column.cells.includes(null));
        
        return playerFull || enemyFull;
    }

    endGame() {
        this.gameOver = true;
        
        // ОБНОВЛЯЕМ ВСЕ СЧЕТА ПЕРЕД ВЫВОДОМ РЕЗУЛЬТАТА
        this.updateTotalScore('player');
        this.updateTotalScore('enemy');
        this.updateUI(); // ОБНОВЛЯЕМ ИНТЕРФЕЙС
        
        const playerScore = this.playerBoard.totalScore;
        const enemyScore = this.enemyBoard.totalScore;
        
        let resultText = '';
        if (playerScore > enemyScore) {
            resultText = '🏆 Победа!';
            this.wins++;
        } else if (playerScore < enemyScore) {
            resultText = '💀 Поражение...';
            this.losses++;
        } else {
            resultText = '🤝 Ничья!';
        }
        
        setTimeout(() => {
            alert(`${resultText}\nТвой счёт: ${playerScore}\nСчёт противника: ${enemyScore}`);
            this.updateUI(); // ЕЩЁ РАЗ ОБНОВЛЯЕМ ДЛЯ СЧЕТЧИКОВ ПОБЕД
        }, 500);
    }

    updateUI() {
        document.getElementById('player-total-score').textContent = this.playerBoard.totalScore;
        document.getElementById('enemy-total-score').textContent = this.enemyBoard.totalScore;
        
        document.getElementById('current-player').textContent = 
            this.currentPlayer === 'player' ? 'Твой ход' : 'Ход противника';
        
        // Обновляем кнопку броска
        const rollBtn = document.getElementById('roll-dice');
        if (this.gameOver) {
            rollBtn.disabled = true;
            rollBtn.textContent = 'Игра окончена';
        } else if (this.currentPlayer === 'player' && this.currentDiceValue === null) {
            // Ход игрока и кубик не брошен - кнопка ДОСТУПНА
            rollBtn.disabled = false;
            rollBtn.textContent = 'Бросить кубик';
        } else if (this.currentPlayer === 'player' && this.currentDiceValue !== null) {
            // Ход игрока, но кубик уже брошен - кнопка ЗАБЛОКИРОВАНА
            rollBtn.disabled = true;
            rollBtn.textContent = 'Размести кубик';
        } else {
            // Ход противника - кнопка ЗАБЛОКИРОВАНА
            rollBtn.disabled = true;
            rollBtn.textContent = 'Ход противника';
        }
        
        document.getElementById('wins').textContent = this.wins;
        document.getElementById('losses').textContent = this.losses;
        
        this.updateColumnScores();
        this.renderBoards();
    }

    updateColumnScores() {
        this.updatePlayerColumnScores();
        this.updateEnemyColumnScores();
    }

    updatePlayerColumnScores() {
        const scoresContainer = document.getElementById('player-column-scores');
        scoresContainer.innerHTML = '';
        
        this.playerBoard.columns.forEach((column, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'column-score';
            scoreElement.textContent = `К${index + 1}: ${column.score}`;
            scoresContainer.appendChild(scoreElement);
        });
    }

    updateEnemyColumnScores() {
        const scoresContainer = document.getElementById('enemy-column-scores');
        scoresContainer.innerHTML = '';
        
        this.enemyBoard.columns.forEach((column, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'column-score';
            scoreElement.textContent = `К${index + 1}: ${column.score}`;
            scoresContainer.appendChild(scoreElement);
        });
    }

    updateTotalScore(player) {
        const board = player === 'player' ? this.playerBoard : this.enemyBoard;
        board.totalScore = board.columns.reduce((total, column) => total + column.score, 0);
    }

    renderBoards() {
        this.renderPlayerBoard();
        this.renderEnemyBoard();
        // ОБНОВЛЯЕМ КОМБО ПРИ ПЕРЕРИСОВКЕ ДОСОК
        this.updateCombos('player');
        this.updateCombos('enemy');
    }

    renderPlayerBoard() {
        const boardElement = document.getElementById('player-board');
        boardElement.innerHTML = '';
        
        this.playerBoard.columns.forEach((column, columnIndex) => {
            const columnElement = document.createElement('div');
            columnElement.className = `column ${column.cells.every(cell => cell !== null) ? 'column-full' : ''}`;
            
            column.cells.forEach((cellValue, cellIndex) => {
                const cellElement = document.createElement('div');
                cellElement.className = `cell ${cellValue === null ? 'empty' : ''}`;
                cellElement.dataset.column = columnIndex;
                cellElement.dataset.cell = cellIndex;
                
                if (cellValue !== null) {
                    cellElement.textContent = this.getDiceEmoji(cellValue);
                }
                
                columnElement.appendChild(cellElement);
            });
            
            boardElement.appendChild(columnElement);
        });
    }

    renderEnemyBoard() {
        const boardElement = document.getElementById('enemy-board');
        boardElement.innerHTML = '';
        
        this.enemyBoard.columns.forEach((column, columnIndex) => {
            const columnElement = document.createElement('div');
            columnElement.className = `column ${column.cells.every(cell => cell !== null) ? 'column-full' : ''}`;
            
            column.cells.forEach((cellValue, cellIndex) => {
                const cellElement = document.createElement('div');
                cellElement.className = `cell ${cellValue === null ? 'empty' : ''}`;
                cellElement.dataset.column = columnIndex;
                cellElement.dataset.cell = cellIndex;
                
                if (cellValue !== null) {
                    cellElement.textContent = this.getDiceEmoji(cellValue);
                }
                
                columnElement.appendChild(cellElement);
            });
            
            boardElement.appendChild(columnElement);
        });
    }

    toggleRules() {
        const rulesPanel = document.getElementById('rules-panel');
        const toggleBtn = document.getElementById('toggle-rules');
        
        rulesPanel.classList.toggle('hidden');
        toggleBtn.textContent = rulesPanel.classList.contains('hidden') 
            ? '📜 Правила' 
            : '❌ Скрыть правила';
    }

    newGame() {
        this.initializeGame();
        this.resetDiceDisplay();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DiceGame();
});