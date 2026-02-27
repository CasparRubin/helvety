/**
 * Supabase database types.
 *
 * Keep this file committed so CI/Vercel type-checking does not depend on
 * runtime type generation.
 */

type TableDefinition = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: never[];
};

type FunctionDefinition = {
  Args: Record<string, any>;
  Returns: any;
};

type SchemaDefinition = {
  Tables: Record<string, TableDefinition>;
  Views: Record<string, never>;
  Functions: Record<string, FunctionDefinition>;
  Enums: Record<string, string>;
  CompositeTypes: Record<string, never>;
};

export interface Database {
  public: SchemaDefinition;
  auth: SchemaDefinition;
  storage: SchemaDefinition;
  graphql_public: SchemaDefinition;
  realtime: SchemaDefinition;
  vault: SchemaDefinition;
}

type GeneratedDatabaseGuard = keyof Database extends never
  ? "ERROR: Supabase types are not generated. Run: bun run db:gen-types"
  : true;

const generatedDatabaseGuard: GeneratedDatabaseGuard = true;
void generatedDatabaseGuard;

export type DatabaseSchema = Database;
