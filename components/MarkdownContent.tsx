"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiCheck, FiCopy } from "react-icons/fi";
import { createClient } from "@/utils/supabase/component";
import { remarkMentions } from "@/utils/remarkMentions";

const UUID_MENTION_RE =
  /@\[user:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]/g;

const usernameCache = new Map<string, string>();

interface MarkdownContentProps {
  content?: string | null;
  className?: string;
}

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

function CodeBlockPre({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const rawCode = extractText(children).replace(/\n$/, "");
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code block:", err);
    }
  }

  return (
    <div className="group relative my-2">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-gray-700 bg-zinc-900/90 px-2 py-1 text-xs text-gray-300 opacity-80 transition hover:bg-zinc-800 hover:text-white group-hover:opacity-100"
      >
        {copied ? (
          <>
            <FiCheck className="text-emerald-400"/>
            <span>Copied</span>
          </>
        ) : (
          <>
            <FiCopy/>
            <span>Copy</span>
          </>
        )}
      </button>
      <pre className="overflow-x-auto rounded-lg border border-gray-700 bg-black/50 p-3 pr-20 font-mono text-xs text-gray-100">
        {children}
      </pre>
    </div>
  );
}

export function MarkdownContent({
  content,
  className = "",
}: MarkdownContentProps) {
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
    <div className={`text-base leading-relaxed space-y-2 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMentions]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-100 mt-3 mb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-gray-100 mt-3 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-100 mt-2 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="whitespace-pre-wrap break-words">{children}</p>
          ),
          pre: ({ children }) => <CodeBlockPre>{children}</CodeBlockPre>,
          a: ({ href, children, ...props }) => {
            const mentionId = (props as Record<string, unknown>)["data-mention-id"];
            if (typeof mentionId === "string") {
              const displayLabel = usernames[mentionId]
                ? `@${usernames[mentionId]}`
                : `@${mentionId.slice(0, 8)}...`;

              return (
                <Link
                  href={`/user/${mentionId}`}
                  className="inline-block rounded bg-sky-500/15 px-1.5 py-0.5 font-medium text-sky-300 hover:bg-sky-500/25"
                >
                  {displayLabel}
                </Link>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline hover:text-sky-300"
              >
                {children}
              </a>
            );
          },  
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-1">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-5 border-gray-500 pl-3 text-gray-400 my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 w-full overflow-x-auto rounded-lg border border-gray-700">
              <table className="w-full border-collapse text-left text-sm text-gray-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-gray-200">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-800">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/5 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border-b border-gray-700 px-3 py-2 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top">{children}</td>
          ),
          img: ({ src, alt }) => {
            if (!src) return null;
            return (
              <img
                src={src}
                alt={alt ?? ""}
                loading="lazy"
                className="my-2 max-h-60 max-w-full rounded-lg border border-gray-700 object-contain"
              />
            );
          },
          code: ({ className: codeClassName, children }) => {
            const isBlock = Boolean(codeClassName);
            if (!isBlock) {
              return (
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-orange-200">
                  {children}
                </code>
              );
            }
            return (
              <code className="font-mono text-xs text-gray-100">
                {children}
              </code>
            );
          },
          hr: () => <hr className="border-gray-700 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
