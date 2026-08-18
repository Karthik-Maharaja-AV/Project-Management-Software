import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { getToken } from "next-auth/jwt";
import { setIO } from "./lib/socket-server";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie ?? "";
      const fakeReq = new Request("http://localhost/socket.io", {
        headers: { cookie },
      });
      const token = await getToken({
        req: fakeReq,
        secret: process.env.AUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
      });
      const userId = token?.id as string | undefined;
      if (!userId) {
        return next(new Error("Unauthorized"));
      }
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on("project:join", (projectId: string) => {
      if (typeof projectId === "string") socket.join(`project:${projectId}`);
    });
    socket.on("project:leave", (projectId: string) => {
      if (typeof projectId === "string") socket.leave(`project:${projectId}`);
    });
    socket.on("workspace:join", (workspaceId: string) => {
      if (typeof workspaceId === "string") socket.join(`workspace:${workspaceId}`);
    });
    socket.on("workspace:leave", (workspaceId: string) => {
      if (typeof workspaceId === "string") socket.leave(`workspace:${workspaceId}`);
    });
  });

  setIO(io);

  httpServer.listen(port, () => {
    console.log(`> PixelForge ready on http://localhost:${port}`);
  });
});
