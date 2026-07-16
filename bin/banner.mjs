/*! AI Paste Cleaner | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/ai-paste-cleaner */
// The Jayden Yoon ZK terminal mark, shared by every tool that has a
// command line. Three rows of box drawing, generated once with figlet
// (Calvin S) and embedded as static characters, so there is no runtime
// dependency. It prints to stderr, and only when that stream is an
// interactive terminal, so pipes, CI logs, and JSON output never see it.

export const BRAND_ART = [
  " ╦┌─┐┬ ┬┌┬┐┌─┐┌┐┌  ╦ ╦┌─┐┌─┐┌┐┌  ╔═╗╦╔═",
  " ║├─┤└┬┘ ││├┤ │││  ╚╦╝│ ││ ││││  ╔═╝╠╩╗",
  "╚╝┴ ┴ ┴ ─┴┘└─┘┘└┘   ╩ └─┘└─┘┘└┘  ╚═╝╩ ╩"
];

const CHARTREUSE = "\x1b[38;5;149m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

export function printBanner(toolLine, { stream = process.stderr, force = false } = {}) {
  if (!force && !stream.isTTY) return false;
  const paint = !process.env.NO_COLOR;
  const art = BRAND_ART.map((row) => (paint ? CHARTREUSE + row + RESET : row)).join("\n");
  const line = toolLine ? "\n" + (paint ? DIM + toolLine + RESET : toolLine) : "";
  stream.write("\n" + art + line + "\n\n");
  return true;
}
