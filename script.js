const [resetStopwatch, stopStopwatch] = initStopwatch();

class Field {

    static #title = document.querySelector("#title")
    static #fieldDiv = document.querySelector("#field")

    width;
    height;
    mineCount;
    revealed;
    finished;
    field;

    constructor(width, height, mineCount) {
        this.width = width;
        this.height = height;
        this.mineCount = mineCount;
        this.revealed = 0;
        this.finished = false;
        this.field = []
    }

    static clearField() {
        let child;
        while ((child = Field.#fieldDiv.firstChild))
            Field.#fieldDiv.removeChild(child);
    }

    reset() {
        Field.#title.innerText = "Browser Sweeper 💣"
        this.revealed = 0;
        this.finished = false;
        this.field = [];
        this.initializeField();
        this.plantMines();
        this.forEach((x, y) => {
            const slot = this.field[y][x];
            slot.surroundingMines = this.countSurroundingMines(x, y);
        })
        resetStopwatch();
    }

    initializeField() {
        Field.clearField();

        for (let y = 0; y < this.height; y++) {
            const row = [];
            const rowDiv = document.createElement('div');
            for (let x = 0; x < this.width; x++) {
                const slot = document.createElement('div');
                slot.className = (y * 11 + x) & 1 == 1 ? 'slot' : 'slot dark';
                slot.onclick = () => this.open(x, y, true);
                slot.oncontextmenu = (event) => {
                    event.preventDefault();
                    this.flag(x, y);
                }
                row[x] = {
                    x,
                    y,
                    isMine: false,
                    isFlagged: false,
                    isRevealed: false,
                    surroundingMines: 0,
                    ref: rowDiv.appendChild(slot)
                };
            }
            Field.#fieldDiv.appendChild(rowDiv);
            this.field[y] = row;
        }
    }

    plantMines() {
        let left = this.mineCount;
        while (left > 0) {
            const y = Math.floor(Math.random() * this.height);
            const x = Math.floor(Math.random() * this.width);
            const slot = this.field[y][x];
            if (slot.isMine)
                continue
            slot.isMine = true;
            left--;
        }
    }

    countSurroundingMines(x, y) {
        let found = 0;
        this.forEachAround(x, y, (offX, offY) => {
            const slot = this.field[offY][offX];
            if (slot.isMine)
                found++;
        })
        return found;
    }

    flag(x, y) {
        if (this.finished) {
            this.reset();
            return;
        }
        const slot = this.field[y][x];
        const ref = slot.ref;
        if (!slot.isFlagged && !slot.isRevealed) {
            slot.isFlagged = true;
            ref.innerText = '🚩'
        }
    }

    open(x, y, byPlayer) {
        if (this.finished) {
            this.reset();
            return;
        }
        const slot = this.field[y][x];
        const ref = slot.ref;
        if (!slot.isRevealed) {
            if (slot.isFlagged && byPlayer) {
                slot.isFlagged = false;
                ref.innerText = '';
                return;
            }
            if (slot.isMine && byPlayer) {
                this.markLose();
                return;
            }
            this.revealed++;
            slot.isRevealed = true;
            ref.classList.add('revealed')

            if (slot.surroundingMines == 0) {
                this.forEachAround(x, y, (offX, offY) => this.open(offX, offY, false))
            } else ref.innerText = `${slot.surroundingMines}`;

            if (this.revealed === this.width * this.height - this.mineCount)
                this.markWin();
        }
    }

    markWin() {
        Field.#title.innerText = "Browser Sweeper 🎉"
        this.finished = true;
        this.forEach((x, y) => {
            const slot = this.field[y][x];
            const ref = slot.ref;
            if (slot.isMine) {
                let flower;
                switch (Math.floor(Math.random() * 5)) {
                    case 0:
                        flower = '🌹';
                        break;
                    case 1:
                        flower = '🌼';
                        break;
                    case 2:
                        flower = '🌷';
                        break;
                    case 3:
                        flower = '🌸';
                        break;
                    default:
                        flower = '🌻';
                        break;
                }
                ref.innerText = flower;
            }
        })
        stopStopwatch();
    }

    markLose() {
        Field.#title.innerText = "Browser Sweeper 💥"
        this.finished = true;
        this.forEach((x, y) => {
            const slot = this.field[y][x];
            const ref = slot.ref;
            if (slot.isFlagged && !slot.isMine)
                ref.innerText = '❌'
            if (slot.isMine && !slot.isFlagged)
                ref.innerText = '💣'
        })
        stopStopwatch()
    }

    /**
     * @param {(x: number, y: number) => void} callback 
     */
    forEach(callback) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                callback(x, y);
            }
        }
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {(x: number, y: number) => void} callback 
     */
    forEachAround(x, y, callback) {
        for (let dy = -1; dy <= 1; dy++) {
            const offY = y + dy;
            if (offY < 0 || offY >= this.height)
                continue
            for (let dx = -1; dx <= 1; dx++) {
                if (dy === 0 && dx === 0)
                    continue;
                const offX = x + dx;
                if (offX < 0 || offX >= this.width)
                    continue
                callback(offX, offY);
            }
        }
    }
}

initPresets();

function initStopwatch() {
    const clock = document.querySelector("#clock")
    let lastIdentifier = undefined;
    let secondsElapsed = 0;

    const handler = () => clock.innerText = formatTime(secondsElapsed++);
    const start = () => {
        handler();
        lastIdentifier = setInterval(handler, 1000)
    }
    const stop = () => {
        if (lastIdentifier)
            clearInterval(lastIdentifier);
        lastIdentifier = undefined;
    }
    const reset = () => {
        secondsElapsed = 0;
        if (lastIdentifier)
            stop();
        start();
    }
    return [reset, stop]
}

function formatTime(secondsElapsed) {
    if (secondsElapsed > 0) {
        const seconds = secondsElapsed % 60;
        const minutes = Math.floor(secondsElapsed / 60);
        if (minutes < 60) {
            const secStr = seconds.toString()
                .padStart(2, '0');
            const minStr = minutes.toString()
                .padStart(2, '0');
            return `${minStr}:${secStr}`
        }
        return '...'
    }
    return '00:00'
}

function initPresets() {
    const presets = document.querySelectorAll("#presets > *")
    presets.forEach(child => {
        const { width, height, mineCount } = child.dataset;
        const field = new Field(+width, +height, +mineCount);
        child.onclick = () => field.reset();
    })
    presets[1].onclick();
}