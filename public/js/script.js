document.addEventListener("DOMContentLoaded", function () {
    const createGameBtn = document.getElementById("createGameBtn");

    var config = {
        pieceTheme:
            "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
        position: "start",
    };
    var board1 = Chessboard("board1", config);

    createGameBtn.addEventListener("click", () => {
        console.log("I got clicked");
    });
});
