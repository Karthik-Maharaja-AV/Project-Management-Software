import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function setIO(server: SocketIOServer) {
  io = server;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToProject(projectId: string, event: string, payload: unknown) {
  io?.to(`project:${projectId}`).emit(event, payload);
}

export function emitToWorkspace(workspaceId: string, event: string, payload: unknown) {
  io?.to(`workspace:${workspaceId}`).emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
