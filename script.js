
const mainMenu = document.getElementById("mainMenu");
const gameScreen = document.getElementById("gameScreen");
const pauseMenu = document.getElementById("pause");
const gameOverMenu = document.getElementById("over");
const victoryMenu = document.getElementById("victory");
const healthValue = document.getElementById("hValue");
const livesValue = document.getElementById("lValue");
const levelValue = document.getElementById("levelValue");
const compassValue = document.getElementById("compValue");
const messageLog = document.getElementById("messageLog");
const combatMenu = document.getElementById("combat");
const enemyInfo = document.getElementById("enemy");
const livesMessage = document.getElementById("lives");
const forwardView = document.getElementById("fView");
const leftView = document.getElementById("lView");
const rightView = document.getElementById("rView");
const miniMap = document.getElementById("mini");


document.getElementById("new").addEventListener("click" , newGame);
document.getElementById("load").addEventListener("click" , loadGame);
document.getElementById("pauseBtn").addEventListener("click" , togglePause);
document.getElementById("resume").addEventListener("click" , togglePause);
document.getElementById("quit").addEventListener("click" , quitToMenu);
document.getElementById("cont").addEventListener("click" , continueDeath);
document.getElementById("mainMenu").addEventListener("click" , quitToMenu);
document.getElementById("nextLevel").addEventListener("click" , nextLevel);
document.getElementById("fwd").addEventListener("click" , moveForward);
document.getElementById("bwd").addEventListener("click" , moveBackward);
document.getElementById("left").addEventListener("click" , () => turn(-1));
document.getElementById("right").addEventListener("click" , () => turn(1));
document.getElementById("atk").addEventListener("click" , () => performAction("attack"));
document.getElementById("def").addEventListener("click" , () => performAction("defend"));
document.getElementById("run").addEventListener("click" , () => performAction("flee"));

//Initial Game State

const gameState = {

    currentScreen: "mainMenu" ,
    isPaused: false , 
    gameOver: false ,
    level: 1 ,
    health: 100 ,
    maxHealth: 100 ,
    lives: 3 ,
    playerDirection: 0 , // 0-N , 1-E , 2-S , 3-W
    inCombat: false ,
    currentEnemy: null ,
    dungeon: [] ,
    playerPosition: {x: 0 , y: 0} ,
    exitPosition: {x: 0 , y: 0} ,
    discovered: [] ,
    visited: [] ,
    savedGame: null
};

const directions = ["North" , "East" , "South" , "West"];

//Art
const assets = {
    wall: wallTexture() ,
    corridor: corridorTexture() ,
    enemy: enemyTexture() ,
    health: healthTexture() ,
    exit: exitTexture()
};



//ViewArea

function renderViews() {
    forwardView.innerHTML = "";
    leftView.innerHTML = "";
    rightView.innerHTML = "";


const forwardPerspective = document.createElement("div");
forwardPerspective.className = "perspective";
forwardView.appendChild(forwardPerspective);

const leftPerspective = document.createElement("div");
leftPerspective.className = "perspective";
leftView.appendChild(leftPerspective);

const rightPerspective = document.createElement("div");
rightPerspective.className = "perspective";
rightView.appendChild(rightPerspective);

//Positioning

const forward = getDirection(gameState.playerDirection);
const left = getDirection((gameState.playerDirection + 3) % 4);
const right = getDirection((gameState.playerDirection +1) % 4);

renderView(forwardPerspective , forward , true);
renderView(leftPerspective , left , false);
renderView(rightPerspective , right , false);


//MapDiscovery
markDiscovered(forward.x , forward.y);
markDiscovered(left.x , left.y);
markDiscovered(right.x , right.y);


updateMap();

}

checkSavedGame();

function getDirection(direction) {
    const directions = [
        {x: 0 , y: -1} , //North
        {x: 1 , y: 0} , //East
        {x: 0 , y: 1} , //South
        {x: -1 , y: 0}  //West
    ];

    const dir = directions[direction % 4];

    return {
        x: gameState.playerPosition.x + dir.x ,
        y: gameState.playerPosition.y + dir.y
    };
}


