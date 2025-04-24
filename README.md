# Online Chess Game

**Online Chess Game** is a real-time multiplayer chess application built using modern web technologies. It allows players to create and join chess games, play against each other, and enjoy a seamless chess experience with timers and game state synchronization.

---

## Features

-   **Real-Time Multiplayer**: Play chess with friends or other players in real-time.
-   **Game Timer**: Each player has a countdown timer to make their moves.
-   **Responsive Design**: Optimized for various screen sizes.
-   **Chessboard.js Integration**: Interactive chessboard with drag-and-drop functionality.
-   **Game State Synchronization**: Game state is synchronized between players using WebSockets.
-   **Dynamic Game Links**: Generate unique game links to invite others.
-   **Resign Option**: Players can resign from the game.

---

## Technologies Used

### Frontend

-   **HTML5**: Structure of the web pages.
-   **CSS3**: Styling the application.
-   **JavaScript**: Client-side logic.
-   **Chessboard.js**: Interactive chessboard.
-   **Chess.js**: Chess game logic.

### Backend

-   **Node.js**: Backend runtime.
-   **Express.js**: Web framework for the server.
-   **Socket.IO**: Real-time communication between players.
-   **UUID**: Generate unique game IDs.

### Deployment

-   **Vercel**: Hosting the frontend.
-   **Render**: Hosting the backend.

---

## Project Structure

```
online-chess-game/
├── backend/
│   ├── package.json           # Backend dependencies and scripts
│   ├── package-lock.json      # Locked versions of dependencies
│   └── server.js              # Express server with Socket.IO for real-time communication
├── public/
│   ├── assets/                # Images, icons, and other static assets
│   ├── css/                   # CSS files for styling
│   │   ├── base.css
│   │   ├── game.css
│   │   ├── gameroom.css
│   │   └── home.css
│   ├── js/                    # JavaScript files for frontend logic
│   │   ├── game.js
│   │   └── home.js
│   ├── game.html              # Game page
│   ├── gameroom.html          # Game room page
│   ├── home.html              # Home page
│   └── vercel.json            # Vercel configuration for deployment
├── .gitignore                 # Files and directories to ignore in Git
└── README.md                  # Project overview and instructions
```

---

## Installation

### Prerequisites

-   Node.js installed on your system.

### Steps

1. Clone the repository:

    ```bash
    git clone https://github.com/Itsmesachin98/online-chess-game.git
    cd online-chess-game
    ```

2. Navigate to the backend directory and install dependencies:

    ```bash
    cd backend
    npm install
    ```

3. Start the backend server:

    ```bash
    npm start
    ```

4. Deploy the `public/` folder to a static hosting service like **Vercel**.

---

## Usage

-   🔗 Live Game: [https://onlinechessgame.vercel.app/](https://onlinechessgame.vercel.app/)
-   Open the deployed frontend in your browser.
-   Click **"Create a Game"** to generate a unique game link.
-   Share the link with a friend to start playing.
-   Play chess with real-time updates and timers.

---

## Deployment

### Frontend

-   The `public/` folder is deployed on **Vercel**.
-   The `vercel.json` file ensures proper routing for pages.

### Backend

-   The `backend/` folder is deployed on **Render**.
-   The server handles game creation, game state synchronization, and WebSocket communication.

---

## API Endpoints

### Backend

-   `GET /` – Test route to check if the server is running.
-   `GET /createGame` – Generates a unique game ID.
-   `GET /gameroom` – Serves the game room page.

---

## WebSocket Events

### Client-to-Server

-   `createGame` – Creates a new game with a unique ID.
-   `joinGame` – Joins a game using the game ID.
-   `move` – Sends a move to the server.
-   `checkmate` – Notifies the server of a checkmate.

### Server-to-Client

-   `roomFull` – Notifies the client if the game room is full.
-   `playerInfo` – Sends player information (name and color).
-   `playerUpdate` – Updates the list of players in the game.
-   `gameState` – Sends the current game state (FEN).
-   `move` – Updates the board with the opponent's move.
-   `timerUpdate` – Updates the timers for both players.
-   `gameOver` – Notifies the players of the game result.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b feature-name
    ```
3. Make your changes and commit them:
    ```bash
    git commit -m "Add feature-name"
    ```
4. Push to your forked repository:
    ```bash
    git push origin feature-name
    ```
5. Create a pull request.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Acknowledgments

-   [Chessboard.js](https://chessboardjs.com/)
-   [Chess.js](https://github.com/jhlywa/chess.js)
-   [Socket.IO](https://socket.io/)
-   [Vercel](https://vercel.com/)
-   [Render](https://render.com/)
