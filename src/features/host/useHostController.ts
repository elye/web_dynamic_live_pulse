import { useEffect, useState } from "react";
import { request, useLive } from "../../live";
import {
  newSession,
  readStored,
  store,
  type Kind,
  type Question,
  type Room,
  type Session,
} from "../../model";
import { useFullscreen } from "../../hooks/useFullscreen";
import { useSessionMusic } from "./useSessionMusic";

export function useHostController() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = readStored<Session[] | null>("pulse:sessions", null);
    return Array.isArray(saved) &&
      saved.every(
        (session) =>
          Array.isArray(session.questions) && session.questions.length,
      )
      ? saved
      : [newSession()];
  });
  const [sessionId, setSessionId] = useState(() =>
    readStored<string>("pulse:selected", ""),
  );
  const [selected, setSelected] = useState(0);
  const [page, setPage] = useState<
    "studio" | "sessions" | "templates" | "results"
  >(() =>
    // Open on the workspace, but a reload mid-session returns to the live studio.
    readStored("pulse:host", null) ? "studio" : "sessions",
  );
  const [modal, setModal] = useState<
    | "add"
    | "share"
    | "new"
    | "help"
    | "end"
    | "reset"
    | "delete"
    | "import"
    | "aiprompt"
    | "simulate"
    | "presentsim"
    | "crowd"
    | null
  >(null);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [emptySession] = useState(() => newSession("blank"));
  const [editing, setEditing] = useState<Question | null>(null);
  const [presenting, setPresenting] = useState(false);
  const fullscreen = useFullscreen();
  const { exit: exitFullscreen } = fullscreen;
  useEffect(() => {
    if (!presenting) void exitFullscreen();
  }, [presenting, exitFullscreen]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  // Background images live in memory only (object URLs), keyed by session id.
  const [backgrounds, setBackgrounds] = useState<Record<string, string>>({});
  // White wash opacity (0-100) over each session's background image.
  const [washes, setWashes] = useState<Record<string, number>>({});
  // Position the next added question is inserted at; null appends to the end.
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const live = useLive("host", "", restoreSessionRoom);
  const { room, connected, error, setError } = live;
  const session =
    sessions.find((item) => item.id === sessionId) ||
    sessions[0] ||
    emptySession;
  const currentIndex =
    room && !room.ended
      ? room.active
      : Math.min(selected, session.questions.length - 1);
  // A player-made room has no questions until the game starts; fall back to the draft.
  const question =
    (room && !room.ended ? room.questions[room.active] : undefined) ??
    session.questions[Math.max(0, currentIndex)] ??
    session.questions[0];
  const isLive = !!room && !room.ended;
  const inLobby = isLive && !room.started;
  const questionList = isLive ? room.questions : session.questions;
  const music = useSessionMusic({
    sessionId: session.id,
    isLive,
    notify: setNotice,
  });
  useEffect(() => {
    store("pulse:sessions", sessions);
    store("pulse:selected", sessions.length ? session.id : "");
  }, [sessions, session.id]);
  function restoreSessionRoom(restoredRoom: Room) {
    const credentials = readStored<{
      code: string;
      token: string;
      sessionId?: string;
    } | null>("pulse:host", null);
    if (!credentials || credentials.sessionId) return;
    const original = sessions.find(
      (item) =>
        item.title === restoredRoom.title &&
        (item.nameless === true) === restoredRoom.nameless &&
        JSON.stringify(
          item.questions.map(({ type, title, options, correct }) => ({
            type,
            title,
            options,
            correct,
          })),
        ) ===
          JSON.stringify(
            restoredRoom.questions.map(({ type, title, options, correct }) => ({
              type,
              title,
              options,
              correct,
            })),
          ),
    );
    if (!original) return;
    store("pulse:host", { ...credentials, sessionId: original.id });
    setSessions((items) =>
      items.map((item) =>
        item.id === original.id
          ? {
              ...item,
              hostedRooms: [
                ...(item.hostedRooms || []).filter(
                  (entry) => entry.code !== credentials.code,
                ),
                { code: credentials.code, token: credentials.token },
              ],
            }
          : item,
      ),
    );
  }
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  function updateSession(changes: Partial<Session>) {
    setSessions((items) =>
      items.map((item) =>
        item.id === session.id
          ? { ...item, ...changes, updated: Date.now() }
          : item,
      ),
    );
  }
  function createSession(template: string) {
    const created = newSession(template);
    setSessions((items) => [...items, created]);
    setSessionId(created.id);
    setSelected(0);
    setPage("studio");
    setModal(null);
  }
  function confirmDeleteSession(item: Session) {
    setDeleteError("");
    setDeletingSession(item);
  }
  async function deleteSession() {
    if (!deletingSession) return;
    setBusy(true);
    setDeleteError("");
    const credentials = live.credentials();
    const hostedRooms = [...(deletingSession.hostedRooms || [])];
    if (
      credentials?.sessionId === deletingSession.id &&
      !hostedRooms.some((entry) => entry.code === credentials.code)
    )
      hostedRooms.push({ code: credentials.code, token: credentials.token });
    const deletingCurrentRoom =
      !!credentials &&
      hostedRooms.some((entry) => entry.code === credentials.code);
    try {
      if (hostedRooms.length) await request("room:delete", { hostedRooms });
      const remaining = sessions.filter(
        (item) => item.id !== deletingSession.id,
      );
      const nextId =
        session.id === deletingSession.id ? remaining[0]?.id || "" : session.id;
      store("pulse:sessions", remaining);
      store("pulse:selected", nextId);
      setSessions(remaining);
      setSessionId(nextId);
      setSelected(0);
      if (deletingCurrentRoom) {
        live.setRoom(null);
        live.saveCredentials(null);
      }
      setDeletingSession(null);
      setPresenting(false);
      setPage("sessions");
      setNotice("Session deleted");
    } catch (failure) {
      setDeleteError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function startSession(
    simulatedPlayers?: number,
    target: Session = session,
  ) {
    setBusy(true);
    setError("");
    try {
      const reply = await request("room:create", {
        title: target.title,
        questions: target.questions,
        nameless: target.nameless === true,
        ...(simulatedPlayers
          ? { simulation: { players: simulatedPlayers } }
          : {}),
      });
      const credentials = { code: reply.state!.code, token: reply.token! };
      live.saveCredentials({ ...credentials, sessionId: target.id });
      setSessions((items) =>
        items.map((item) =>
          item.id === target.id
            ? {
                ...item,
                hostedRooms: [...(item.hostedRooms || []), credentials],
                updated: Date.now(),
              }
            : item,
        ),
      );
      setSessionId(target.id);
      live.setRoom(reply.state!);
      setSelected(0);
      setPage("studio");
      setPresenting(true);
      setModal(null);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function startCrowdSession(crowdKind: Kind) {
    setBusy(true);
    setError("");
    try {
      const created: Session = {
        ...newSession("blank"),
        title: "Player-made questions",
      };
      const reply = await request("room:create", {
        title: created.title,
        questions: created.questions,
        crowdKind,
      });
      const credentials = { code: reply.state!.code, token: reply.token! };
      live.saveCredentials({ ...credentials, sessionId: created.id });
      setSessions((items) => [
        ...items,
        { ...created, hostedRooms: [credentials] },
      ]);
      setSessionId(created.id);
      live.setRoom(reply.state!);
      setSelected(0);
      setPage("studio");
      setPresenting(true);
      setModal(null);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  /** Hosts the session of the finished room again, with a fresh room code and no responses. */
  async function restartSession() {
    if (!room?.ended) return;
    if (room.crowd) {
      await startCrowdSession(room.crowd.kind);
      return;
    }
    const original = sessions.find((item) =>
      item.hostedRooms?.some((entry) => entry.code === room.code),
    );
    if (!original) {
      setError("This session is no longer saved on this device.");
      return;
    }
    await startSession(undefined, original);
  }
  async function control(action: string, index?: number) {
    setBusy(true);
    setError("");
    try {
      const reply = await request("room:control", {
        ...live.credentials(),
        action,
        index,
      });
      live.setRoom(reply.state!);
      if (action === "end") {
        setPresenting(false);
        setPage("results");
        setModal(null);
      } else if (action === "reset") setModal(null);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(direction: number) {
    const destination = currentIndex + direction;
    if (destination < 0 || destination >= questionList.length) return;
    if (isLive) void control("select", destination);
    else setSelected(destination);
  }
  function reorder(direction: number) {
    const destination = currentIndex + direction;
    if (destination < 0 || destination >= session.questions.length) return;
    const questions = [...session.questions];
    [questions[currentIndex], questions[destination]] = [
      questions[destination],
      questions[currentIndex],
    ];
    updateSession({ questions });
    setSelected(destination);
  }
  function moveQuestion(from: number, to: number) {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= session.questions.length ||
      to >= session.questions.length
    )
      return;
    const questions = [...session.questions];
    const [moved] = questions.splice(from, 1);
    questions.splice(to, 0, moved);
    updateSession({ questions });
    setSelected(to);
  }
  function setBackground(file: File | null) {
    const id = session.id;
    if (file && !file.type.startsWith("image/")) {
      setNotice("Choose an image file.");
      return;
    }
    setBackgrounds((current) => {
      if (current[id]) URL.revokeObjectURL(current[id]);
      const { [id]: _removed, ...rest } = current;
      return file ? { ...rest, [id]: URL.createObjectURL(file) } : rest;
    });
  }
  function setWash(value: number) {
    setWashes((current) => ({ ...current, [session.id]: value }));
  }
  /** Enter the presentation view and the browser's fullscreen, or leave both. */
  function presentFullscreen() {
    if (fullscreen.fullscreen) {
      void fullscreen.exit();
      return;
    }
    setPresenting(true);
    void fullscreen.enter();
  }
  return {
    music,
    backgrounds,
    setBackground,
    washes,
    setWash,
    sessions,
    setSessions,
    sessionId,
    setSessionId,
    selected,
    setSelected,
    page,
    setPage,
    modal,
    setModal,
    deletingSession,
    setDeletingSession,
    deleteError,
    setDeleteError,
    emptySession,
    editing,
    setEditing,
    presenting,
    setPresenting,
    fullscreen,
    presentFullscreen,
    busy,
    setBusy,
    search,
    setSearch,
    notice,
    setNotice,
    insertIndex,
    setInsertIndex,
    dragIndex,
    setDragIndex,
    dragOverIndex,
    setDragOverIndex,
    live,
    room,
    connected,
    error,
    setError,
    session,
    currentIndex,
    question,
    isLive,
    inLobby,
    questionList,
    restoreSessionRoom,
    updateSession,
    createSession,
    confirmDeleteSession,
    deleteSession,
    startSession,
    startCrowdSession,
    restartSession,
    control,
    move,
    reorder,
    moveQuestion,
  };
}

export type HostController = ReturnType<typeof useHostController>;