function updateHUD() {
    healthValue.textContent = gameState.health;
    livesValue.textContent = gameState.lives;
    levelValue.textContent = gameState.level;
    compassValue.textContent = directions[gameState.playerDirection];
}

function addMessage(message) {

    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageLog.appendChild(messageElement);
    messageLog.scrollTop = messageLog.scrollHeight;
}


//Dungeon Generation

function generateDungeon() {
    const size = 5 + gameState.level * 2;
    const maxSize = 15;
    const finalSize = size > maxSize ? maxSize : size;

    gameState.dungeon = [];
    gameState.discovered = Array(finalSize).fill().map(() => Array(finalSize).fill(false));
    gameState.visited = Array(finalSize).fill().map(() => Array(finalSize).fill(false));

    for (let y = 0; y < finalSize; y++) {
        gameState.dungeon[y] = [];

        for (let x = 0; x < finalSize; x++) {
            if(x === 0 || y === 0 || x === finalSize - 1 || y === finalSize - 1) {
                gameState.dungeon[y][x] = 1;

            } else {

                const rnd = Math.random();

                    if(rnd < 0.2) {
                        gameState.dungeon[y][x] = 1;  //Wall

                    } else if(rnd < 0.35) {
                        gameState.dungeon[y][x] = 2;  //Enemy
    
                    } else if(rnd < 0.4) {
                        gameState.dungeon[y][x] = 3;  //Health
                    
                    } else {
                        gameState.dungeon[y][x] = 0;  //Empty
                    }
                }
            }
        }

        gameState.playerPosition = {
            x: Math.floor(finalSize / 2),
            y: 1
        };

        gameState.dungeon[gameState.playerPosition.y][gameState.playerPosition.x] = 0;

        let exitX , exitY;
            do{
                exitX = Math.floor(Math.random() * (finalSize - 2)) +1;
                exitY = Math.floor(Math.random() * (finalSize - 2)) +1;
            } while (
                (Math.abs(exitX - gameState.playerPosition.x) < 3 &&
                Math.abs(exitY - gameState.playerPosition.y) < 3)
            );

        gameState.exitPosition = {x: exitX , y: exitY};
        gameState.dungeon[gameState.exitPosition.y][gameState.exitPosition.x] = 4;

        markDiscovered(gameState.playerPosition.x , gameState.playerPosition.y);
        markVisited(gameState.playerPosition.x , gameState.playerPosition.y);
    }


//Map

function updateMap() {
    miniMap.innerHTML = "";

    gameState.dungeon.forEach((row , y) => {
        const rowEl = document.createElement("div");
        rowEl.className = "mapRow";
    

    row.forEach((cell , x) => {
        const cellEl = document.createElement("div");
        cellEl.className = "mapCell";

            if(!gameState.discovered[y][x]) {
                cellEl.classList.add("unknown");

            } else {
                
                cellEl.classList.add("discovered");

            if(x === gameState.playerPosition.x && y === gameState.playerPosition.y) {
                cellEl.classList.add("current");

            } else if (cell === 1) {
                cellEl.classList.add("wall");

            } else if (cell === 4) {
                cellEl.classList.add("exit");
            }
        }

        rowEl.appendChild(cellEl);
        });
        miniMap.appendChild(rowEl)
    });
}

function markDiscovered(x , y) {
    if(y >= 0 && y < gameState.discovered.length && x >= 0 && x < gameState.discovered[0].length) {
        gameState.discovered[y][x] = true;

        for(let unkY = -1; unkY <= 1; unkY++) {
            for(let unkX = -1; unkX <= 1; unkX++) {
                let disX = x + unkX; 
                let disY = y + unkY; 

                 if(disX >= 0 && disY >= 0 && disX < gameState.discovered[0].length && disY < gameState.discovered.length) {
                        gameState.discovered[disY][disX] = true;
                    }
            }
        }
    }
}

