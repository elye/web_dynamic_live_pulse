import { type Kind } from "../../model";
import { authorOf } from "../../questions/ui/authorRegistry";

export type { Authored } from "../../questions/ui/author";

/** An empty draft of a player-written question of the given kind. */
export function blankAuthored(kind: Kind) {
  return authorOf(kind).blank();
}
