"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/utils/supabase/component";
import { remarkMentions } from "@/utils/remarkMentions";
import { remarkExtras } from "@/utils/remarkExtras";

const UUID_MENTION_RE =
  /@\[user:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]/g;

// Shared module cache so PostList and Notification don't re-fetch known users
const usernameCache = new Map<string, string>();

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }
  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return "";
}

function CompactSpoiler({
  children,
  spoilerFrom,
}: {
  children: React.ReactNode;
  spoilerFrom?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span className="inline-flex items-center gap-1 align-baseline">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevents clicking a PostList card or Notification from navigating accidentally
          setRevealed((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setRevealed((prev) => !prev);
          }
        }}
        title={
          spoilerFrom
            ? `Spoiler (${spoilerFrom}) — click to ${revealed ? "hide" : "reveal"}`
            : `Click to ${revealed ? "hide" : "reveal"} spoiler`
        }
        className={`inline cursor-pointer rounded px-1 text-xs transition ${
          revealed
            ? "bg-white/15 text-gray-100"
            : "bg-zinc-700 text-transparent select-none blur-[4px]"
        }`}
      >
        <span className={revealed ? "" : "opacity-0"}>{children}</span>
      </span>
      {spoilerFrom && (
        <span className="rounded bg-amber-500/15 px-1 text-[10px] text-amber-300">
          {spoilerFrom}
        </span>
      )}
    </span>
  );
}

interface MarkdownExcerptProps {
  content?: string | null;
  className?: string;
  /** Optional: hide fenced code blocks & images completely in tight previews like notifications */
  hideMediaAndCodeBlocks?: boolean;
}

export function MarkdownExcerpt({
  content,
  className = "",
  hideMediaAndCodeBlocks = true,
}: MarkdownExcerptProps) {
  const [usernames, setUsernames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [id, name] of usernameCache.entries()) {
      initial[id] = name;
    }
    return initial;
  });

  const mentionedIds = useMemo(() => {
    if (!content) return [];
    const ids = new Set<string>();
    for (const match of content.matchAll(UUID_MENTION_RE)) {
      ids.add(match[1]);
    }
    return Array.from(ids);
  }, [content]);

  useEffect(() => {
    const missing = mentionedIds.filter((id) => !usernameCache.has(id));
    if (missing.length === 0) return;

    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("users")
      .select("id, username")
      .in("id", missing)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        for (const row of data) {
          usernameCache.set(row.id, row.username);
        }
        setUsernames((prev) => {
          const next = { ...prev };
          for (const row of data) {
            next[row.id] = row.username;
          }
          return next;
        });
      });

    return () => {
      cancelled = true;
    };
  }, [mentionedIds]);

  if (!content) return null;

  return (
    <span className={`inline break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMentions, [remarkExtras, content]]}
        components={
          {
            // Paragraph & blocks flattened into inline/light text flow
            p: ({ children }) => <span>{children} </span>,
            h1: ({ children }) => <span className="font-semibold">{children} </span>,
            h2: ({ children }) => <span className="font-semibold">{children} </span>,
            h3: ({ children }) => <span className="font-semibold">{children} </span>,
            h4: ({ children }) => <span className="font-semibold">{children} </span>,
            h5: ({ children }) => <span className="font-semibold">{children} </span>,
            h6: ({ children }) => <span className="font-semibold">{children} </span>,
            blockquote: ({ children }) => <span>{children} </span>,
            ul: ({ children }) => <span>{children} </span>,
            ol: ({ children }) => <span>{children} </span>,
            li: ({ children }) => <span>{children} · </span>,
            hr: () => null,

            // Tables flattened into readable text
            table: ({ children }) => <span>{children} </span>,
            thead: ({ children }) => <span>{children}</span>,
            tbody: ({ children }) => <span>{children}</span>,
            tr: ({ children }) => <span>{children} · </span>,
            th: ({ children }) => <span>{children} </span>,
            td: ({ children }) => <span>{children} </span>,

            // Allowed formatting
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            u: ({ children }) => (
              <u className="underline underline-offset-2">{children}</u>
            ),
            del: ({ children }) => <del className="line-through">{children}</del>,
            sup: ({ children }) => (
              <sup className="text-[0.72em] align-super">{children}</sup>
            ),
            span: ({ children, ...props }) => {
            const customProps = props as Record<string, unknown>;
              if (customProps["data-spoiler"] === "true" || customProps["data-spoiler"] === true) {
                return <CompactSpoiler>{children}</CompactSpoiler>;
              }

              return <span>{children}</span>;
            },

            // Code blocks vs inline code
            pre: ({ children }) =>
              hideMediaAndCodeBlocks ? null : <span>{extractText(children)} </span>,
            code: ({ className: codeClassName, children }) => {
              const isBlock = Boolean(codeClassName);
              if (isBlock) {
                return hideMediaAndCodeBlocks ? null : <span>{children}</span>;
              }
              return (
                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]">
                  {children}
                </code>
              );
            },

            // Images & links -> plain text (or omitted for images)
            img: ({ alt }) =>
              hideMediaAndCodeBlocks ? null : <span>{alt ?? ""}</span>,
            a: ({ href, children, ...props }) => {
              const customProps = props as Record<string, unknown>;
              const mentionId = customProps["data-mention-id"];
              if (typeof mentionId === "string") {
                const label = usernames[mentionId]
                  ? `@${usernames[mentionId]}`
                  : `@${mentionId.slice(0, 8)}...`;
                return <span className="font-medium">{label}</span>;
              }

              const label = extractText(children).trim() || href || "";
              return <span>{label}</span>;
            },
          } as Record<string, React.ComponentType<any>>
        }
      >
        {content}
      </ReactMarkdown>
    </span>
  );
}