function markVisited(x , y) {

    if(y >= 0 && y < gameState.visited.length && x >= 0 && x < gameState.visited[0].length) {
        gameState.visited[y][x] = true;
    }
}


//Art

function wallTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#333";
    ctx.fillRect(0 , 0 , 200 , 200);

    ctx.strokeStyle = "#222";
        for (let i = 0; i < 10; i++) {
            ctx.strokeRect(Math.random() * 200 , Math.random() * 200 , 20 + Math.random() * 60 , 20 + Math.random() * 60);
        }

        return canvas.toDataURL();
}

function corridorTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#111";
    ctx.fillRect(0 , 0 , 200 , 200);

    return canvas.toDataURL();
}

function enemyTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#300";
    ctx.fillRect(0 , 0 , 200 , 200);

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(100 , 70 , 30 , 0 , Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f00";
    ctx.beginPath();
    ctx.moveTo(70 , 120);
    ctx.lineTo(130 , 120);
    ctx.lineTo(100 , 170);
    ctx.fill();

    return canvas.toDataURL();
}

function healthTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#030";
    ctx.fillRect(0 , 0 , 200 , 200);

    ctx.fillStyle = "#0f0";
    ctx.fillRect(60 , 30 , 80 , 140);
    ctx.fillRect(30 , 70 , 140 , 60);

    return canvas.toDataURL();
}

function exitTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#003";
    ctx.fillRect(0 , 0 , 200 , 200);

    ctx.fillStyle = "#0af";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("EXIT" , 100, 100);

    return canvas.toDataURL();
}

checkSavedGame();

//Visuals

function renderView(container , position , isForward) {

    if(position.x < 0 || position.y < 0 || position.y >= gameState.dungeon.length || position.x >= gameState.dungeon[0].length) {
        
        const wall = document.createElement("div");
        wall.className = "three-d-wall";
        wall.style.backgroundImage = `url(${assets.wall})`;
        container.appendChild(wall);
        return;
    }

    const cellValue = gameState.dungeon[position.y][position.x];
    const view = document.createElement("div");

    switch(cellValue) {

        case 0: //Empty Corridor
            view.className = isForward ? "three-d-corridor-forward" : "three-d-corridor-side";
            view.style.background = "linear-gradient(to bottom , #111 , #000)";
            container.appendChild(view);
            break;

        case 1: // Wall
            view.className = "three-d-wall";
            view.style.backgroundImage = `url(${assets.wall})`;
            container.appendChild(view);
            break;

        case 2: // Enemy

            if (isForward) {
                view.className = "three-d-enemy-forward";

            } else {
                
                view.className = "three-d-enemy-side";
            }

            view.style.backgroundImage = `url(${assets.enemy})`;
            container.appendChild(view);
            break;

        case 3: // Health
            view.className = isForward ? "three-d-item-forward" : "three-d-item-side";
            view.style.backgroundImage = `url(${assets.health})`;
            container.appendChild(view);
            break;
            
        case 4: // Exit
            view.className = isForward ? "three-d-exit-forward" : "three-d-exit-side";
            view.style.backgroundImage = `url(${assets.exit})`;
            container.appendChild(view);
            break;
    }
}

//Menus

function checkSavedGame() {
    const savedGame = localStorage.getItem("gameSave");

        if(savedGame) {
            gameState.savedGame = JSON.parse(savedGame);
            document.getElementById("load").disabled = false;
        } else {
            document.getElementById("load").disabled = true;
        }
}

function newGame() {
    gameState.level = 1;
    gameState.health = 100;
    gameState.lives = 3;
    gameState.playerDirection = 2;
    gameState.inCombat = false;
    gameState.discovered = [];
    gameState.visited = [];

    localStorage.removeItem("gameSave");
    gameState.savedGame = null;

    generateDungeon();
    updateMap();

    setTimeout(() => {
        showGameScreen();
        saveGame();
        checkSavedGame();
    }, 100); 
}


