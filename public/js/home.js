document.addEventListener("DOMContentLoaded", function () {
    const interface = document.querySelector(".interface");
    const createGameBtn = document.getElementById("createGameBtn");

    var config = {
        pieceTheme:
            "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
        position: "start",
    };
    var dummyBoard = Chessboard("dummy-board", config);

    createGameBtn.addEventListener("click", async () => {
        console.log("Create game button is clicked");
        createGameLink();
        const response = await fetch(
            "https://online-chess-game-shwe.onrender.com/createGame"
            // "http://localhost:3000/createGame"
        );
        const data = await response.json();
        const link = `https://onlinechessgame.vercel.app/game/${data.gameId}`;

        // Display game link
        const gameLink = document.getElementById("game-link");
        gameLink.innerHTML = `Game Link: <a href="${link}" target="_blank">${link}</a>`;
    });

    function createGameLink() {
        // Create the link container div
        const linkContainer = document.createElement("div");
        linkContainer.classList.add("link-container");

        // Create the span inside the div
        const gameLink = document.createElement("span");
        gameLink.id = "game-link";

        // Append the span inside the container div
        linkContainer.appendChild(gameLink);

        // Append the link container div to interface section
        interface.appendChild(linkContainer);
    }
});
