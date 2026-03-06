const modules = import.meta.glob("../assets/presets/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Record<string, unknown>>;

function nameFromPath(path: string): string {
  return path.split("/").pop()!.replace(/\.json$/, "");
}

export function listPresetNames(): string[] {
  return Object.keys(modules).map(nameFromPath).sort();
}

export function loadPresetJson(name: string): string | null {
  const entry = Object.entries(modules).find(
    ([p]) => nameFromPath(p) === name,
  );
  return entry ? JSON.stringify(entry[1]) : null;
}
