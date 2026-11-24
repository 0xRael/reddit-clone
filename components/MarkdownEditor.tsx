"use client";

import { useRef, useState } from "react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiCode,
  FiLink,
  FiList,
  FiEyeOff,
} from "react-icons/fi";
import { LuStrikethrough } from "react-icons/lu";
import { TbSuperscript } from "react-icons/tb";
import { VscQuote } from "react-icons/vsc";
import { MarkdownContent } from "@/components/MarkdownContent";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClass?: string;
}

type ToolbarItem =
  | { type: "divider" }
  | {
      type?: "button";
      title: string;
      icon: React.ReactNode;
      onClick: () => void;
    };

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write something...",
  minHeightClass = "min-h-30",
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement | null >(null);

  function setSelectionAfterUpdate(
    el: HTMLTextAreaElement,
    nextValue: string,
    nextStart: number,
    nextEnd: number
  ) {
    onChange(nextValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextStart, nextEnd);
    });
  }

  function applyWrap(prefix: string, suffix = prefix, fallback = "text") {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);

    let nextValue: string;
    let nextStart: number;
    let nextEnd: number;

    if (
      selected.length >= prefix.length + suffix.length &&
      selected.startsWith(prefix) &&
      selected.endsWith(suffix)
    ) {
      const inner = selected.slice(
        prefix.length,
        selected.length - suffix.length
      );
      nextValue = value.slice(0, start) + inner + value.slice(end);
      nextStart = start;
      nextEnd = start + inner.length;
    } else if (
      start >= prefix.length &&
      end + suffix.length <= value.length &&
      value.slice(start - prefix.length, start) === prefix &&
      value.slice(end, end + suffix.length) === suffix
    ) {
      const replaceStart = start - prefix.length;
      const replaceEnd = end + suffix.length;
      nextValue =
        value.slice(0, replaceStart) + selected + value.slice(replaceEnd);
      nextStart = replaceStart;
      nextEnd = replaceStart + selected.length;
    } else {
      const target = selected || fallback;
      nextValue =
        value.slice(0, start) + prefix + target + suffix + value.slice(end);
      nextStart = start + prefix.length;
      nextEnd = nextStart + target.length;
    }

    setSelectionAfterUpdate(el, nextValue, nextStart, nextEnd);
  }

  const MD_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const IMAGE_URL_RE =
  /(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?[^\s)]*)?)/gi;

function removeOrAddPrefix(
  prefix: string,
  suffix: string,
  text: string
): string {
  if (
    text.length >= prefix.length + suffix.length &&
    text.startsWith(prefix) &&
    text.endsWith(suffix)
  ) {
    return text.slice(prefix.length, text.length - suffix.length);
  }
  return `${prefix}${text}${suffix}`;
}

function toggleSpoilerOnMdImage(alt: string, url: string): string {
  const trimmedAlt = alt.trim();
  const spoilerPrefixRe = /^spoiler:\s*/i;

  if (spoilerPrefixRe.test(trimmedAlt)) {
    const cleanAlt = trimmedAlt.replace(spoilerPrefixRe, "").trim() || "image";
    return `![${cleanAlt}](${url})`;
  }

  const label = trimmedAlt || "image";
  return `![spoiler: ${label}](${url})`;
}

function formatTextSegment(
  segment: string,
  prefix: string,
  suffix: string,
  forceWrap = false
): string {
  if (!segment) return "";

  let formatted = "";
  let lastIndex = 0;

  for (const match of segment.matchAll(IMAGE_URL_RE)) {
    const matchIndex = match.index ?? 0;
    const url = match[0];

    const chunk = segment.slice(lastIndex, matchIndex);
    formatted += wrapTextPreservingWhitespace(chunk, prefix, suffix, forceWrap);
    formatted += `![spoiler: image](${url})`;
    lastIndex = matchIndex + url.length;
  }

  const trailing = segment.slice(lastIndex);
  formatted += wrapTextPreservingWhitespace(trailing, prefix, suffix, forceWrap);

  return formatted;
}
function wrapTextPreservingWhitespace(
  chunk: string,
  prefix: string,
  suffix: string,
  forceWrap = false
): string {
  if (!chunk) return "";

  const m = chunk.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m) return chunk;

  const [, leadingWs, core, trailingWs] = m;
  if (!core) {
    return chunk; // Pure whitespace/newlines stay untouched
  }

  const wrappedCore = forceWrap
    ? `${prefix}${core}${suffix}`
    : removeOrAddPrefix(prefix, suffix, core);

  return `${leadingWs}${wrappedCore}${trailingWs}`;
}

