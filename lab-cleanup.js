const labConsoleBlockIndex = LAB_BLOCKED_TERRAIN.findIndex((rect) => rect.name === "weird-console");

if (labConsoleBlockIndex >= 0) {
  LAB_BLOCKED_TERRAIN.splice(labConsoleBlockIndex, 1);
}
