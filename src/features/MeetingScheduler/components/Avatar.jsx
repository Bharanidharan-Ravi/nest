import { initials, avatarColor } from "../utils/helpers";

/**
 * Circular avatar showing initials of a person's name.
 * @param {{ name: string, size?: "sm" | "md" }} props
 */
export default function Avatar({ name, size = "sm" }) {
  const sz =
    size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ${sz} ${avatarColor(name)}`}
    >
      {initials(name)}
    </span>
  );
}
