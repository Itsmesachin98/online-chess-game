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
        // window.location.href = `/gamearena/${data.gameId}`;
        const gameLink = `https://onlinechessgame.vercel.app/gamearena/${data.gameId}`;
        // console.log(data);

        // Display game link
        document.getElementById(
            "gameLink"
        ).innerHTML = `Share this link: <a href="${gameLink}" target="_blank">${gameLink}</a>`;
    });
});
