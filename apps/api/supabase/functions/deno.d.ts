// Type definitions for Deno APIs
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Type declarations for Deno-specific imports
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
      fetch?: typeof fetch;
    };
  }

  export interface SupabaseClient {
    from: (table: string) => {
      select: (columns?: string) => any;
      insert: (values: any) => any;
      update: (values: any) => any;
      delete: () => any;
      eq: (column: string, value: any) => any;
      single: () => any;
      order: (column: string, options?: { ascending?: boolean }) => any;
      limit: (count: number) => any;
      range: (from: number, to: number) => any;
      rpc: (fn: string, params?: any) => any;
    };
    auth: {
      getUser: () => Promise<{ data: { user: any }, error: any }>;
    };
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions
  ): SupabaseClient;
} 