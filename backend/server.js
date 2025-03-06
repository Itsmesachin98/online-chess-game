const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid"); // For generating unique game IDs

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://onlinechessgame.vercel.app",
        // origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.use(cors());

let games = {}; // Stores game data with gameId as key

// Function to reset a game
function resetGame(gameId) {
    if (games[gameId]) {
        games[gameId].gameFen = "start";
        games[gameId].isGameOn = false;
        games[gameId].timers = { white: 600, black: 600 };
        clearInterval(games[gameId].activeTimer);
        games[gameId].activeTimer = null;
        games[gameId].currentTurn = "white";
    }
}

// Function to start the timer
function startTimer(gameId) {
    let game = games[gameId];
    if (!game) return;

    if (game.activeTimer) clearInterval(game.activeTimer);

    game.activeTimer = setInterval(() => {
        if (game.timers[game.currentTurn] > 0) {
            game.timers[game.currentTurn]--;
            io.to(gameId).emit("timerUpdate", game.timers);
        } else {
            clearInterval(game.activeTimer);
            io.to(gameId).emit(
                "gameOver",
                game.currentTurn === "white" ? "black" : "white"
            );
            resetGame(gameId);
            io.to(gameId).emit("gameState", "start");
        }
    }, 1000);
}

// Handle new connections
io.on("connection", (socket) => {
    socket.on("createGame", () => {
        let gameId = uuidv4(); // Generate a unique game ID
        games[gameId] = {
            players: {},
            gameFen: "start",
            isGameOn: false,
            timers: { white: 600, black: 600 },
            activeTimer: null,
            currentTurn: "white",
        };
        // socket.emit("gameCreated", gameId);

        socket.emit("gameCreated", {
            gameId,
            link: `https://onlinechessgame.vercel.app/?gameId=${gameId}`,
            // link: `http://127.0.0.1:5500/frontend/index.html/gameId=${gameId}`,
        });
    });

    socket.on("joinGame", (gameId) => {
        if (!games[gameId]) {
            socket.emit("error", "Invalid game ID");
            return;
        }

        let game = games[gameId];

        if (Object.keys(game.players).length >= 2) {
            socket.emit("full", "Game room is full. Try another.");
            return;
        }

        let playerId = socket.id;
        let playerName, playerColor;

        const takenColors = Object.values(game.players).map((p) => p.color);
        if (!takenColors.includes("white")) {
            playerName = "Player One";
            playerColor = "white";
        } else {
            playerName = "Player Two";
            playerColor = "black";
        }

        game.players[playerId] = { name: playerName, color: playerColor };

        socket.join(gameId);
        socket.emit("playerInfo", { name: playerName, color: playerColor });
        io.to(gameId).emit("playerUpdate", game.players);
        socket.emit("gameState", game.gameFen);

        if (Object.keys(game.players).length === 2) {
            game.isGameOn = true;
            startTimer(gameId);
        }
    });

    socket.on("move", ({ gameId, move }) => {
        let game = games[gameId];
        if (!game) return;

        game.gameFen = move.fen;
        socket.broadcast.to(gameId).emit("move", move);

        game.currentTurn = game.currentTurn === "white" ? "black" : "white";
        startTimer(gameId);
    });

    // Fires whenever a player disconnects
    socket.on("disconnect", () => {
        for (let gameId in games) {
            let game = games[gameId];
            if (game.players[socket.id]) {
                delete game.players[socket.id];
                io.to(gameId).emit("playerUpdate", game.players);
            }

            if (Object.keys(game.players).length === 0) {
                delete games[gameId]; // Clean up empty game rooms
            } else if (Object.keys(game.players).length < 2) {
                clearInterval(game.activeTimer);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // console.log(`Server running on http://localhost:${PORT}`);
});
