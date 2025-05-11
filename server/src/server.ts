import express from "express";
import cors from "cors";
import authRoutes from "./routes/apiHandler";
import { createServer } from "http";
import { Server } from "socket.io";
import { PORT, PUBLIC_CLIENT_URL } from "./config/environment";
import { handleSocketConnection } from "./routes/socketHandler";
import MatchHandler from "./socket/matchHandler";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: PUBLIC_CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use("/", authRoutes);

// Initialize match handler
const matchHandler = new MatchHandler(io);

io.on("connection", (socket) => {
  handleSocketConnection(socket, io);
  matchHandler.initialize(socket);
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});