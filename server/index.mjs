import express from "express";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Server } from "socket.io";
import {
  authorize,
  controlRoom,
  createRoom,
  getRoom,
  joinRoom,
  reactionKinds,
  reactRoom,
  rooms,
  snapshot,
  submitAuthored,
  submitUpvote,
  submitVote,
} from "./rooms.mjs";

export function createAppServer() {
  const app = express();
  const http = createServer(app);
  const io = new Server(http, { maxHttpBufferSize: 64 * 1024 });
  app.get("/api/health", (_request, response) => response.json({ ok: true }));
  app.get("/api/network", (_request, response) => {
    const address = Object.values(networkInterfaces())
      .flat()
      .find(
        (entry) => entry && entry.family === "IPv4" && !entry.internal,
      )?.address;
    response.json({ address });
  });
  const dist = fileURLToPath(new URL("../dist", import.meta.url));
  app.use(express.static(dist));
  app.get("/{*path}", (_request, response) =>
    response.sendFile(path.join(dist, "index.html")),
  );

  function broadcast(room) {
    io.to(`host:${room.code}`).emit("room:state", snapshot(room, true));
    io.to(`audience:${room.code}`).emit("room:state", snapshot(room));
  }

  io.on("connection", (socket) => {
    let events = 0;
    let windowStart = Date.now();
    const listen = (event, handler, { counted = true } = {}) =>
      socket.on(event, (payload, ack) => {
        if (typeof ack !== "function") return;
        try {
          if (Date.now() - windowStart > 60_000) {
            windowStart = Date.now();
            events = 0;
          }
          if (counted && ++events > 120)
            throw new Error("Too many requests. Please wait a moment.");
          if (!payload || typeof payload !== "object")
            throw new Error("Invalid request.");
          ack({ ok: true, ...handler(payload) });
        } catch (error) {
          ack({ ok: false, error: error.message || "Something went wrong." });
        }
      });
    const leaveRooms = () => {
      for (const channel of socket.rooms)
        if (channel !== socket.id) socket.leave(channel);
    };
    listen("room:create", ({ title, questions, crowdKind }) => {
      const room = createRoom(title, questions, crowdKind);
      leaveRooms();
      socket.join(`host:${room.code}`);
      return { token: room.hostToken, state: snapshot(room, true) };
    });
    listen("room:host", ({ code, token }) => {
      const room = getRoom(code);
      authorize(room, token);
      leaveRooms();
      socket.join(`host:${room.code}`);
      return { state: snapshot(room, true) };
    });
    listen("room:join", ({ code, name, token }) => {
      const room = getRoom(code);
      const memberToken = joinRoom(room, name, token);
      leaveRooms();
      socket.join(`audience:${room.code}`);
      broadcast(room);
      return {
        token: memberToken,
        state: snapshot(room),
        submitted: [
          ...room.questions
            .filter((question) => room.votes.get(question.id).has(memberToken))
            .map((question) => question.id),
          ...(room.crowd?.pending.has(memberToken) ? ["crowd-authored"] : []),
        ],
      };
    });
    listen("room:author", ({ code, token, question }) => {
      const room = getRoom(code);
      submitAuthored(room, token, question);
      broadcast(room);
      return {};
    });
    listen("room:vote", ({ code, token, questionId, value }) => {
      const room = getRoom(code);
      submitVote(room, token, questionId, value);
      broadcast(room);
      return {};
    });
    listen("room:upvote", ({ code, token, questionId, entrantToken }) => {
      const room = getRoom(code);
      const upvoted = submitUpvote(room, token, questionId, entrantToken);
      broadcast(room);
      return { upvoted };
    });
    // Hearts are throttled per participant in reactRoom, so they must not
    // consume the socket's general request budget (votes, upvotes, controls).
    listen(
      "room:react",
      ({ code, token, kind = "heart" }) => {
        if (!reactionKinds.includes(kind)) throw new Error("Unknown reaction.");
        const room = getRoom(code);
        const sent = reactRoom(room, token);
        if (sent) io.to(`host:${room.code}`).emit("room:heart", { kind });
        return { sent };
      },
      { counted: false },
    );
    listen("room:control", ({ code, token, action, index }) => {
      const room = getRoom(code);
      controlRoom(room, token, action, index);
      broadcast(room);
      return { state: snapshot(room, true) };
    });
    listen("room:delete", ({ hostedRooms }) => {
      if (
        !Array.isArray(hostedRooms) ||
        !hostedRooms.length ||
        hostedRooms.length > 1000
      )
        throw new Error("Provide the rooms to delete.");
      const targets = hostedRooms.map((credentials) => {
        if (
          !credentials ||
          typeof credentials.code !== "string" ||
          typeof credentials.token !== "string"
        )
          throw new Error("Invalid room credentials.");
        const room = rooms.get(credentials.code);
        if (room) authorize(room, credentials.token);
        return room;
      });
      for (const room of targets) {
        if (!room) continue;
        io.to(`host:${room.code}`)
          .to(`audience:${room.code}`)
          .emit("room:deleted", { code: room.code });
        io.in(`host:${room.code}`).socketsLeave(`host:${room.code}`);
        io.in(`audience:${room.code}`).socketsLeave(`audience:${room.code}`);
        rooms.delete(room.code);
      }
      return {};
    });
  });
  const expiry = setInterval(() => {
    for (const [code, room] of rooms) {
      if (Date.now() - room.createdAt > 24 * 60 * 60 * 1000) {
        io.to(`host:${code}`).to(`audience:${code}`).emit("room:expired");
        io.in(`host:${code}`).socketsLeave(`host:${code}`);
        io.in(`audience:${code}`).socketsLeave(`audience:${code}`);
        rooms.delete(code);
      }
    }
  }, 60_000);
  expiry.unref();
  http.on("close", () => clearInterval(expiry));
  return { http, io };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { http } = createAppServer();
  const port = Number(process.env.PORT || 3001);
  http.listen(port, "0.0.0.0", () =>
    console.log(`Pulse server listening on http://localhost:${port}`),
  );
}