function showGameScreen() {
    gameState.isPaused = false;
    mainMenu.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    pauseMenu.classList.add("hidden");
    gameOverMenu.classList.add("hidden");
    victoryMenu.classList.add("hidden");
    

    updateHUD();
    renderViews();
    updateMap();
    addMessage("You Enter the Dungeon...")
}

function loadGame() {
    if(gameState.savedGame) {
        Object.assign(gameState , gameState.savedGame);

    if(!gameState.discovered)gameState.discovered = [];
    if(!gameState.visited)gameState.visited = [];

    gameState.inCombat = false;
    gameState.currentEnemy = null;

    combatMenu.classList.add("hidden");
    pauseMenu.classList.add("hidden");

    showGameScreen();
    addMessage("Game Loaded");

    renderViews();
    updateHUD();
    updateMap();
    }
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    pauseMenu.classList.toggle("hidden" , !gameState.isPaused);
    gameScreen.classList.toggle("blurred" , gameState.isPaused);

    if(!gameState.isPaused) {
        saveGame();
        addMessage("Game Saved");
        renderViews();
        updateHUD();
        updateMap();
    }
}

function saveGame() {
    const saveData = {

        level: gameState.level ,
        health: gameState.health ,
        lives: gameState.lives ,
        playerDirection: gameState.playerDirection ,
        dungeon: gameState.dungeon ,
        playerPosition: gameState.playerPosition ,
        exitPosition: gameState.exitPosition ,
        discovered: gameState.discovered ,
        visited: gameState.visited
    };

    localStorage.setItem("gameSave" , JSON.stringify(saveData));
    gameState.savedGame = saveData;
    addMessage("Game Saved");
}

function quitToMenu() {
    saveGame();

        gameScreen.classList.add("hidden");
        mainMenu.classList.remove("hidden");
        pauseMenu.classList.add("hidden");
        gameOverMenu.classList.add("hidden");
        victoryMenu.classList.add("hidden");

    checkSavedGame();
}


//Movement


function movePosition(newPos) {
    if(newPos.x < 0 || newPos.y < 0 || newPos.y >= gameState.dungeon.length || newPos.x >= gameState.dungeon[0].length) {
        addMessage("You Cannot Walk Through Walls");
        return
    }

    const cellValue = gameState.dungeon[newPos.y][newPos.x];

    switch(cellValue) {

        case 0:
            gameState.playerPosition = newPos;
            markVisited(newPos.x , newPos.y);
            addMessage("You Move Forward");
            break;

        case 1:
            addMessage("You Cannot Walk Through Walls");
            break;

        case 2:
            startCombat(newPos);
            break;

        case 3:
            gameState.playerPosition = newPos;
            markVisited(newPos.x , newPos.y);
            gameState.dungeon[newPos.y][newPos.x] = 0;
            gameState.health = Math.min(gameState.health + 30 , gameState.maxHealth);
            addMessage("You Drink a Health Potion Restoring 30 Health");
            break;

        case 4:
            gameState.playerPosition = newPos;
            markVisited(newPos.x, newPos.y);
            levelComplete();
            break;
    }

    updateHUD();
    renderViews();
}



function moveForward() {
    if(gameState.isPaused || gameState.inCombat) 
        return;

    const newPos = getDirection(gameState.playerDirection);
    movePosition(newPos);
}

function moveBackward() {
    if(gameState.isPaused || gameState.inCombat) 
        return;

    const OppDir = (gameState.playerDirection + 2) % 4 ;
    const newPos = getDirection(OppDir);
    movePosition(newPos);
}

function turn(direction) {
    if(gameState.isPaused || gameState.inCombat)
        return;

    gameState.playerDirection = (gameState.playerDirection + direction + 4) % 4;
    addMessage(`You Turn ${directions[gameState.playerDirection]}`);
 
    updateHUD();
    renderViews();
}

//Combat

