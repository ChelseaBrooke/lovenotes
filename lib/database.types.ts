/**
 * Hand-written to mirror the Supabase schema in supabase/migrations.
 * Regenerate with `supabase gen types typescript` (or the MCP type generator)
 * once the project's data API is available, to keep this exact.
 */

export type CardType =
  | "poem"
  | "quote"
  | "screenshot"
  | "image"
  | "video"
  | "link";

/** Stationery chosen for a poem (preset ids; see lib/poemStyles.ts). */
export interface PoemStyleData {
  paper?: string;
  font?: string;
  ink?: string;
  frame?: string;
  texture?: string;
  size?: number;
}

export interface Database {
  public: {
    Tables: {
      spaces: {
        Row: {
          id: string;
          name: string | null;
          invite_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          invite_code?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["spaces"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          space_id: string | null;
          display_name: string | null;
          accent_color: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          space_id?: string | null;
          display_name?: string | null;
          accent_color?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          space_id: string;
          author_id: string;
          type: CardType;
          note: string | null;
          title: string | null;
          body: string | null;
          media_path: string | null;
          media_width: number | null;
          media_height: number | null;
          url: string | null;
          link_title: string | null;
          link_author: string | null;
          link_thumbnail_url: string | null;
          link_provider: string | null;
          style: PoemStyleData | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          author_id: string;
          type: CardType;
          note?: string | null;
          title?: string | null;
          body?: string | null;
          media_path?: string | null;
          media_width?: number | null;
          media_height?: number | null;
          url?: string | null;
          link_title?: string | null;
          link_author?: string | null;
          link_thumbnail_url?: string | null;
          link_provider?: string | null;
          style?: PoemStyleData | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cards"]["Insert"]>;
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reactions"]["Insert"]>;
        Relationships: [];
      };
      replies: {
        Row: {
          id: string;
          card_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["replies"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_space: {
        Args: { space_name?: string | null };
        Returns: Database["public"]["Tables"]["spaces"]["Row"];
      };
      join_space: {
        Args: { code: string };
        Returns: Database["public"]["Tables"]["spaces"]["Row"];
      };
      current_space_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: {
      card_type: CardType;
    };
    CompositeTypes: Record<string, never>;
  };
}
