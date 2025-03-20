const express = require("express");
const path = require("path");
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

let time = 600; // This is the game time
let games = {}; // Stores game data with gameId as key

// Test Route to Check if Server is Running
app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.get("/createGame", (req, res) => {
    let gameId = uuidv4().slice(0, 8); // Generate short unique game ID
    res.json({ gameId });
});

app.get("/gameroom", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "gameroom.html"));
});

// Function to reset a game
function resetGame(gameId) {
    if (games[gameId]) {
        games[gameId].gameFen = "start";
        games[gameId].isGameOn = false;
        games[gameId].timers = { white: time, black: time };
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
    // It creates a new game
    socket.on("createGame", (gameId) => {
        // It ensures that two games with the same game ID can't be created
        if (games[gameId]) {
            return;
        }

        games[gameId] = {
            players: {},
            gameFen: "start",
            isGameOn: false,
            timers: { white: time, black: time },
            activeTimer: null,
            currentTurn: "white",
        };
    });

    // It allows the player to join the game
    socket.on("joinGame", (gameId) => {
        if (games[gameId]) {
            let game = games[gameId];

            // It ensures that only two players can join the same game room
            if (Object.keys(game.players).length >= 2) {
                socket.emit("roomFull", "/gameroom");
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
            socket.gameId = gameId; // Save gameId on socket object
            socket.emit("playerInfo", { name: playerName, color: playerColor });
            io.to(gameId).emit("playerUpdate", game.players);
            socket.emit("gameState", game.gameFen);

            if (Object.keys(game.players).length === 2) {
                game.isGameOn = true;
            }
        } else {
            socket.emit("error", "Invalid game ID");
            return;
        }
    });

    // It listens for moves and updates the board for both players
    socket.on("move", ({ gameId, move }) => {
        let game = games[gameId];
        if (!game) return;

        game.gameFen = move.fen;
        socket.broadcast.to(gameId).emit("move", move);

        game.currentTurn = game.currentTurn === "white" ? "black" : "white";
        startTimer(gameId);
    });

    socket.on("checkmate", ({ gameId, winner }) => {
        // if (games[gameId] && games[gameId].isGameOn) {
        //     games[gameId].isGameOn = false;
        //     io.to(gameId).emit("gameOver", { winner });
        // }
        clearInterval(games[gameId].activeTimer);
        io.to(gameId).emit("gameOver", { winner });
    });

    // Fires whenever a player disconnects
    socket.on("disconnect", () => {
        let gameId = socket.gameId; // Retrieve gameId from socket
        console.log("This is the game id", gameId);
        if (gameId && games[gameId] && games[gameId].players[socket.id]) {
            delete games[gameId].players[socket.id];
            io.to(gameId).emit("playerUpdate", games[gameId].players);

            if (Object.keys(games[gameId].players).length === 0) {
                delete games[gameId];
            } else if (Object.keys(games[gameId].players).length < 2) {
                // clearInterval(games[gameId].activeTimer);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // console.log(`Server running on http://localhost:${PORT}`);
});
