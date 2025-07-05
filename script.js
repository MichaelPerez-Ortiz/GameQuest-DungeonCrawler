
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

    currenScreen: "mainMenu" ,
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
        const rowEL = document.createElement("div");
        rowEL.className = "mapRow";
    

    row.forEach((cell , x) => {
        const cellEL = document.createElement("div");
        cellEL.className = "mapCell";

            if(!gameState.discovered[y][x]) {
                cellEL.classList.add("unknown");

            } else {
                
                cellEL.classList.add("discovered");

            if(x === gameState.playerPosition.x && y === gameState.playerPosition.y) {
                cellEL.classList.add("current");

            } else if (cell === 1) {
                cellEL.classList.add("wall");

            } else if (cell === 4) {
                cellEL.classList.add("exit");
            }
        }

        rowEL.appendChild(cellEl);
        });
        miniMap.appendChild(rowEL)
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

