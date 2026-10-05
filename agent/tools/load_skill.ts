// defaultTools: false removes Eve's built-in tools, including the one that loads
// skills. Re-export it so the files in agent/skills/ stay reachable.
export { default } from "eve/tools/load_skill";
