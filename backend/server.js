const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors());

let players = {}; // Stores socket ids with assigned name & color
let timers = {
    white: 600,
    black: 600,
};

let activeTimer = null;
let currentTurn = "white";

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

// This listens whenever a new player joins
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
    console.log(players);

    // Notify the player of their assigned color
    socket.emit("playerInfo", { name: playerName, color: playerColor });

    // Notify all players about the new connection
    io.emit("playerUpdate", players);

    // Start the timer when both players join
    if (Object.keys(players).length === 2) {
        startTimer();
    }

    socket.on("move", (move) => {
        console.log(move);
        socket.broadcast.emit("move", move);

        // Switch turn and restart the timer
        currentTurn = currentTurn === "white" ? "black" : "white";
        startTimer();
        io.emit("switchTurn", currentTurn);
    });

    socket.on("disconnect", () => {
        console.log("A player disconnected", socket.id);
        if (players[socket.id]) {
            delete players[socket.id];
        }

        io.emit("Player Update", players);
        if (Object.keys(players).length < 2) {
            clearInterval(activeTimer); // Stop timer if a player leaves
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
