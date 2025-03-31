import { app } from "./app";
import "dotenv/config"
const port = app.get("port");

const server = app.listen(Number.parseInt(process.env.EXPRESS_PORT),"0.0.0.0",onListening);
server.on("error", onError);

function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind =
        typeof addr === "string" ? `pipe ${addr}` : `port ${process.env.Port}`;
    console.log(`Listening on ${process.env.EXPRESS_PORT}`);
 
}

export default server;
