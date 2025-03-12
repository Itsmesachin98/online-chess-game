document.addEventListener("DOMContentLoaded", function () {
    // const socket = io("https://online-chess-game-shwe.onrender.com");
    const socket = io("https://online-chess-game-shwe.onrender.com", {
        transports: ["websocket"], // Force WebSocket instead of HTTP polling
        withCredentials: true,
    });

    // const socket = io("http://localhost:3000");
    console.log("Connected to server");

    const playerTop = document.getElementById("player-top");
    const playerBottom = document.getElementById("player-bottom");
    const timerTop = document.getElementById("timer-top");
    const timerBottom = document.getElementById("timer-bottom");

    const pathname = window.location.pathname;
    const gameId = pathname.split("/").pop();
    console.log("This is game id", gameId);

    socket.emit("createGame", gameId);
    socket.emit("joinGame", gameId);

    let playerName;
    let playerColor;
    let isGameOn = false;
    let hasBothPlayersJoined = false;

    var board;
    var game = new Chess();

    // This formats the time
    function formatTime(time) {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

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
        if (Object.keys(players).length < 2) {
            if (!isGameOn) hasBothPlayersJoined = false;
        } else {
            hasBothPlayersJoined = true;
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

    // var board;
    // var game = new Chess(); // Creates a new chess game instance

    // var config = {
    //     draggable: true,
    //     pieceTheme:
    //         "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
    //     position: "start",
    //     onDragStart: onDragStart,
    //     onDrop: onDrop,
    //     orientation: playerColor === "black" ? "black" : "white", // Rotate board for black player
    // };

    // board = Chessboard("chessboard", config); // Initialize board if not already

    function onDragStart(__, piece) {
        // Prevent moving the piece when the game is over
        if (game.game_over()) return false;
        if (!hasBothPlayersJoined) return false;

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

        if (move === null) return "snapback"; // Invalid move, return piece to original position
        move.fen = game.fen();

        // Send the move to the server
        socket.emit("move", { gameId, move });

        updateStatus();
    }

    function updateStatus() {
        var status = "";

        if (game.in_checkmate()) {
            if (game.turn() === "w") {
                status = "Checkmate! Black wins!";
            } else {
                status = "Checkmate! White wins!";
            }
        } else if (game.in_draw()) {
            status = "Game draw!";
        } else {
            if (game.turn() === "w") {
                status = "White's turn";
            } else status = "Black's turn";
        }

        document.getElementById("status").innerText = status;
    }

    // function startGame() {
    //     isGameOn = true;
    //     socket.emit("gameStatus", isGameOn);
    // }

    // socket.on("gameCreated", ({ gameId, link }) => {
    //     const gameUrl = `${window.location.origin}?gameId=${gameId}`;
    //     alert(`Game Created!\nGame ID: ${gameId}\nShare this link: ${gameUrl}`);
    //     console.log(gameUrl);
    // });

    socket.on("move", (move) => {
        game.move(move);
        board.position(game.fen());
        updateStatus();
        // startGame();
    });

    socket.on("timerUpdate", (timers) => {
        if (playerColor === "white") {
            timerBottom.innerText = formatTime(timers.white);
            timerTop.innerText = formatTime(timers.black);
        } else {
            timerBottom.innerText = formatTime(timers.black);
            timerTop.innerText = formatTime(timers.white);
        }
    });

    // socket.on("gameOver", (winner) => {
    //     alert(`${winner} wins by time!`);
    // });
});
