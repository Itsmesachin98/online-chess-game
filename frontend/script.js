document.addEventListener("DOMContentLoaded", function () {
    const socket = io("http://localhost:3000");
    console.log("Connected to server");

    let playerName;
    let playerColor;
    let isGameOn = false;

    function startGame() {
        isGameOn = true;
        socket.emit("gameStatus", isGameOn);
    }

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

        socket.on("playerUpdate", (players) => {
            let whitePlayer = Object.values(players).find(
                (player) => player.color === "white"
            );
            let blackPlayer = Object.values(players).find(
                (player) => player.color === "black"
            );

            if (whitePlayer && blackPlayer) {
                if (playerColor === "white") {
                    document.getElementById("player-bottom").innerText =
                        "Player One";
                    document.getElementById("player-top").innerText =
                        "Player Two";

                    document.getElementById("timer-bottom").innerText = "10:00";
                    document.getElementById("timer-top").innerText = "10:00";
                } else {
                    document.getElementById("player-bottom").innerText =
                        "Player Two";
                    document.getElementById("player-top").innerText =
                        "Player One";

                    document.getElementById("timer-bottom").innerText = "10:00";
                    document.getElementById("timer-top").innerText = "10:00";
                }
            } else if (whitePlayer) {
                document.getElementById("player-bottom").innerText =
                    "Player One";
                document.getElementById("player-top").innerText =
                    "Waiting for player";

                document.getElementById("timer-bottom").innerText = "10:00";
                document.getElementById("timer-top").innerText = "10:00";
            } else if (blackPlayer) {
                document.getElementById("player-bottom").innerText =
                    "Player Two";
                document.getElementById("player-top").innerText =
                    "Waiting for player";

                document.getElementById("timer-bottom").innerText = "10:00";
                document.getElementById("timer-top").innerText = "10:00";
            }
        });

        var config = {
            draggable: true,
            pieceTheme:
                "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
            position: "start",
            onDragStart: onDragStart,
            onDrop: onDrop,
            orientation: playerColor === "black" ? "black" : "white", // Rotate board for black player
        };

        board = Chessboard("chessboard", config);
        updateStatus();
    });

    var board;
    var game = new Chess(); // Creates a new chess game instance

    function onDragStart(__, piece) {
        // Prevent moving the piece when the game is over
        if (game.game_over()) return false;

        console.log(playerColor);

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

        // Send the move to the server
        socket.emit("move", move);

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

    socket.on("move", (move) => {
        game.move(move);
        board.position(game.fen());
        updateStatus();
        startGame();
    });

    socket.on("timerUpdate", (timers) => {
        if (playerColor === "white") {
            document.getElementById("timer-bottom").innerText = formatTime(
                timers.white
            );
            document.getElementById("timer-top").innerText = formatTime(
                timers.black
            );
        } else {
            document.getElementById("timer-bottom").innerText = formatTime(
                timers.black
            );
            document.getElementById("timer-top").innerText = formatTime(
                timers.white
            );
        }
    });

    socket.on("gameOver", (winner) => {
        alert(`${winner} wins by time!`);
    });
});