function applySpoiler(openTag = "||", closeTag = "||") {
  const el = textareaRef.current;
  if (!el) return;

  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = value.slice(start, end);

  if (!selected) {
    const placeholder = "spoiler";
    const inserted = `${openTag}${placeholder}${closeTag}`;
    const nextValue = value.slice(0, start) + inserted + value.slice(end);
    setSelectionAfterUpdate(
      el,
      nextValue,
      start + openTag.length,
      start + openTag.length + placeholder.length
    );
    return;
  }

  // 1. Detect ![alias](url) images first
  const mdImageMatches = Array.from(selected.matchAll(MD_IMAGE_RE));
  let formatted = "";
  let lastIndex = 0;

  for (const match of mdImageMatches) {
    const matchIndex = match.index ?? 0;
    const fullMatch = match[0];
    const alt = match[1] ?? "";
    const url = match[2] ?? "";

    const before = selected.slice(lastIndex, matchIndex);
    formatted += formatTextSegment(before, openTag, closeTag);
    formatted += toggleSpoilerOnMdImage(alt, url);

    lastIndex = matchIndex + fullMatch.length;
  }

  const after = selected.slice(lastIndex);
  // If there were no ![alias](url) matches, let formatTextSegment toggle normally;
  // if there were images, wrap/toggle surrounding text segments cleanly too.
  formatted += formatTextSegment(after, openTag, closeTag, false);

  const nextValue = value.slice(0, start) + formatted + value.slice(end);
  setSelectionAfterUpdate(el, nextValue, start, start + formatted.length);
}
  function applyCodeBlock() {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);

    const openFence = "```\n";
    const closeFence = "\n```";

    // Toggle off if selection is a fenced code block
    if (
      selected.startsWith("```") &&
      selected.endsWith("```") &&
      selected.length >= 6
    ) {
      const inner = selected
        .replace(/^```[^\n]*\n?/, "")
        .replace(/\n?```$/, "");
      const nextValue = value.slice(0, start) + inner + value.slice(end);
      setSelectionAfterUpdate(el, nextValue, start, start + inner.length);
      return;
    }

    const target = selected || "code";
    const inserted = `${openFence}${target}${closeFence}`;
    const nextValue = value.slice(0, start) + inserted + value.slice(end);
    const nextStart = start + openFence.length;
    setSelectionAfterUpdate(el, nextValue, nextStart, nextStart + target.length);
  }

  function applyLinePrefix(prefix: string) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const nextNewline = value.indexOf("\n", end);
    const lineEnd = nextNewline === -1 ? value.length : nextNewline;

    const currentLine = value.slice(lineStart, lineEnd);
    const isHeaderPrefix = /^#{1,6}\s+$/.test(prefix);

    let nextLine: string;

    if (currentLine.startsWith(prefix)) {
      nextLine = currentLine.slice(prefix.length);
    } else if (isHeaderPrefix && /^#{1,6}\s+/.test(currentLine)) {
      nextLine = currentLine.replace(/^#{1,6}\s+/, prefix);
    } else {
      nextLine = prefix + currentLine;
    }

    const nextValue =
      value.slice(0, lineStart) + nextLine + value.slice(lineEnd);
    const delta = nextLine.length - currentLine.length;

    const clampedStart = Math.max(lineStart, start + delta);
    const clampedEnd = Math.max(clampedStart, end + delta);
    setSelectionAfterUpdate(el, nextValue, clampedStart, clampedEnd);
  }

  async function applyLink() {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);

    let clipboardUrl = "";
    try {
      const clipText = (await navigator.clipboard?.readText())?.trim() ?? "";
      if (/^https?:\/\//i.test(clipText)) {
        clipboardUrl = clipText;
      }
    } catch {
      // Clipboard permission denied or unavailable—fall back to default template
    }

    if (clipboardUrl) {
      const label = selected || "link text";
      const inserted = `[${label}](${clipboardUrl})`;
      const nextValue = value.slice(0, start) + inserted + value.slice(end);
      const labelStart = start + 1;
      setSelectionAfterUpdate(
        el,
        nextValue,
        labelStart,
        labelStart + label.length
      );
      return;
    }

    const label = selected || "link text";
    const fallbackUrl = "https://";
    const inserted = `[${label}](${fallbackUrl})`;
    const nextValue = value.slice(0, start) + inserted + value.slice(end);
    const urlStart = start + label.length + 3;
    setSelectionAfterUpdate(
      el,
      nextValue,
      urlStart,
      urlStart + fallbackUrl.length
    );
  }

  const toolbarItems: ToolbarItem[] = [
    {
      title: "Bold (Ctrl+B)",
      icon: <FiBold size={15}/>,
      onClick: () => applyWrap("**", "**", "bold"),
    },
    {
      title: "Italic (Ctrl+I)",
      icon: <FiItalic size={15}/>,
      onClick: () => applyWrap("*", "*", "italic"),
    },
    {
      title: "Underline (Ctrl+U)",
      icon: <FiUnderline size={15}/>,
      onClick: () => applyWrap("__", "__", "underline"),
    },
    {
      title: "Strikethrough (Ctrl+S)",
      icon: <LuStrikethrough size={15}/>,
      onClick: () => applyWrap("~~", "~~", "strikethrough"),
    },
    {
      title: "Superscript",
      icon: <TbSuperscript size={15}/>,
      onClick: () => applyWrap("^(", ")", "superscript"),
    },
    {
      title: "Heading 1",
      icon: <span className="text-xs font-bold px-0.5">H1</span>,
      onClick: () => applyLinePrefix("# "),
    },
    {
      title: "Heading 2",
      icon: <span className="text-xs font-bold px-0.5">H2</span>,
      onClick: () => applyLinePrefix("## "),
    },
    {
      title: "Heading 3",
      icon: <span className="text-xs font-bold px-0.5">H3</span>,
      onClick: () => applyLinePrefix("### "),
    },
    { type: "divider" },
    {
      title: "Spoiler",
      icon: <FiEyeOff size={15}/>,
      onClick: () => applySpoiler("||", "||"),
    },
    {
      title: "Inline Code",
      icon: <FiCode size={15}/>,
      onClick: () => applyWrap("`", "`", "code"),
    },
    {
      title: "Code Block",
      icon: <span className="text-[11px] font-mono font-semibold px-0.5">{"```"}</span>,
      onClick: applyCodeBlock,
    },
    {
      title: "Quote",
      icon: <VscQuote size={15} />,
      onClick: () => applyLinePrefix("> "),
    },
    {
      title: "Link",
      icon: <FiLink size={15} />,
      onClick: applyLink,
    },
    {
      title: "Bullet List",
      icon: <FiList size={15} />,
      onClick: () => applyLinePrefix("- "),
    },
  ];

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey)) return;

    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      applyWrap("**", "**", "bold text");
    } else if (key === "i") {
      e.preventDefault();
      applyWrap("*", "*", "italic text");
    } else if (key === "u") {
      e.preventDefault();
      applyWrap("__", "__", "underlined text");
    }
  }

  return (
    <div className="group w-full rounded-xl border border-gray-700 hover:border-gray-500 focus-within:border-gray-400 overflow-hidden bg-transparent">
      {/* Toolbar + Write/Preview Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-700 bg-white/[0.03] px-2 py-1.5">
        {tab === "write" ? (
          <div className="flex items-center flex-wrap gap-0.5 text-gray-300">
            {toolbarItems.map((item, idx) =>
              item.type === "divider" ? (
                <div
                  key={`divider-${idx}`}
                  className="mx-1 h-4 w-px bg-gray-700"
                />
              ) : (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.onClick}
                  title={item.title}
                  className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                >
                  {item.icon}
                </button>
              )
            )}
          </div>
        ) : (
          <span className="px-2 text-xs text-gray-400">Preview</span>
        )}

        {/* Write / Preview Switch */}
        <div className="flex items-center rounded-lg bg-white/5 p-0.5 text-xs">
          {(["write", "preview"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTab(mode)}
              className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                tab === mode
                  ? "bg-white/15 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Body */}
      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`block w-full bg-transparent p-3 text-sm focus:outline-none placeholder:text-gray-400 ${minHeightClass}`}
        />
      ) : (
        <div className={`p-3 ${minHeightClass}`}>
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm text-gray-500">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
