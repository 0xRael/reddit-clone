import { findAndReplace } from "mdast-util-find-and-replace";
import { visit } from "unist-util-visit";
import type { Root, Strong } from "mdast";

const SPOILER_RE = /\|\|([^|\n]+?)\|\||>!([^!\n]+?)!</g;
const SUPERSCRIPT_RE = /(?:^|(?<!\^))\^(?:\(([^)\n]+)\)|([^\s()^]+))/g;

function makeInlineNode(
  hName: string,
  text: string,
  hProperties: Record<string, string> = {}
) {
  return {
    type: "strong" as const,
    data: {
      hName,
      hProperties,
    },
    children: [{ type: "text" as const, value: text }],
  };
}

function applyDoubleUnderscoreUnderline(tree: Root, sourceText?: string) {
  if (!sourceText) return;

  visit(tree, "strong", (node: Strong) => {
    const start = node.position?.start?.offset;
    const end = node.position?.end?.offset;
    if (typeof start !== "number" || typeof end !== "number") return;

    const rawSlice = sourceText.slice(start, end);
    if (rawSlice.startsWith("__") && rawSlice.endsWith("__")) {
      node.data = {
        ...node.data,
        hName: "u",
      };
    }
  });
}

export function remarkExtras(sourceText?: string) {
  return (tree: Root) => {
    findAndReplace(tree, [
      [
        SPOILER_RE,
        (_full: string, pipeText?: string, bangText?: string) => {
          const content = (pipeText ?? bangText ?? "").trim();
          if (!content) return false;
          return makeInlineNode("span", content, {
            "data-spoiler": "true",
          });
        },
      ],
      [
        SUPERSCRIPT_RE,
        (_full: string, parenText?: string, wordText?: string) => {
          const content = (parenText ?? wordText ?? "").trim();
          if (!content) return false;
          return makeInlineNode("sup", content);
        },
      ],
    ]);

    applyDoubleUnderscoreUnderline(tree, sourceText);
  };
}
