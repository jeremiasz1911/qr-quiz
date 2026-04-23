import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nowTs() {
  return Date.now();
}

export function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getOrCreateVoterToken() {
  if (typeof window === "undefined") {
    return "";
  }
  const key = "live-poll-voter-token";
  const current = localStorage.getItem(key);
  if (current) {
    return current;
  }
  const created = `voter_${crypto.randomUUID()}`;
  localStorage.setItem(key, created);
  return created;
}

