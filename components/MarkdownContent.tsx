"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiCheck, FiCopy } from "react-icons/fi";

import { useQuery } from "@tanstack/react-query";
import { usersListQueryOptions } from "@/utils/queries/users";

import { remarkMentions } from "@/utils/remarkMentions";
import { remarkExtras } from "@/utils/remarkExtras";

const UUID_MENTION_RE =
  /@\[user:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]/g;

interface MarkdownContentProps {
  content?: string | null;
  className?: string;
}





function isImageUrl(url?: string): boolean {
  return Boolean(url && /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url));
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

function Spoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setRevealed((prev) => !prev)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRevealed((prev) => !prev);
        }
      }}
      title={revealed ? "Click to hide spoiler" : "Click to reveal spoiler"}
      className={`inline cursor-pointer rounded px-1.5 py-0.5 transition ${
        revealed
          ? "bg-white/10 text-gray-100"
          : "bg-zinc-700 text-transparent select-none blur-[4px] hover:bg-zinc-600"
      }`}
    >
      <span className={revealed ? "" : "opacity-0"}>{children}</span>
    </span>
  );
}

function SpoilerMedia({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative my-2 inline-block max-w-full overflow-hidden rounded-lg border border-gray-700 bg-black/40">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`max-h-60 max-w-full object-contain transition duration-200 ${
          revealed ? "" : "blur-xl scale-105 brightness-50"
        }`}
      />
      <button
        type="button"
        onClick={() => setRevealed((prev) => !prev)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center text-xs font-medium text-gray-100 transition hover:bg-black/20"
      >
        {!revealed && <span className="rounded-md border border-white/15 bg-zinc-900/90 px-2.5 py-1">
          Spoiler image · Click to reveal
        </span>}
        {!revealed && alt && (
          <span className="max-w-xs truncate rounded bg-black/70 px-2 py-0.5 text-[11px] text-gray-300">
            {alt}
          </span>
        )}
      </button>
    </div>
  );
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
  const mentionedIdsList = useMemo(() => {
    if (!content) return [];
    const ids = new Set<string>();
    for (const match of content.matchAll(UUID_MENTION_RE)) {
      ids.add(match[1]);
    }
    return Array.from(ids).sort();
  }, [content]);

  const { data: mentionedUsers = [] } = useQuery(
    usersListQueryOptions(mentionedIdsList)
  );

  const usernames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of mentionedUsers) {
      if (row.username) {
        map[row.id] = row.username;
      }
    }
    return map;
  }, [mentionedUsers]);

  if (!content) return null;

  return (
    <div className={`text-base leading-relaxed space-y-2 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMentions, [remarkExtras, content]]}
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
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-gray-100 mt-2 mb-1">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-xs font-semibold text-gray-100 mt-2 mb-1">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs text-gray-400 mt-2 mb-1">{children}</h6>
          ),
          p: ({ children }) => (
            <p className="whitespace-pre-wrap break-words">{children}</p>
          ),
          span: ({ children, ...props }) => {
            const customProps = props as Record<string, unknown>;
              if (customProps["data-spoiler"] === "true" || customProps["data-spoiler"] === true) {
                return <Spoiler>{children}</Spoiler>;
              }

              return <span>{children}</span>;
            },
          sup: ({ children }) => (
            <sup className="ml-0.5 align-super text-[0.72em] text-gray-300">
              {children}
            </sup>
          ),
          u: ({ children }) => (
            <u className="underline decoration-gray-400 underline-offset-2">
              {children}
            </u>
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

            const labelText = extractText(children).trim();
            const isBareLink = Boolean(href && labelText === href);

            if (isBareLink && isImageUrl(href)){
              return (
                <img
                src={href}
                loading="lazy"
                className="my-2 max-h-60 max-w-full rounded-lg border border-gray-700 object-contain"
                />
              )
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
            if (typeof src !== "string" ||!src) return null;
            
            const rawAlt = alt ?? "";
            const isSpoilerAlt = /^spoiler:\s*/i.test(rawAlt);
            const cleanAlt = rawAlt.replace(/^spoiler:\s*/i, "").trim();

            if (isSpoilerAlt) {
              return <SpoilerMedia src={src} alt={cleanAlt} />;
            }

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
