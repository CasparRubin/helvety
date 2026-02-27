/**
 * Supabase database types.
 *
 * This file must be generated from your linked Supabase project:
 * `npx supabase gen types typescript --linked > packages/shared/src/types/database.types.ts`
 */

export interface Database {}

type GeneratedDatabaseGuard = keyof Database extends never
  ? "ERROR: Supabase types are not generated. Run: npx supabase gen types typescript --linked > packages/shared/src/types/database.types.ts"
  : true;

const generatedDatabaseGuard: GeneratedDatabaseGuard = true;
void generatedDatabaseGuard;

export type DatabaseSchema = Database;
