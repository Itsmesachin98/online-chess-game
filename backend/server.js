const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://onlinechessgame.vercel.app",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.use(cors());

let players = {}; // Stores socket ids with assigned name & color
let timers = {
    white: 600,
    black: 600,
};

let isGameOn = false;
let activeTimer = null;
let currentTurn = "white";
let gameFen = "start";

// Function to start the timer
function startTimer() {
    if (activeTimer) clearInterval(activeTimer);

    activeTimer = setInterval(() => {
        if (timers[currentTurn] > 0) {
            timers[currentTurn]--;
            io.emit("timerUpdate", timers); // Send updated time to clients
        } else {
            clearInterval(activeTimer);
            io.emit("gameOver", currentTurn === "white" ? "black" : "white");
        }
    }, 1000);
}

// Fires whenever a new player connects
io.on("connection", (socket) => {
    let playerId = socket.id;
    let playerName;
    let playerColor;

    const takenNames = Object.values(players).map((player) => player.name);

    if (Object.keys(players).length === 0) {
        // First player joins
        playerName = "Player One";
        playerColor = "white";
    } else if (Object.keys(players).length === 1) {
        // Checks if "white" is taken or not
        playerName = takenNames.includes("Player One")
            ? "Player Two"
            : "Player One";
        playerColor = takenNames.includes("Player One") ? "black" : "white";
    } else {
        // Game room is full
        socket.emit("full", "Game room is full. Try again later.");
        socket.disconnect();
        return; // Prevents further execution
    }

    players[playerId] = { name: playerName, color: playerColor };

    // Notify the player of their assigned color
    socket.emit("playerInfo", { name: playerName, color: playerColor });

    socket.emit("gameState", gameFen);

    // Notify all players about the new connection
    io.emit("playerUpdate", players);

    // Start the timer when both players join
    if (Object.keys(players).length === 2) {
        // Start the timer when a move is made. Don't just start it immediately
        socket.on("gameStatus", (status) => {
            isGameOn = status;
        });

        if (isGameOn) startTimer();
    }

    socket.on("move", (move) => {
        gameFen = move.fen;
        socket.broadcast.emit("move", move);

        // Switch turn and restart the timer
        currentTurn = currentTurn === "white" ? "black" : "white";
        startTimer();
    });

    // Fires whenever a player disconnects
    socket.on("disconnect", () => {
        if (players[socket.id]) {
            delete players[socket.id];
        }

        io.emit("playerUpdate", players);

        if (Object.keys(players).length < 2) {
            clearInterval(activeTimer); // Stop timer if a player leaves
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
