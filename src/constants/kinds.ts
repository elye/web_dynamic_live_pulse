import { type LucideIcon } from "lucide-react";
import { definitionOf, kinds, type Kind } from "../questions";
import { metaOf } from "../questions/ui/metaRegistry";

export const icons = Object.fromEntries(
  kinds.map((kind) => [kind, metaOf(kind).icon]),
) as Record<Kind, LucideIcon>;

const definitions = kinds.map((kind) => definitionOf(kind));

export const kindHints = Object.fromEntries(
  definitions.map((definition) => [definition.kind, definition.hint]),
) as Record<Kind, string>;

/** Questions without a right answer show responses live; questions with one are scored and ranked. */
export const kindGroups: { title: string; hint: string; kinds: Kind[] }[] = [
  {
    title: "Without an answer",
    hint: "Gather opinions and ideas. Responses can show live or after reveal.",
    kinds: definitions
      .filter((definition) => !definition.traits.scored)
      .map((definition) => definition.kind as Kind),
  },
  {
    title: "With an answer",
    hint: "Score players. Responses stay hidden and a top 10 ranking follows.",
    kinds: definitions
      .filter((definition) => definition.traits.scored)
      .map((definition) => definition.kind as Kind),
  },
];

/** Question types a player can write themselves. */
export const crowdGroups = kindGroups.map((group) => ({
  ...group,
  kinds: group.kinds.filter(
    (kind) => definitionOf(kind).traits.playerAuthorable,
  ),
}));
