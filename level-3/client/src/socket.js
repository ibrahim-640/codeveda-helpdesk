import { io } from "socket.io-client";

// Same origin as the page, so the httpOnly cookie is sent automatically
export const socket = io({ autoConnect: false });