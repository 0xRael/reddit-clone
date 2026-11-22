import { findAndReplace } from "mdast-util-find-and-replace";
import type { Root } from "mdast";

// Matches @[user:<uuid>] (adjust pattern if your user IDs are numeric/other strings)
const MENTION_TOKEN_REGEX =
  /@\[user:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]/g;

export function remarkMentions() {
  return (tree: Root) => {
    findAndReplace(tree, [
      [
        MENTION_TOKEN_REGEX,
        (_fullMatch: string, userId: string) => {
          return [
            {
              type: "link" as const,
              url: `/user/${userId}`,
              data: {
                hProperties: {
                  "data-mention-id": userId,
                },
              },
              children: [{ type: "text" as const, value: `@${userId}` }],
            },
          ];
        },
      ],
    ]);
  };
}
