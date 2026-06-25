import type { Database, CardType } from "./database.types";

export type { CardType };

export type Space = Database["public"]["Tables"]["spaces"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type Reaction = Database["public"]["Tables"]["reactions"]["Row"];
export type Reply = Database["public"]["Tables"]["replies"]["Row"];

/** A card enriched with the data the board needs to render it. */
export interface CardWithMeta extends Card {
  author?: Profile | null;
  reactions: Reaction[];
  reply_count: number;
}
