
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


//View
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