function startCombat(position) {
    gameState.inCombat = true;
    combatMenu.classList.remove("hidden");

    gameState.currentEnemy = {
        type: ["Goblin" , "Skeleton" , "Orc" , "Spider"][Math.floor(Math.random() * 4)] ,
        health: 30 + gameState.level * 10 ,
        maxHealth: 30 + gameState.level * 10 ,
        attack: 5 + gameState.level * 2 ,
        defense: 2 + gameState.level
    };

    enemyInfo.innerHTML = `
            <p> Enemy: ${gameState.currentEnemy.type}</p>
            <p> Health: ${gameState.currentEnemy.health} / ${gameState.currentEnemy.maxHealth}</p>`;

            addMessage(`A ${gameState.currentEnemy.type} Attacks You`);

}

function performAction(action) {
    if(!gameState.inCombat)
        return;

    let playerDamage = 0;
    let enemyDamage = 0;

    switch(action) {

        case "attack":
            playerDamage = Math.max(5 + Math.floor(Math.random() * 10) - gameState.currentEnemy.defense , 1);
            gameState.currentEnemy.health -= playerDamage;
            addMessage(`You Attack the ${gameState.currentEnemy.type} for ${playerDamage} Damage`);
            break;

        case "defend":
            const healAmount = Math.floor(gameState.maxHealth * 0.1);
            gameState.health = Math.min(gameState.health + healAmount , gameState.maxHealth);
            addMessage(`You Defend and Recover ${healAmount} Health `);
            break;

        case "flee":
            if(Math.random() < 0.5) {
                addMessage(`You flee from the ${gameState.currentEnemy.type}`);
                endCombat();
                return;
            } else {
                addMessage(`You Failed to Flee`);
            }
            break;
    }

    if(gameState.currentEnemy.health <=0) { 
        addMessage(`You Defeated the ${gameState.currentEnemy.type}`);
            endCombat();
            return;
    }

    if(action !== "flee" || Math.random() >= 0.5) {
        enemyDamage = Math.max(gameState.currentEnemy.attack - Math.floor(Math.random() * 5) , 1);
        gameState.health -= enemyDamage;
        addMessage(`The ${gameState.currentEnemy.type} Attacks for ${enemyDamage} Damage`);

        if(gameState.health <= 0) {
            gameState.health = 0;
            playerDefeated();
            return;
        }
    }

    enemyInfo.innerHTML = `
            <p> Enemy: ${gameState.currentEnemy.type} </p>
            <p> Health: ${gameState.currentEnemy.health} / ${gameState.currentEnemy.maxHealth} </p>`;

            updateHUD();
}

function endCombat() {
    gameState.inCombat = false;
    combatMenu.classList.add("hidden");

    const enemyPos = getDirection(gameState.playerDirection);
        if(enemyPos.x >= 0 && enemyPos.y >= 0 && enemyPos.x < gameState.dungeon[0].length && enemyPos.y < gameState.dungeon.length) {
            gameState.dungeon[enemyPos.y][enemyPos.x] = 0;
        }
        addMessage(`You Defeated the ${gameState.currentEnemy.type}`);
        renderViews();
        updateMap();
}

function playerDefeated() {
    gameState.lives--;
    updateHUD();

    if(gameState.lives <= 0) {
        gameOverMenu.classList.remove("hidden");
        livesMessage.textContent = "Game Over";
        document.getElementById("cont").disabled = true;
    } else {
        gameOverMenu.classList.remove("hidden");
        livesMessage.textContent = (`You Have ${gameState.lives} Live(s) Remaining`);
        document.getElementById("cont").disabled = false;
    }
}

function continueDeath() {
    gameState.health = gameState.maxHealth;
    gameOverMenu.classList.add("hidden");
    updateHUD();
}

//Level End

function levelComplete() {
    addMessage(" You Found the Exit. Floor Complete");
    victoryMenu.classList.remove("hidden");
}

function nextLevel() {
    gameState.level++;
    gameState.health = gameState.maxHealth;
    victoryMenu.classList.add("hidden");
    generateDungeon();
    updateHUD();
    renderViews();
    addMessage(`You Reach Floor ${gameState.level}`);
}

updateHUD();