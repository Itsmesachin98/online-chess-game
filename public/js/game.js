document.addEventListener("DOMContentLoaded", function () {
    const socket = io("https://online-chess-game-shwe.onrender.com");
    // const socket = io("http://localhost:3000");
    console.log("Connected to server");

    const playerBoard = document.getElementById("player-board");
    const playerTop = document.getElementById("player-top");
    const playerBottom = document.getElementById("player-bottom");
    const timerTop = document.getElementById("timer-top");
    const timerBottom = document.getElementById("timer-bottom");

    const pathname = window.location.pathname;
    const gameId = pathname.split("/").pop();

    socket.emit("createGame", gameId);
    socket.emit("joinGame", gameId);

    let playerName;
    let playerColor;
    let bothPlayersJoined = false;

    var board;
    var game = new Chess();

    // This formats the time
    function formatTime(time) {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    socket.on("roomFull", (redirectUrl) => {
        window.location.href = redirectUrl;
    });

    socket.on("playerInfo", (info) => {
        playerName = info.name;
        playerColor = info.color;

        console.log("Name:", playerName, "|", "Color:", playerColor);

        if (!board) {
            // Initialize board for the first time
            var config = {
                draggable: true,
                pieceTheme:
                    "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
                position: "start",
                onDragStart: onDragStart,
                onDrop: onDrop,
                orientation: playerColor === "black" ? "black" : "white",
            };

            board = Chessboard("chessboard", config);
        } else {
            // Update existing board orientation dynamically
            board.orientation(playerColor === "black" ? "black" : "white");
        }
    });

    socket.on("playerUpdate", (players) => {
        // When both players join the game, only then can the players make a move.
        if (Object.keys(players).length > 1) {
            bothPlayersJoined = true;
            if (!document.querySelector(".resign-btn-container")) {
                createResignBtn();
            }
        }

        let whitePlayer = Object.values(players).find(
            (player) => player.color === "white"
        );
        let blackPlayer = Object.values(players).find(
            (player) => player.color === "black"
        );

        if (whitePlayer && blackPlayer) {
            if (playerColor === "white") {
                playerBottom.innerText = "Player One";
                playerTop.innerText = "Player Two";

                timerBottom.innerText = "10:00";
                timerTop.innerText = "10:00";
            } else {
                playerBottom.innerText = "Player Two";
                playerTop.innerText = "Player One";

                timerBottom.innerText = "10:00";
                timerTop.innerText = "10:00";
            }
        } else if (whitePlayer) {
            playerBottom.innerText = "Player One";
            playerTop.innerText = "Waiting for player";

            timerBottom.innerText = "10:00";
            timerTop.innerText = "10:00";
        } else if (blackPlayer) {
            playerBottom.innerText = "Player Two";
            playerTop.innerText = "Waiting for player";

            timerBottom.innerText = "10:00";
            timerTop.innerText = "10:00";
        }
    });

    socket.on("gameState", (state) => {
        game.load(state);

        var config = {
            draggable: true,
            pieceTheme:
                "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
            position: state,
            onDragStart: onDragStart,
            onDrop: onDrop,
            orientation: playerColor === "black" ? "black" : "white", // Rotate board for black player
        };

        if (!board) {
            board = Chessboard("chessboard", config); // Initialize board if not already
        } else {
            board.position(state); // Update the existing board
        }

        updateStatus();
    });

    function onDragStart(__, piece) {
        // Prevent moving the piece when the game is over
        if (game.game_over()) return false;

        // Make sure that moves can only be made after both players have joined the game.
        if (!bothPlayersJoined) return false;

        // Prevent moving opponent's pieces
        if (
            (playerColor === "white" && piece.startsWith("b")) ||
            (playerColor === "black" && piece.startsWith("w"))
        ) {
            return false;
        }

        // Allow only the player's turn
        if (
            (playerColor === "white" && game.turn() !== "w") ||
            (playerColor === "black" && game.turn() !== "b")
        ) {
            return false;
        }
    }

    function onDrop(source, target) {
        var move = game.move({
            from: source,
            to: target,
            promotion: "q", // Always promotes pawns to queen
        });

        // If the move is invalid, return the piece to its original position
        if (move === null) return "snapback";
        move.fen = game.fen();

        // Send the move to the server
        socket.emit("move", { gameId, move });
    }

    function updateStatus() {
        let winner;
        if (game.in_checkmate()) {
            if (game.turn() === "w") {
                winner = "Black";
            } else {
                winner = "White";
            }

            socket.emit("checkmate", { gameId, winner });
        } else if (game.in_draw()) {
            gameStatus("Game draw!");
        }
    }

    socket.on("move", (move) => {
        game.move(move);
        board.position(game.fen());
        updateStatus();
    });

    // This updates the timer every second
    socket.on("timerUpdate", (timers) => {
        if (playerColor === "white") {
            timerBottom.innerText = formatTime(timers.white);
            timerTop.innerText = formatTime(timers.black);
        } else {
            timerBottom.innerText = formatTime(timers.black);
            timerTop.innerText = formatTime(timers.white);
        }
    });

    socket.on("gameOver", ({ winner }) => {
        gameStatus(winner);
    });

    function gameStatus(color) {
        const status = document.createElement("div");
        status.classList.add("status");

        const statusText = document.createElement("span");
        statusText.classList.add("status-text");
        statusText.innerText = `Checkmate! ${color} wins!`;

        status.appendChild(statusText);
        playerBoard.appendChild(status);
    }

    // It creates a Resign button
    function createResignBtn() {
        const resignBtnContainer = document.createElement("div");
        resignBtnContainer.classList.add("resign-btn-container");

        const resignBtn = document.createElement("button");
        resignBtn.classList.add("btn", "resign-btn");
        resignBtn.innerText = "Resign";

        resignBtnContainer.appendChild(resignBtn);
        playerBoard.appendChild(resignBtnContainer);
    }

    document.querySelector(".resign-btn").addEventListener("click", () => {
        console.log("Resign button got clicked");
    });
});
