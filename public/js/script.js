document.addEventListener("DOMContentLoaded", function () {
    const createGameBtn = document.getElementById("createGameBtn");

    var config = {
        pieceTheme:
            "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
        position: "start",
    };
    var board1 = Chessboard("board1", config);

    createGameBtn.addEventListener("click", async () => {
        const response = await fetch(
            "https://online-chess-game-shwe.onrender.com/createGame"
        );
        const data = await response.json();
        window.location.href = `/gamearena/${data.gameId}`;
        console.log(data);
    });
});
