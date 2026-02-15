-- Comprehensive Supabase Database Export
-- Returns EVERYTHING about the database in a single JSON object
-- Perfect for documentation, version control, AI coding agents, and security audits
--
-- Usage: Run this in Supabase SQL Editor and copy the JSON output
--
-- REQUIRED EXTENSIONS (pre-installed on Supabase):
--   pg_net, vault (supabase_vault), pgsodium
--
-- NOTE: Foreign key queries use pg_constraint (pg_catalog) instead of
-- information_schema.constraint_column_usage, because the latter filters
-- by privilege and silently drops FKs referencing restricted schemas
-- (e.g. auth.users).
--
-- The output includes:
--   - Export Metadata: database version, size, export timestamp
--   - Schemas: all schemas with owner, ACL, object counts, API exposure
--   - Tables: columns, PKs, unique constraints, FKs (with ON DELETE/UPDATE),
--     check constraints, RLS status, owner, row counts, sizes, comments
--   - Policies: all RLS policies with USING and WITH CHECK expressions
--   - Foreign Keys: relationships between tables with ON DELETE/UPDATE rules
--   - Check Constraints: validation rules on columns
--   - Exclusion Constraints: exclusion rules on tables
--   - Indexes: all indexes with column details and definitions
--   - Functions: definitions, ACL, search_path, parallel safety, kind
--   - Triggers: timing, action, enabled state
--   - Views: definitions, updatability, owner, security_invoker flag
--   - Materialized Views: definitions, sizes, populated status
--   - Sequences: all sequences with current values
--   - Custom Types: enums, composites, domains, ranges
--   - Foreign Tables: FDW tables with server info (security risk in API)
--   - Foreign Servers: FDW server configurations
--   - Event Triggers: database-level DDL event triggers
--   - Rules: PostgreSQL rules that override DML behavior
--   - Storage: buckets, policies, tables, object summaries, functions
--   - Auth: tables, user count, MFA adoption, identity providers, audit logs
--   - Realtime: publications, published tables, realtime policies

--   - Vault: secret metadata (names/descriptions only, NOT values)
--   - Webhooks: database webhook triggers, supabase_functions schema

--   - PostgREST Config: exposed schemas, pre-request hooks, API settings
--   - Database Settings: security-relevant PostgreSQL configuration
--   - Table Statistics: row counts, dead tuples, vacuum/analyze times, sizes
--   - Column Privileges: column-level grants
--   - Extensions: installed PostgreSQL extensions
--   - Security Audit:
--       - Role grants: table-level permissions per role
--       - Function privileges: who can execute which functions
--       - Schema grants: schema-level USAGE permissions
--       - Default privileges: auto-granted permissions on new objects
--       - Roles: all database roles with attributes
--       - Role memberships: privilege inheritance chains
--       - Security Summary (replicates Supabase Security Advisor lints):
--           0001: Unindexed foreign keys
--           0002: auth.users exposed in views
--           0003: RLS policies without (SELECT ...) wrapper on auth calls
--           0004: Tables without primary keys
--           0006: Multiple permissive policies per command
--           0010: Security definer views (missing security_invoker)
--           0011: Functions with mutable search_path
--           0013: Tables without RLS in public schema
--           0014: Extensions installed in public schema
--           0015: RLS policies referencing user metadata
--           0016: Materialized views in API-exposed schemas
--           0017: Foreign tables in API-exposed schemas
--           0019: Insecure queues (pgmq) exposed in API
--           0023: Sensitive columns exposed without RLS
--           0024: Overly permissive RLS policies
--           Plus: tables with RLS but no policies, RLS not forced for owner,
--                 SECURITY DEFINER functions, policies targeting public role,
--                 tables with incomplete CRUD policies
--
-- IMPORTANT AUDIT LIMITATION (Supabase-managed internals):
-- Some schemas/tables are managed by Supabase and may not be fully mutable from
-- customer SQL (for example: graphql/graphql_public grants, auth.oauth_* RLS,
-- realtime.schema_migrations/subscription RLS). These can appear as findings in
-- exports even when your project-level hardening is correct.
--
-- Recommendation for future audits:
-- 1) Treat public/app schemas as actionable hard-fail scope.
-- 2) Treat managed-internal findings as "platform residual risk" unless Supabase
--    support/docs confirm they are customer-configurable for your project tier.

SELECT json_build_object(
  'export_metadata', json_build_object(
    'export_date', NOW(),
    'database_name', current_database(),
    'database_version', version(),
    'postgres_version', (SELECT setting FROM pg_settings WHERE name = 'server_version'),
    'database_size_bytes', pg_database_size(current_database()),
    'database_size_human', pg_size_pretty(pg_database_size(current_database()))
  ),

  -- ==========================================================================
  -- SCHEMAS - All schemas with owner, permissions, and object counts
  -- ==========================================================================
  'schemas', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema_name', n.nspname,
        'owner', pg_get_userbyid(n.nspowner),
        'acl', n.nspacl::text,
        'table_count', (
          SELECT COUNT(*) FROM pg_class c
          WHERE c.relnamespace = n.oid AND c.relkind = 'r'
        ),
        'view_count', (
          SELECT COUNT(*) FROM pg_class c
          WHERE c.relnamespace = n.oid AND c.relkind = 'v'
        ),
        'function_count', (
          SELECT COUNT(*) FROM pg_proc p
          WHERE p.pronamespace = n.oid
        ),
        'matview_count', (
          SELECT COUNT(*) FROM pg_class c
          WHERE c.relnamespace = n.oid AND c.relkind = 'm'
        )
      )
      ORDER BY n.nspname
    ), '[]'::json)
    FROM pg_namespace n
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_toast_temp_1')
  ),

  -- All Tables with Complete Details
  'tables', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', t.table_schema,
        'table_name', t.table_name,
        'table_type', t.table_type,
        'row_level_security_enabled', (
          SELECT c.relrowsecurity
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.table_schema
            AND c.relname = t.table_name
        ),
        -- Whether RLS is forced even for the table owner (service role).
        -- false = service role bypasses RLS (normal for admin operations)
        -- true  = RLS applies to everyone including the table owner
        'row_level_security_forced', (
          SELECT c.relforcerowsecurity
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.table_schema
            AND c.relname = t.table_name
        ),
        'owner', (
          SELECT pg_get_userbyid(c.relowner)
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.table_schema
            AND c.relname = t.table_name
        ),
        'estimated_row_count', (
          SELECT c.reltuples::bigint
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.table_schema
            AND c.relname = t.table_name
        ),
        'total_size_bytes', (
          SELECT pg_total_relation_size(c.oid)
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.table_schema
            AND c.relname = t.table_name
        ),
        'total_size_human', (
          SELECT pg_size_pretty(pg_total_relation_size(c.oid))
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.table_schema
            AND c.relname = t.table_name
        ),
        'has_policies', EXISTS (
          SELECT 1 FROM pg_policies p
          WHERE p.schemaname = t.table_schema
            AND p.tablename = t.table_name
        ),
        'policy_count', (
          SELECT COUNT(*) FROM pg_policies p
          WHERE p.schemaname = t.table_schema
            AND p.tablename = t.table_name
        ),
        'table_comment', (
          SELECT obj_description(c.oid, 'pg_class')
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.table_schema
            AND c.relname = t.table_name
        ),
        'columns', (
          SELECT json_agg(
            json_build_object(
              'column_name', c.column_name,
              'ordinal_position', c.ordinal_position,
              'data_type', c.data_type,
              'udt_name', c.udt_name,
              'character_maximum_length', c.character_maximum_length,
              'numeric_precision', c.numeric_precision,
              'numeric_scale', c.numeric_scale,
              'is_nullable', c.is_nullable,
              'column_default', c.column_default,
              'is_identity', c.is_identity,
              'identity_generation', c.identity_generation,
              'column_comment', (
                SELECT col_description(c2.oid, c.ordinal_position)
                FROM pg_class c2
                JOIN pg_namespace n2 ON c2.relnamespace = n2.oid
                WHERE n2.nspname = t.table_schema
                  AND c2.relname = t.table_name
              )
            )
            ORDER BY c.ordinal_position
          )
          FROM information_schema.columns c
          WHERE c.table_schema = t.table_schema
            AND c.table_name = t.table_name
        ),
        'primary_keys', (
          SELECT json_agg(
            json_build_object(
              'constraint_name', tc.constraint_name,
              'column_name', kcu.column_name
            )
            ORDER BY kcu.ordinal_position
          )
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = t.table_schema
            AND tc.table_name = t.table_name
            AND tc.constraint_type = 'PRIMARY KEY'
        ),
        'unique_constraints', (
          SELECT json_agg(
            json_build_object(
              'constraint_name', tc.constraint_name,
              'columns', (
                SELECT json_agg(kcu2.column_name ORDER BY kcu2.ordinal_position)
                FROM information_schema.key_column_usage kcu2
                WHERE kcu2.constraint_name = tc.constraint_name
                  AND kcu2.table_schema = tc.table_schema
              )
            )
          )
          FROM information_schema.table_constraints tc
          WHERE tc.table_schema = t.table_schema
            AND tc.table_name = t.table_name
            AND tc.constraint_type = 'UNIQUE'
        ),
        -- Inline foreign keys for this table (with ON DELETE/UPDATE rules)
        -- Uses pg_constraint instead of information_schema to avoid
        -- privilege-based filtering (e.g. FKs referencing auth.users)
        'foreign_keys', (
          SELECT json_agg(
            json_build_object(
              'constraint_name', con.conname,
              'columns', (
                SELECT json_agg(att.attname ORDER BY u.ord)
                FROM unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord)
                JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = u.attnum
              ),
              'foreign_table_schema', fn.nspname,
              'foreign_table_name', fc.relname,
              'foreign_columns', (
                SELECT json_agg(att.attname ORDER BY u.ord)
                FROM unnest(con.confkey) WITH ORDINALITY AS u(attnum, ord)
                JOIN pg_attribute att ON att.attrelid = con.confrelid AND att.attnum = u.attnum
              ),
              'on_delete', CASE con.confdeltype
                WHEN 'a' THEN 'NO ACTION'
                WHEN 'r' THEN 'RESTRICT'
                WHEN 'c' THEN 'CASCADE'
                WHEN 'n' THEN 'SET NULL'
                WHEN 'd' THEN 'SET DEFAULT'
              END,
              'on_update', CASE con.confupdtype
                WHEN 'a' THEN 'NO ACTION'
                WHEN 'r' THEN 'RESTRICT'
                WHEN 'c' THEN 'CASCADE'
                WHEN 'n' THEN 'SET NULL'
                WHEN 'd' THEN 'SET DEFAULT'
              END
            )
          )
          FROM pg_constraint con
          JOIN pg_class tc_pg ON con.conrelid = tc_pg.oid
          JOIN pg_namespace tn_pg ON tc_pg.relnamespace = tn_pg.oid
          JOIN pg_class fc ON con.confrelid = fc.oid
          JOIN pg_namespace fn ON fc.relnamespace = fn.oid
          WHERE tn_pg.nspname = t.table_schema
            AND tc_pg.relname = t.table_name
            AND con.contype = 'f'
        ),
        -- Inline check constraints for this table
        'check_constraints', (
          SELECT json_agg(
            json_build_object(
              'constraint_name', cc_tbl.constraint_name,
              'check_clause', cc_tbl.check_clause
            )
          )
          FROM information_schema.check_constraints cc_tbl
          JOIN information_schema.constraint_column_usage ccu_tbl
            ON cc_tbl.constraint_name = ccu_tbl.constraint_name
          WHERE ccu_tbl.table_schema = t.table_schema
            AND ccu_tbl.table_name = t.table_name
        )
      )
      ORDER BY t.table_schema, t.table_name
    ), '[]'::json)
    FROM information_schema.tables t
    WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_toast_temp_1')
      AND t.table_type = 'BASE TABLE'
  ),

  -- All RLS Policies
  'policies', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schemaname', schemaname,
        'tablename', tablename,
        'policyname', policyname,
        'permissive', permissive,
        'roles', roles,
        'cmd', cmd,
        'qual', qual,
        'with_check', with_check
      )
      ORDER BY schemaname, tablename, policyname
    ), '[]'::json)
    FROM pg_policies
  ),

  -- All Foreign Keys with Full Details
  -- Uses pg_constraint instead of information_schema to avoid
  -- privilege-based filtering (e.g. FKs referencing auth.users)
  'foreign_keys', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', tn.nspname,
        'table_name', tc.relname,
        'constraint_name', con.conname,
        'columns', (
          SELECT json_agg(
            json_build_object(
              'column_name', att.attname,
              'ordinal_position', u.ord
            )
            ORDER BY u.ord
          )
          FROM unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord)
          JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = u.attnum
        ),
        'foreign_table_schema', fn.nspname,
        'foreign_table_name', fc.relname,
        'foreign_columns', (
          SELECT COALESCE(json_agg(
            json_build_object(
              'column_name', att.attname,
              'ordinal_position', u.ord
            )
            ORDER BY u.ord
          ), '[]'::json)
          FROM unnest(con.confkey) WITH ORDINALITY AS u(attnum, ord)
          JOIN pg_attribute att ON att.attrelid = con.confrelid AND att.attnum = u.attnum
        ),
        'on_delete', CASE con.confdeltype
          WHEN 'a' THEN 'NO ACTION'
          WHEN 'r' THEN 'RESTRICT'
          WHEN 'c' THEN 'CASCADE'
          WHEN 'n' THEN 'SET NULL'
          WHEN 'd' THEN 'SET DEFAULT'
        END,
        'on_update', CASE con.confupdtype
          WHEN 'a' THEN 'NO ACTION'
          WHEN 'r' THEN 'RESTRICT'
          WHEN 'c' THEN 'CASCADE'
          WHEN 'n' THEN 'SET NULL'
          WHEN 'd' THEN 'SET DEFAULT'
        END
      )
      ORDER BY tn.nspname, tc.relname, con.conname
    ), '[]'::json)
    FROM pg_constraint con
    JOIN pg_class tc ON con.conrelid = tc.oid
    JOIN pg_namespace tn ON tc.relnamespace = tn.oid
    JOIN pg_class fc ON con.confrelid = fc.oid
    JOIN pg_namespace fn ON fc.relnamespace = fn.oid
    WHERE con.contype = 'f'
      AND tn.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- All Check Constraints
  'check_constraints', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', ccu.table_schema,
        'table_name', ccu.table_name,
        'constraint_name', cc.constraint_name,
        'check_clause', cc.check_clause
      )
      ORDER BY ccu.table_schema, ccu.table_name, cc.constraint_name
    ), '[]'::json)
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- All Exclusion Constraints
  'exclusion_constraints', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', n.nspname,
        'table_name', c.relname,
        'constraint_name', con.conname,
        'definition', pg_get_constraintdef(con.oid)
      )
      ORDER BY n.nspname, c.relname, con.conname
    ), '[]'::json)
    FROM pg_constraint con
    JOIN pg_class c ON con.conrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE con.contype = 'x'
      AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- All Indexes
  'indexes', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', n.nspname,
        'table_name', t.relname,
        'index_name', i.relname,
        'index_type', am.amname,
        'is_unique', idx.indisunique,
        'is_primary', idx.indisprimary,
        'columns', (
          SELECT json_agg(
            json_build_object(
              'column_name', a.attname,
              'column_number', a.attnum,
              'sort_order', CASE WHEN idx.indoption[a.attnum - 1] & 1 = 1 THEN 'DESC' ELSE 'ASC' END,
              'nulls_order', CASE WHEN idx.indoption[a.attnum - 1] & 2 = 2 THEN 'NULLS LAST' ELSE 'NULLS FIRST' END
            )
            ORDER BY array_position(idx.indkey, a.attnum)
          )
          FROM pg_attribute a
          WHERE a.attrelid = t.oid
            AND a.attnum = ANY(idx.indkey)
            AND a.attnum > 0
        ),
        'index_definition', pg_get_indexdef(idx.indexrelid)
      )
      ORDER BY n.nspname, t.relname, i.relname
    ), '[]'::json)
    FROM pg_index idx
    JOIN pg_class i ON i.oid = idx.indexrelid
    JOIN pg_class t ON t.oid = idx.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_am am ON am.oid = i.relam
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- All Functions (All Schemas)
  'functions', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', n.nspname,
        'function_name', p.proname,
        'oid', p.oid,
        'return_type', pg_get_function_result(p.oid)::text,
        'arguments', pg_get_function_arguments(p.oid),
        'identity_arguments', pg_get_function_identity_arguments(p.oid),
        'definition', pg_get_functiondef(p.oid),
        'security_definer', p.prosecdef,
        'language', l.lanname,
        'kind', CASE p.prokind
          WHEN 'f' THEN 'FUNCTION'
          WHEN 'p' THEN 'PROCEDURE'
          WHEN 'a' THEN 'AGGREGATE'
          WHEN 'w' THEN 'WINDOW'
        END,
        'volatility', CASE p.provolatile
          WHEN 'i' THEN 'IMMUTABLE'
          WHEN 's' THEN 'STABLE'
          WHEN 'v' THEN 'VOLATILE'
        END,
        'parallel_safety', CASE p.proparallel
          WHEN 's' THEN 'SAFE'
          WHEN 'r' THEN 'RESTRICTED'
          WHEN 'u' THEN 'UNSAFE'
        END,
        'is_strict', p.proisstrict,
        'returns_set', p.proretset,
        'config', p.proconfig,
        'search_path', (
          SELECT substring(cfg FROM 'search_path=(.*)')
          FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
          WHERE cfg LIKE 'search_path=%'
          LIMIT 1
        ),
        'function_comment', obj_description(p.oid, 'pg_proc'),
        -- Raw ACL from pg_proc: NULL = default (EXECUTE granted to PUBLIC),
        -- otherwise an explicit list of role=privileges/grantor entries.
        -- This is the authoritative source for function-level permissions.
        'acl', CASE
          WHEN p.proacl IS NULL THEN 'default (PUBLIC)'
          ELSE p.proacl::text
        END,
        -- Parsed execute permissions for easy reading
        'execute_granted_to', (
          SELECT COALESCE(json_agg(
            json_build_object(
              'grantee', CASE
                WHEN a.grantee = 0 THEN 'PUBLIC'
                ELSE pg_get_userbyid(a.grantee)
              END,
              'grantor', pg_get_userbyid(a.grantor),
              'is_grantable', a.is_grantable
            )
            ORDER BY CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END
          ), '[]'::json)
          FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
          WHERE a.privilege_type = 'EXECUTE'
        )
      )
      ORDER BY n.nspname, p.proname
    ), '[]'::json)
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_toast_temp_1')
  ),

  -- All Triggers
  'triggers', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', t.trigger_schema,
        'table_name', t.event_object_table,
        'trigger_name', t.trigger_name,
        'event_manipulation', t.event_manipulation,
        'event_object_schema', t.event_object_schema,
        'action_timing', t.action_timing,
        'action_statement', t.action_statement,
        'action_orientation', t.action_orientation,
        'action_condition', t.action_condition,
        'enabled_state', (
          SELECT CASE tg.tgenabled
            WHEN 'O' THEN 'ORIGIN'
            WHEN 'D' THEN 'DISABLED'
            WHEN 'R' THEN 'REPLICA'
            WHEN 'A' THEN 'ALWAYS'
          END
          FROM pg_trigger tg
          JOIN pg_class c ON tg.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = t.event_object_schema
            AND c.relname = t.event_object_table
            AND tg.tgname = t.trigger_name
          LIMIT 1
        )
      )
      ORDER BY t.trigger_schema, t.event_object_table, t.trigger_name
    ), '[]'::json)
    FROM information_schema.triggers t
    WHERE t.trigger_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- All Views
  'views', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', v.table_schema,
        'view_name', v.table_name,
        'owner', (
          SELECT pg_get_userbyid(c.relowner)
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = v.table_schema
            AND c.relname = v.table_name
        ),
        'definition', v.view_definition,
        'is_updatable', v.is_updatable,
        'is_insertable_into', v.is_insertable_into,
        'is_trigger_updatable', v.is_trigger_updatable,
        'is_trigger_deletable', v.is_trigger_deletable,
        'is_trigger_insertable_into', v.is_trigger_insertable_into,
        'row_level_security_enabled', (
          SELECT c.relrowsecurity
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = v.table_schema
            AND c.relname = v.table_name
        ),
        -- PG15+: true = runs as the querying user (safe).
        -- false (default) = runs as the view owner (can bypass RLS).
        'security_invoker', (
          SELECT COALESCE(c.reloptions @> ARRAY['security_invoker=true'], false)
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = v.table_schema
            AND c.relname = v.table_name
        )
      )
      ORDER BY v.table_schema, v.table_name
    ), '[]'::json)
    FROM information_schema.views v
    WHERE v.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- All Materialized Views
  'materialized_views', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', m.schemaname,
        'matview_name', m.matviewname,
        'owner', m.matviewowner,
        'definition', m.definition,
        'is_populated', m.ispopulated,
        'tablespace', m.tablespace,
        'has_indexes', m.hasindexes,
        'total_size_bytes', (
          SELECT pg_total_relation_size(c.oid)
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = m.schemaname
            AND c.relname = m.matviewname
        ),
        'total_size_human', (
          SELECT pg_size_pretty(pg_total_relation_size(c.oid))
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = m.schemaname
            AND c.relname = m.matviewname
        ),
        'estimated_row_count', (
          SELECT c.reltuples::bigint
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = m.schemaname
            AND c.relname = m.matviewname
        )
      )
      ORDER BY m.schemaname, m.matviewname
    ), '[]'::json)
    FROM pg_matviews m
    WHERE m.schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- All Sequences
  'sequences', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', schemaname,
        'sequence_name', sequencename,
        'data_type', data_type,
        'start_value', start_value,
        'minimum_value', min_value,
        'maximum_value', max_value,
        'increment', increment_by,
        'cycle', cycle,
        'cache', cache_size,
        'last_value', last_value
      )
      ORDER BY schemaname, sequencename
    ), '[]'::json)
    FROM pg_sequences
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- All Custom Types (Enums, etc.)
  'custom_types', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', n.nspname,
        'type_name', t.typname,
        'type_kind', CASE t.typtype
          WHEN 'b' THEN 'BASE'
          WHEN 'c' THEN 'COMPOSITE'
          WHEN 'd' THEN 'DOMAIN'
          WHEN 'e' THEN 'ENUM'
          WHEN 'p' THEN 'PSEUDO'
          WHEN 'r' THEN 'RANGE'
        END,
        'enum_values', (
          SELECT json_agg(e.enumlabel ORDER BY e.enumsortorder)
          FROM pg_enum e
          WHERE e.enumtypid = t.oid
        ),
        'type_comment', obj_description(t.oid, 'pg_type')
      )
      ORDER BY n.nspname, t.typname
    ), '[]'::json)
    FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      AND t.typtype IN ('e', 'c', 'd', 'r')  -- Enum, Composite, Domain, Range
  ),

  -- All Foreign Tables (FDW) - RLS does NOT apply to foreign tables!
  'foreign_tables', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', ft.foreign_table_schema,
        'table_name', ft.foreign_table_name,
        'server_name', ft.foreign_server_name,
        'columns', (
          SELECT json_agg(
            json_build_object(
              'column_name', c.column_name,
              'data_type', c.data_type,
              'is_nullable', c.is_nullable
            )
            ORDER BY c.ordinal_position
          )
          FROM information_schema.columns c
          WHERE c.table_schema = ft.foreign_table_schema
            AND c.table_name = ft.foreign_table_name
        )
      )
      ORDER BY ft.foreign_table_schema, ft.foreign_table_name
    ), '[]'::json)
    FROM information_schema.foreign_tables ft
  ),

  -- Foreign Servers (FDW configurations)
  'foreign_servers', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'server_name', s.srvname,
        'owner', pg_get_userbyid(s.srvowner),
        'foreign_data_wrapper', w.fdwname,
        'server_type', s.srvtype,
        'server_version', s.srvversion,
        'server_options', s.srvoptions,
        'acl', s.srvacl::text
      )
      ORDER BY s.srvname
    ), '[]'::json)
    FROM pg_foreign_server s
    JOIN pg_foreign_data_wrapper w ON s.srvfdw = w.oid
  ),

  -- Event Triggers (database-level DDL event triggers)
  'event_triggers', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'trigger_name', evtname,
        'event', evtevent,
        'owner', pg_get_userbyid(evtowner),
        'function', evtfoid::regproc::text,
        'enabled', CASE evtenabled
          WHEN 'O' THEN 'ORIGIN'
          WHEN 'D' THEN 'DISABLED'
          WHEN 'R' THEN 'REPLICA'
          WHEN 'A' THEN 'ALWAYS'
        END,
        'tags', evttags
      )
      ORDER BY evtname
    ), '[]'::json)
    FROM pg_event_trigger
  ),

  -- PostgreSQL Rules (can override INSERT/UPDATE/DELETE behavior)
  'rules', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', schemaname,
        'table_name', tablename,
        'rule_name', rulename,
        'definition', definition
      )
      ORDER BY schemaname, tablename, rulename
    ), '[]'::json)
    FROM pg_rules
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),

  -- ==========================================================================
  -- STORAGE (Supabase Storage) - Complete storage configuration and policies
  -- ==========================================================================
  
  'storage', json_build_object(
    -- Storage Buckets with full configuration
    'buckets', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', b.id,
          'name', b.name,
          'public', b.public,
          'owner', b.owner,
          'owner_id', b.owner_id,
          'file_size_limit', b.file_size_limit,
          'file_size_limit_human', CASE 
            WHEN b.file_size_limit IS NULL THEN 'unlimited'
            WHEN b.file_size_limit >= 1073741824 THEN (b.file_size_limit / 1073741824)::text || ' GB'
            WHEN b.file_size_limit >= 1048576 THEN (b.file_size_limit / 1048576)::text || ' MB'
            WHEN b.file_size_limit >= 1024 THEN (b.file_size_limit / 1024)::text || ' KB'
            ELSE b.file_size_limit::text || ' bytes'
          END,
          'allowed_mime_types', b.allowed_mime_types,
          'avif_autodetection', b.avif_autodetection,
          'created_at', b.created_at,
          'updated_at', b.updated_at,
          -- Object count and size per bucket
          'object_count', (
            SELECT COUNT(*) FROM storage.objects o WHERE o.bucket_id = b.id
          ),
          'total_size_bytes', (
            SELECT COALESCE(SUM((o.metadata->>'size')::bigint), 0)
            FROM storage.objects o 
            WHERE o.bucket_id = b.id
          )
        )
        ORDER BY b.name
      ), '[]'::json)
      FROM storage.buckets b
    ),
    
    -- Storage RLS Policies (on storage.objects and storage.buckets)
    'policies', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'table', p.tablename,
          'policy_name', p.policyname,
          'permissive', p.permissive,
          'roles', p.roles,
          'command', p.cmd,
          'using_expression', p.qual,
          'with_check_expression', p.with_check
        )
        ORDER BY p.tablename, p.policyname
      ), '[]'::json)
      FROM pg_policies p
      WHERE p.schemaname = 'storage'
    ),
    
    -- Storage schema tables with RLS status
    'tables', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'table_name', t.table_name,
          'row_level_security_enabled', (
            SELECT c.relrowsecurity
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'storage' AND c.relname = t.table_name
          ),
          'row_level_security_forced', (
            SELECT c.relforcerowsecurity
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'storage' AND c.relname = t.table_name
          ),
          'columns', (
            SELECT json_agg(
              json_build_object(
                'column_name', c.column_name,
                'data_type', c.data_type,
                'is_nullable', c.is_nullable,
                'column_default', c.column_default
              )
              ORDER BY c.ordinal_position
            )
            FROM information_schema.columns c
            WHERE c.table_schema = 'storage' AND c.table_name = t.table_name
          )
        )
        ORDER BY t.table_name
      ), '[]'::json)
      FROM information_schema.tables t
      WHERE t.table_schema = 'storage' AND t.table_type = 'BASE TABLE'
    ),
    
    -- Storage objects summary (grouped by bucket and path prefix)
    'objects_summary', (
      SELECT COALESCE(json_agg(row_data ORDER BY row_data->>'bucket_id', row_data->>'path_prefix'), '[]'::json)
      FROM (
        SELECT json_build_object(
          'bucket_id', bucket_id,
          'path_prefix', CASE 
            WHEN position('/' in name) > 0 
            THEN substring(name from 1 for position('/' in name) - 1)
            ELSE '(root)'
          END,
          'file_count', COUNT(*),
          'total_size_bytes', COALESCE(SUM((metadata->>'size')::bigint), 0),
          'latest_upload', MAX(created_at)
        ) as row_data
        FROM storage.objects
        GROUP BY bucket_id, 
          CASE 
            WHEN position('/' in name) > 0 
            THEN substring(name from 1 for position('/' in name) - 1)
            ELSE '(root)'
          END
      ) subq
    ),
    
    -- Storage functions
    'functions', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'function_name', p.proname,
          'return_type', pg_get_function_result(p.oid)::text,
          'arguments', pg_get_function_arguments(p.oid),
          'security_definer', p.prosecdef,
          'language', l.lanname
        )
        ORDER BY p.proname
      ), '[]'::json)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname = 'storage'
    )
  ),

  -- ==========================================================================
  -- AUTH - Deep dive into Supabase Auth schema
  -- ==========================================================================
  'auth', json_build_object(
    'auth_schema_exists', EXISTS (
      SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
    ),
    -- All auth tables with RLS status and row counts
    'tables', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'table_name', c.relname,
          'rls_enabled', c.relrowsecurity,
          'rls_forced', c.relforcerowsecurity,
          'estimated_row_count', c.reltuples::bigint,
          'total_size', pg_size_pretty(pg_total_relation_size(c.oid))
        )
        ORDER BY c.relname
      ), '[]'::json)
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relkind = 'r'
    ),
    -- Approximate user count (from pg_class stats, no full table scan)
    'user_count', (
      SELECT c.reltuples::bigint
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'users'
    ),
    -- Active session count
    'session_count', (
      SELECT c.reltuples::bigint
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'sessions'
    ),
    -- MFA adoption
    'mfa_factors_count', (
      SELECT c.reltuples::bigint
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'mfa_factors'
    ),
    -- Identity providers in use (which OAuth/social providers)
    'identity_providers', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'provider', provider,
          'user_count', cnt
        )
        ORDER BY cnt DESC
      ), '[]'::json)
      FROM (
        SELECT provider, COUNT(*) as cnt
        FROM auth.identities
        GROUP BY provider
      ) sub
    ),
    -- Audit log event summary (last 30 days)
    'audit_events_last_30_days', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'action', action,
          'count', cnt,
          'latest', latest_at
        )
        ORDER BY cnt DESC
      ), '[]'::json)
      FROM (
        SELECT
          payload->>'action' as action,
          COUNT(*) as cnt,
          MAX(created_at) as latest_at
        FROM auth.audit_log_entries
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY payload->>'action'
      ) sub
    ),
    -- Auth functions (for auditing custom auth logic)
    'auth_functions', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'function_name', p.proname,
          'return_type', pg_get_function_result(p.oid)::text,
          'arguments', pg_get_function_arguments(p.oid),
          'security_definer', p.prosecdef,
          'language', l.lanname
        )
        ORDER BY p.proname
      ), '[]'::json)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname = 'auth'
    ),
    -- Auth-related settings
    'auth_settings', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'name', name,
          'setting', setting
        )
        ORDER BY name
      ), '[]'::json)
      FROM pg_settings
      WHERE name LIKE 'app.settings.%'
    )
  ),

  -- Backward-compatibility alias for older tooling.
  -- Prefer using the `auth` key above for new integrations.
  'auth_info', json_build_object(
    'deprecated_alias', true,
    'auth_schema_exists', EXISTS (
      SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
    ),
    'tables', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'table_name', c.relname,
          'rls_enabled', c.relrowsecurity,
          'rls_forced', c.relforcerowsecurity,
          'estimated_row_count', c.reltuples::bigint,
          'total_size', pg_size_pretty(pg_total_relation_size(c.oid))
        )
        ORDER BY c.relname
      ), '[]'::json)
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relkind = 'r'
    )
  ),

  -- ==========================================================================
  -- REALTIME - Publications and realtime configuration
  -- ==========================================================================
  'realtime', json_build_object(
    -- Publications control which tables stream changes via Realtime
    'publications', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'publication_name', p.pubname,
          'owner', pg_get_userbyid(p.pubowner),
          'all_tables', p.puballtables,
          'insert', p.pubinsert,
          'update', p.pubupdate,
          'delete', p.pubdelete,
          'truncate', p.pubtruncate,
          'published_tables', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'schema', pt.schemaname,
                'table_name', pt.tablename
              )
              ORDER BY pt.schemaname, pt.tablename
            ), '[]'::json)
            FROM pg_publication_tables pt
            WHERE pt.pubname = p.pubname
          )
        )
        ORDER BY p.pubname
      ), '[]'::json)
      FROM pg_publication p
    ),
    -- Realtime schema tables with RLS status
    'realtime_tables', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'table_name', c.relname,
          'rls_enabled', c.relrowsecurity,
          'rls_forced', c.relforcerowsecurity,
          'estimated_row_count', c.reltuples::bigint
        )
        ORDER BY c.relname
      ), '[]'::json)
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'realtime' AND c.relkind = 'r'
    ),
    -- RLS policies on realtime schema
    'realtime_policies', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'table', p.tablename,
          'policy_name', p.policyname,
          'permissive', p.permissive,
          'roles', p.roles,
          'command', p.cmd,
          'using_expression', p.qual,
          'with_check_expression', p.with_check
        )
        ORDER BY p.tablename, p.policyname
      ), '[]'::json)
      FROM pg_policies p
      WHERE p.schemaname = 'realtime'
    )
  ),

  -- ==========================================================================
  -- VAULT - Secret metadata (pre-installed on Supabase)
  -- SECURITY: Only exports metadata (name, description, dates).
  -- Does NOT expose encrypted secret values, key IDs, or nonces.
  -- ==========================================================================
  'vault', json_build_object(
    'vault_schema_exists', EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'vault'),
    'secrets', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', s.id,
          'name', s.name,
          'description', s.description,
          'created_at', s.created_at,
          'updated_at', s.updated_at
        )
        ORDER BY s.name
      ), '[]'::json)
      FROM vault.secrets s
    )
  ),

  -- ==========================================================================
  -- WEBHOOKS - Database webhook triggers and supabase_functions schema
  -- ==========================================================================
  'webhooks', json_build_object(
    -- Triggers that call supabase_functions (webhook triggers)
    'webhook_triggers', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'trigger_name', tg.tgname,
          'schema', n.nspname,
          'table_name', c.relname,
          'events', (
            ARRAY[]::text[]
            || CASE WHEN tg.tgtype::int & 4 > 0 THEN ARRAY['INSERT'] ELSE ARRAY[]::text[] END
            || CASE WHEN tg.tgtype::int & 8 > 0 THEN ARRAY['DELETE'] ELSE ARRAY[]::text[] END
            || CASE WHEN tg.tgtype::int & 16 > 0 THEN ARRAY['UPDATE'] ELSE ARRAY[]::text[] END
            || CASE WHEN tg.tgtype::int & 32 > 0 THEN ARRAY['TRUNCATE'] ELSE ARRAY[]::text[] END
          ),
          'timing', CASE
            WHEN tg.tgtype::int & 2 > 0 THEN 'BEFORE'
            WHEN tg.tgtype::int & 64 > 0 THEN 'INSTEAD OF'
            ELSE 'AFTER'
          END,
          'enabled', CASE tg.tgenabled
            WHEN 'O' THEN 'ORIGIN'
            WHEN 'D' THEN 'DISABLED'
            WHEN 'R' THEN 'REPLICA'
            WHEN 'A' THEN 'ALWAYS'
          END,
          'function_name', p.proname,
          'function_schema', fn.nspname
        )
        ORDER BY n.nspname, c.relname, tg.tgname
      ), '[]'::json)
      FROM pg_trigger tg
      JOIN pg_class c ON tg.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_proc p ON tg.tgfoid = p.oid
      JOIN pg_namespace fn ON p.pronamespace = fn.oid
      WHERE fn.nspname = 'supabase_functions'
        AND NOT tg.tgisinternal
    ),
    -- supabase_functions schema tables
    'supabase_functions_tables', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'table_name', t.table_name,
          'columns', (
            SELECT json_agg(
              json_build_object(
                'column_name', c.column_name,
                'data_type', c.data_type,
                'is_nullable', c.is_nullable
              )
              ORDER BY c.ordinal_position
            )
            FROM information_schema.columns c
            WHERE c.table_schema = 'supabase_functions' AND c.table_name = t.table_name
          ),
          'estimated_row_count', (
            SELECT cl.reltuples::bigint
            FROM pg_class cl
            JOIN pg_namespace ns ON cl.relnamespace = ns.oid
            WHERE ns.nspname = 'supabase_functions' AND cl.relname = t.table_name
          )
        )
        ORDER BY t.table_name
      ), '[]'::json)
      FROM information_schema.tables t
      WHERE t.table_schema = 'supabase_functions' AND t.table_type = 'BASE TABLE'
    ),
    -- supabase_functions schema functions
    'supabase_functions_functions', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'function_name', p.proname,
          'arguments', pg_get_function_arguments(p.oid),
          'return_type', pg_get_function_result(p.oid)::text,
          'security_definer', p.prosecdef,
          'language', l.lanname
        )
        ORDER BY p.proname
      ), '[]'::json)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname = 'supabase_functions'
    )
  ),

  -- ==========================================================================
  -- POSTGREST CONFIG - API exposure settings (critical for attack surface)
  -- ==========================================================================
  'postgrest_config', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'name', name,
        'setting', setting,
        'source', source
      )
      ORDER BY name
    ), '[]'::json)
    FROM pg_settings
    WHERE name LIKE 'pgrst.%'
  ),

  -- ==========================================================================
  -- DATABASE SETTINGS - Security-relevant PostgreSQL configuration
  -- ==========================================================================
  'database_settings', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'name', name,
        'setting', setting,
        'unit', unit,
        'category', category,
        'short_desc', short_desc,
        'source', source
      )
      ORDER BY name
    ), '[]'::json)
    FROM pg_settings
    WHERE name IN (
      'search_path', 'log_statement', 'log_connections', 'log_disconnections',
      'ssl', 'password_encryption', 'statement_timeout',
      'idle_in_transaction_session_timeout', 'lock_timeout',
      'max_connections', 'shared_buffers', 'effective_cache_size', 'work_mem',
      'log_min_messages', 'log_min_error_statement', 'log_min_duration_statement',
      'row_security', 'default_transaction_isolation',
      'track_activities', 'track_counts',
      'shared_preload_libraries'
    )
  ),

  -- ==========================================================================
  -- TABLE STATISTICS - Row counts, dead tuples, vacuum/analyze, sizes
  -- ==========================================================================
  'table_statistics', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', schemaname,
        'table_name', relname,
        'estimated_row_count', n_live_tup,
        'dead_tuples', n_dead_tup,
        'rows_inserted', n_tup_ins,
        'rows_updated', n_tup_upd,
        'rows_deleted', n_tup_del,
        'rows_hot_updated', n_tup_hot_upd,
        'sequential_scans', seq_scan,
        'index_scans', COALESCE(idx_scan, 0),
        'last_vacuum', last_vacuum,
        'last_autovacuum', last_autovacuum,
        'last_analyze', last_analyze,
        'last_autoanalyze', last_autoanalyze,
        'vacuum_count', vacuum_count,
        'autovacuum_count', autovacuum_count,
        'total_size_bytes', pg_total_relation_size(relid),
        'total_size_human', pg_size_pretty(pg_total_relation_size(relid)),
        'table_size_bytes', pg_table_size(relid),
        'index_size_bytes', pg_indexes_size(relid)
      )
      ORDER BY pg_total_relation_size(relid) DESC
    ), '[]'::json)
    FROM pg_stat_user_tables
    WHERE schemaname NOT IN ('pg_toast', 'pg_toast_temp_1')
  ),

  -- Column-Level Privileges (fine-grained access control)
  'column_privileges', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'schema', table_schema,
        'table_name', table_name,
        'column_name', column_name,
        'grantee', grantee,
        'privilege_type', privilege_type,
        'is_grantable', is_grantable
      )
      ORDER BY table_schema, table_name, column_name, grantee, privilege_type
    ), '[]'::json)
    FROM information_schema.column_privileges
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      AND grantee NOT IN ('postgres', 'supabase_admin', 'supabase_storage_admin',
                          'supabase_auth_admin', 'supabase_realtime_admin',
                          'supabase_replication_admin', 'supabase_read_only_user')
  ),

  -- Extension Information
  'extensions', (
    SELECT COALESCE(json_agg(
      json_build_object(
        'name', extname,
        'schema', extnamespace::regnamespace::text,
        'version', extversion,
        'relocatable', extrelocatable
      )
      ORDER BY extname
    ), '[]'::json)
    FROM pg_extension
  ),

  -- Migration metadata (helps verify applied state vs repository intent)
  'migration_state', json_build_object(
    -- Do not hard-reference migration tables directly because Supabase projects
    -- vary by tier/version and some schemas are hidden or absent.
    'schema_migration_tables', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'schema', n.nspname,
          'table_name', c.relname,
          'owner', pg_get_userbyid(c.relowner),
          'rls_enabled', c.relrowsecurity,
          'rls_forced', c.relforcerowsecurity,
          'estimated_row_count', c.reltuples::bigint,
          'total_size_human', pg_size_pretty(pg_total_relation_size(c.oid))
        )
        ORDER BY n.nspname, c.relname
      ), '[]'::json)
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relkind = 'r'
        AND c.relname = 'schema_migrations'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ),
    'schema_migration_table_presence', json_build_object(
      'supabase_migrations_schema_migrations_exists',
        (to_regclass('supabase_migrations.schema_migrations') IS NOT NULL),
      'auth_schema_migrations_exists',
        (to_regclass('auth.schema_migrations') IS NOT NULL),
      'public_schema_migrations_exists',
        (to_regclass('public.schema_migrations') IS NOT NULL),
      'realtime_schema_migrations_exists',
        (to_regclass('realtime.schema_migrations') IS NOT NULL)
    )
  ),

  -- Machine-readable notes for audit tooling.
  'audit_limitations', json_build_object(
    'managed_internal_objects', json_build_object(
      'graphql_schema_customer_managed', false,
      'auth_oauth_tables_customer_managed', false,
      'realtime_internal_tables_customer_managed', false
    ),
    'notes', json_build_array(
      'graphql/graphql_public grants may be platform-managed depending on project settings',
      'auth.oauth_* table RLS may be controlled by Supabase internals',
      'realtime.schema_migrations and realtime.subscription RLS may be controlled by Supabase internals'
    ),
    'recommended_triage_mode', 'fail_on_actionable_public_schema_warn_on_managed_internal'
  ),

  -- ==========================================================================
  -- SECURITY AUDIT - Permissions, grants, and automated security checks
  -- ==========================================================================

  'security_audit', json_build_object(

    -- -----------------------------------------------------------------------
    -- Role Grants: who has SELECT/INSERT/UPDATE/DELETE on which tables?
    -- Shows explicit table-level permissions per role.
    -- -----------------------------------------------------------------------
    'role_table_grants', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'schema', table_schema,
          'table_name', table_name,
          'grantee', grantee,
          'privilege_type', privilege_type,
          'is_grantable', is_grantable,
          'with_hierarchy', with_hierarchy
        )
        ORDER BY table_schema, table_name, grantee, privilege_type
      ), '[]'::json)
      FROM information_schema.role_table_grants
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        -- Filter to relevant roles (exclude internal postgres roles)
        AND grantee NOT IN ('postgres', 'supabase_admin', 'supabase_storage_admin',
                            'supabase_auth_admin', 'supabase_realtime_admin',
                            'supabase_replication_admin', 'supabase_read_only_user')
    ),

    -- -----------------------------------------------------------------------
    -- Function Privileges: who can EXECUTE which functions?
    -- Critical for verifying SECURITY DEFINER functions are restricted.
    -- -----------------------------------------------------------------------
    'function_privileges', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'schema', routine_schema,
          'function_name', routine_name,
          'grantee', grantee,
          'privilege_type', privilege_type,
          'is_grantable', is_grantable
        )
        ORDER BY routine_schema, routine_name, grantee
      ), '[]'::json)
      FROM information_schema.routine_privileges
      WHERE routine_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast',
                                    'pg_toast_temp_1')
        AND grantee NOT IN ('postgres', 'supabase_admin', 'supabase_storage_admin',
                            'supabase_auth_admin', 'supabase_realtime_admin',
                            'supabase_replication_admin', 'supabase_read_only_user')
    ),

    -- -----------------------------------------------------------------------
    -- Schema Grants: which roles have USAGE on which schemas?
    -- Controls who can even see objects within a schema.
    -- -----------------------------------------------------------------------
    'schema_grants', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'schema', n.nspname,
          'acl', n.nspacl::text,
          'owner', pg_get_userbyid(n.nspowner)
        )
        ORDER BY n.nspname
      ), '[]'::json)
      FROM pg_namespace n
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast',
                               'pg_toast_temp_1')
    ),

    -- -----------------------------------------------------------------------
    -- Default Privileges: what permissions are auto-granted on new objects?
    -- If misconfigured, newly created tables could be open by default.
    -- -----------------------------------------------------------------------
    'default_privileges', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'owner', pg_get_userbyid(d.defaclrole),
          'schema', CASE WHEN d.defaclnamespace = 0 THEN '(global)'
                         ELSE n.nspname END,
          'object_type', CASE d.defaclobjtype
            WHEN 'r' THEN 'TABLE'
            WHEN 'S' THEN 'SEQUENCE'
            WHEN 'f' THEN 'FUNCTION'
            WHEN 'T' THEN 'TYPE'
            WHEN 'n' THEN 'SCHEMA'
          END,
          'acl', d.defaclacl::text
        )
        ORDER BY pg_get_userbyid(d.defaclrole), n.nspname
      ), '[]'::json)
      FROM pg_default_acl d
      LEFT JOIN pg_namespace n ON d.defaclnamespace = n.oid
    ),

    -- -----------------------------------------------------------------------
    -- Database Roles: all roles and their attributes
    -- Shows who can login, who is superuser, who can create DBs, etc.
    -- -----------------------------------------------------------------------
    'roles', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'role_name', rolname,
          'is_superuser', rolsuper,
          'can_login', rolcanlogin,
          'can_create_db', rolcreatedb,
          'can_create_role', rolcreaterole,
          'inherits_privileges', rolinherit,
          'can_bypass_rls', rolbypassrls,
          'connection_limit', rolconnlimit,
          'valid_until', rolvaliduntil,
          'config', rolconfig
        )
        ORDER BY rolname
      ), '[]'::json)
      FROM pg_roles
      WHERE rolname NOT LIKE 'pg_%'
    ),

    -- -----------------------------------------------------------------------
    -- Role Memberships: which roles are members of which other roles?
    -- Shows privilege inheritance chains.
    -- -----------------------------------------------------------------------
    'role_memberships', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'role', r.rolname,
          'member', m.rolname,
          'granted_by', g.rolname,
          'admin_option', a.admin_option
        )
        ORDER BY r.rolname, m.rolname
      ), '[]'::json)
      FROM pg_auth_members a
      JOIN pg_roles r ON a.roleid = r.oid
      JOIN pg_roles m ON a.member = m.oid
      LEFT JOIN pg_roles g ON a.grantor = g.oid
      WHERE r.rolname NOT LIKE 'pg_%'
    ),

    -- -----------------------------------------------------------------------
    -- Security Summary: automated checks that flag potential issues.
    -- Replicates Supabase Security Advisor lints + additional checks.
    -- Review these flags after each export to catch misconfigurations.
    -- -----------------------------------------------------------------------
    'security_summary', json_build_object(

      -- =================================================================
      -- LINT 0001: Unindexed Foreign Keys
      -- FK columns without indexes hurt JOIN performance and can cause
      -- slow cascading deletes.
      -- =================================================================
      'unindexed_foreign_keys', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', tn.nspname,
            'table_name', tc.relname,
            'constraint_name', con.conname,
            'columns', (
              SELECT json_agg(att.attname ORDER BY u.ord)
              FROM unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord)
              JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = u.attnum
            ),
            'foreign_table', fn.nspname || '.' || fc.relname
          )
          ORDER BY tn.nspname, tc.relname
        ), '[]'::json)
        FROM pg_constraint con
        JOIN pg_class tc ON con.conrelid = tc.oid
        JOIN pg_namespace tn ON tc.relnamespace = tn.oid
        JOIN pg_class fc ON con.confrelid = fc.oid
        JOIN pg_namespace fn ON fc.relnamespace = fn.oid
        WHERE con.contype = 'f'
          AND tn.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_toast_temp_1')
          AND NOT EXISTS (
            SELECT 1 FROM pg_index idx
            WHERE idx.indrelid = con.conrelid
              AND con.conkey <@ ARRAY(
                SELECT k FROM unnest(idx.indkey) k WHERE k > 0
              )::smallint[]
          )
      ),

      -- =================================================================
      -- LINT 0002: auth.users Exposed in Views
      -- Views in public/exposed schemas that reference auth.users directly
      -- can leak sensitive user data through the API.
      -- =================================================================
      'auth_users_exposed_in_views', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', v.table_schema,
            'view_name', v.table_name,
            'definition_preview', LEFT(v.view_definition, 300)
          )
          ORDER BY v.table_schema, v.table_name
        ), '[]'::json)
        FROM information_schema.views v
        WHERE v.view_definition ILIKE '%auth.users%'
          AND v.table_schema NOT IN ('pg_catalog', 'information_schema', 'auth',
                                      'pg_toast', 'storage', 'realtime')
      ),

      -- =================================================================
      -- LINT 0003: RLS Policies Without (SELECT ...) Wrapper
      -- Policies using auth.uid() or auth.jwt() without wrapping in
      -- (SELECT auth.uid()) cause the function to evaluate per-row
      -- instead of once, hurting performance and potentially security.
      -- Note: pg_policies deparses scalar subqueries as ( SELECT auth.uid() AS uid),
      -- so we treat "wrapped" as containing "select auth.uid()" (subquery form).
      -- =================================================================
      'auth_rls_without_select_wrapper', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', schemaname,
            'table_name', tablename,
            'policy_name', policyname,
            'command', cmd,
            'has_unwrapped_auth_uid',
              (COALESCE(qual, '') ILIKE '%auth.uid()%'
               AND COALESCE(qual, '') NOT ILIKE '%select auth.uid()%')
              OR (COALESCE(with_check, '') ILIKE '%auth.uid()%'
                  AND COALESCE(with_check, '') NOT ILIKE '%select auth.uid()%'),
            'has_unwrapped_auth_jwt',
              (COALESCE(qual, '') ILIKE '%auth.jwt()%'
               AND COALESCE(qual, '') NOT ILIKE '%select auth.jwt()%')
              OR (COALESCE(with_check, '') ILIKE '%auth.jwt()%'
                  AND COALESCE(with_check, '') NOT ILIKE '%select auth.jwt()%')
          )
          ORDER BY schemaname, tablename, policyname
        ), '[]'::json)
        FROM pg_policies
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
          AND (
            (COALESCE(qual, '') ILIKE '%auth.uid()%' AND COALESCE(qual, '') NOT ILIKE '%select auth.uid()%')
            OR (COALESCE(with_check, '') ILIKE '%auth.uid()%' AND COALESCE(with_check, '') NOT ILIKE '%select auth.uid()%')
            OR (COALESCE(qual, '') ILIKE '%auth.jwt()%' AND COALESCE(qual, '') NOT ILIKE '%select auth.jwt()%')
            OR (COALESCE(with_check, '') ILIKE '%auth.jwt()%' AND COALESCE(with_check, '') NOT ILIKE '%select auth.jwt()%')
          )
      ),

      -- =================================================================
      -- LINT 0004: Tables Without Primary Key
      -- Tables without a PK can cause replication issues and make it
      -- harder to uniquely identify rows.
      -- =================================================================
      'tables_without_primary_key', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', n.nspname,
            'table_name', c.relname
          )
          ORDER BY n.nspname, c.relname
        ), '[]'::json)
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'r'
          AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast',
                                 'pg_toast_temp_1', 'auth', 'storage', 'realtime',
                                 'vault', 'supabase_migrations', 'supabase_functions',
                                 '_analytics', 'net', 'cron', 'pgsodium',
                                 'pgsodium_masks', 'graphql', 'graphql_public')
          AND NOT EXISTS (
            SELECT 1 FROM pg_index idx
            WHERE idx.indrelid = c.oid AND idx.indisprimary
          )
      ),

      -- =================================================================
      -- LINT 0006: Multiple Permissive Policies for Same Command
      -- Multiple PERMISSIVE policies for the same command OR together,
      -- which can be unintentionally wider than intended.
      -- =================================================================
      'multiple_permissive_policies', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', schemaname,
            'table_name', tablename,
            'command', cmd,
            'permissive_policy_count', cnt,
            'policy_names', policy_names
          )
          ORDER BY schemaname, tablename, cmd
        ), '[]'::json)
        FROM (
          SELECT schemaname, tablename, cmd,
                 COUNT(*) as cnt,
                 json_agg(policyname ORDER BY policyname) as policy_names
          FROM pg_policies
          WHERE permissive = 'PERMISSIVE'
            AND schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast',
                                    'auth', 'storage', 'realtime')
          GROUP BY schemaname, tablename, cmd
          HAVING COUNT(*) > 1
        ) sub
      ),

      -- =================================================================
      -- LINT 0010: Security Definer Views (missing security_invoker)
      -- Views in public schema without security_invoker=true run as the
      -- view OWNER, not the querying user. This can bypass RLS.
      -- =================================================================
      'security_definer_views', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', n.nspname,
            'view_name', c.relname,
            'owner', pg_get_userbyid(c.relowner)
          )
          ORDER BY n.nspname, c.relname
        ), '[]'::json)
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'v'
          AND n.nspname = 'public'
          AND NOT COALESCE(c.reloptions @> ARRAY['security_invoker=true'], false)
      ),

      -- =================================================================
      -- LINT 0011: Functions with Mutable search_path
      -- Functions in public schema without search_path='' are vulnerable
      -- to search_path injection attacks.
      -- =================================================================
      'functions_with_mutable_search_path', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', n.nspname,
            'function_name', p.proname,
            'language', l.lanname,
            'security_definer', p.prosecdef,
            'current_search_path', (
              SELECT substring(cfg FROM 'search_path=(.*)')
              FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
              WHERE cfg LIKE 'search_path=%'
              LIMIT 1
            )
          )
          ORDER BY n.nspname, p.proname
        ), '[]'::json)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'public'
          AND l.lanname IN ('plpgsql', 'sql')
          AND (
            p.proconfig IS NULL
            OR NOT EXISTS (
              SELECT 1 FROM unnest(p.proconfig) cfg
              WHERE cfg LIKE 'search_path=%'
            )
          )
      ),

      -- =================================================================
      -- LINT 0013: Tables Without RLS in Public Schema
      -- Any table in public schema without RLS is accessible via the
      -- anon role through the Data API.
      -- =================================================================
      'tables_without_rls', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', n.nspname,
            'table_name', c.relname
          )
          ORDER BY n.nspname, c.relname
        ), '[]'::json)
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'r'
          AND NOT c.relrowsecurity
          AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast',
                                 'pg_toast_temp_1', 'auth', 'realtime', 'vault',
                                 'supabase_migrations', 'supabase_functions', '_analytics',
                                 'net', 'cron', 'pgsodium', 'pgsodium_masks',
                                 'graphql', 'graphql_public')
      ),

      -- =================================================================
      -- LINT 0014: Extensions Installed in Public Schema
      -- Extensions in public schema expose their functions/types via API.
      -- Move them to the 'extensions' schema instead.
      -- =================================================================
      'extensions_in_public_schema', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'extension_name', e.extname,
            'schema', n.nspname,
            'version', e.extversion
          )
          ORDER BY e.extname
        ), '[]'::json)
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE n.nspname = 'public'
      ),

      -- =================================================================
      -- LINT 0015: RLS Policies Referencing User Metadata
      -- Policies using raw_user_meta_data are insecure because users
      -- can modify their own metadata via the Auth API.
      -- =================================================================
      'rls_references_user_metadata', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', schemaname,
            'table_name', tablename,
            'policy_name', policyname,
            'command', cmd,
            'references_raw_user_meta_data',
              COALESCE(qual, '') ILIKE '%raw_user_meta_data%'
              OR COALESCE(with_check, '') ILIKE '%raw_user_meta_data%',
            'references_raw_app_meta_data',
              COALESCE(qual, '') ILIKE '%raw_app_meta_data%'
              OR COALESCE(with_check, '') ILIKE '%raw_app_meta_data%'
          )
          ORDER BY schemaname, tablename, policyname
        ), '[]'::json)
        FROM pg_policies
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
          AND (
            COALESCE(qual, '') ILIKE '%raw_user_meta_data%'
            OR COALESCE(with_check, '') ILIKE '%raw_user_meta_data%'
            OR COALESCE(qual, '') ILIKE '%raw_app_meta_data%'
            OR COALESCE(with_check, '') ILIKE '%raw_app_meta_data%'
          )
      ),

      -- =================================================================
      -- LINT 0016: Materialized Views in API-Exposed Schemas
      -- Materialized views bypass RLS entirely. If in an API-exposed
      -- schema, their data is accessible without any row-level checks.
      -- =================================================================
      'materialized_views_in_api', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', m.schemaname,
            'matview_name', m.matviewname,
            'owner', m.matviewowner,
            'estimated_rows', (
              SELECT c.reltuples::bigint
              FROM pg_class c
              JOIN pg_namespace n ON c.relnamespace = n.oid
              WHERE n.nspname = m.schemaname AND c.relname = m.matviewname
            )
          )
          ORDER BY m.schemaname, m.matviewname
        ), '[]'::json)
        FROM pg_matviews m
        WHERE m.schemaname = 'public'
      ),

      -- =================================================================
      -- LINT 0017: Foreign Tables in API-Exposed Schemas
      -- Foreign tables (FDW) do NOT support RLS. If in an API-exposed
      -- schema, their data is fully accessible without restrictions.
      -- =================================================================
      'foreign_tables_in_api', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', ft.foreign_table_schema,
            'table_name', ft.foreign_table_name,
            'server_name', ft.foreign_server_name
          )
          ORDER BY ft.foreign_table_schema, ft.foreign_table_name
        ), '[]'::json)
        FROM information_schema.foreign_tables ft
        WHERE ft.foreign_table_schema = 'public'
      ),

      -- =================================================================
      -- LINT 0019: Insecure Queues Exposed in API
      -- pgmq tables in public schema are accessible without RLS.
      -- =================================================================
      'insecure_queue_exposed_in_api', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', n.nspname,
            'table_name', c.relname
          )
          ORDER BY c.relname
        ), '[]'::json)
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'r'
          AND n.nspname = 'public'
          AND (c.relname LIKE 'pgmq_%' OR c.relname LIKE 'q_%')
      ),

      -- =================================================================
      -- LINT 0023: Sensitive Columns Exposed
      -- Columns with sensitive names in public-schema tables that may
      -- leak PII or credentials through the API.
      -- =================================================================
      'sensitive_columns_exposed', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', c.table_schema,
            'table_name', c.table_name,
            'column_name', c.column_name,
            'data_type', c.data_type,
            'table_has_rls', (
              SELECT cl.relrowsecurity
              FROM pg_class cl
              JOIN pg_namespace ns ON cl.relnamespace = ns.oid
              WHERE ns.nspname = c.table_schema AND cl.relname = c.table_name
            )
          )
          ORDER BY c.table_schema, c.table_name, c.column_name
        ), '[]'::json)
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.column_name IN (
            'email', 'phone', 'phone_number', 'password', 'password_hash',
            'secret', 'secret_key', 'token', 'api_key', 'access_token',
            'refresh_token', 'credit_card', 'card_number', 'ssn',
            'social_security', 'bank_account', 'private_key'
          )
      ),

      -- =================================================================
      -- LINT 0024: Overly Permissive RLS Policies
      -- Policies with USING(true) or WITH CHECK(true) effectively
      -- disable row-level restrictions for that operation.
      -- =================================================================
      'overly_permissive_policies', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', schemaname,
            'table_name', tablename,
            'policy_name', policyname,
            'command', cmd,
            'permissive', permissive,
            'roles', roles,
            'using_expression', qual,
            'with_check_expression', with_check,
            'issue', CASE
              WHEN COALESCE(qual, '') = 'true' AND COALESCE(with_check, '') = 'true'
                THEN 'Both USING and WITH CHECK are always true'
              WHEN COALESCE(qual, '') = 'true'
                THEN 'USING clause is always true (allows reading all rows)'
              WHEN COALESCE(with_check, '') = 'true'
                THEN 'WITH CHECK clause is always true (allows writing any data)'
            END
          )
          ORDER BY schemaname, tablename, policyname
        ), '[]'::json)
        FROM pg_policies
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast',
                                  'auth', 'storage', 'realtime', 'vault',
                                  'supabase_migrations', 'supabase_functions', '_analytics')
          AND permissive = 'PERMISSIVE'
          AND (COALESCE(qual, '') = 'true' OR COALESCE(with_check, '') = 'true')
      ),

      -- =================================================================
      -- Tables with RLS ENABLED but NO policies defined (data is locked)
      -- =================================================================
      'tables_with_rls_but_no_policies', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', n.nspname,
            'table_name', c.relname
          )
          ORDER BY n.nspname, c.relname
        ), '[]'::json)
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'r'
          AND c.relrowsecurity
          AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast',
                                 'pg_toast_temp_1', 'supabase_migrations',
                                 'supabase_functions', '_analytics')
          AND NOT EXISTS (
            SELECT 1 FROM pg_policies p
            WHERE p.schemaname = n.nspname
              AND p.tablename = c.relname
          )
      ),

      -- =================================================================
      -- Tables where RLS is NOT forced for the table owner
      -- (service role / table owner bypasses all RLS policies)
      -- =================================================================
      'tables_rls_not_forced_for_owner', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', n.nspname,
            'table_name', c.relname,
            'rls_enabled', c.relrowsecurity,
            'rls_forced', c.relforcerowsecurity
          )
          ORDER BY n.nspname, c.relname
        ), '[]'::json)
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'r'
          AND c.relrowsecurity
          AND NOT c.relforcerowsecurity
          AND n.nspname = 'public'
      ),

      -- =================================================================
      -- SECURITY DEFINER functions (run with owner privileges, not caller)
      -- Must be carefully audited - can bypass RLS.
      -- =================================================================
      'security_definer_functions', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', n.nspname,
            'function_name', p.proname,
            'owner', pg_get_userbyid(p.proowner),
            'language', l.lanname,
            'arguments', pg_get_function_arguments(p.oid)
          )
          ORDER BY n.nspname, p.proname
        ), '[]'::json)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE p.prosecdef = true
          AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast',
                                 'pg_toast_temp_1')
      ),

      -- =================================================================
      -- RLS policies targeting "public" role instead of "authenticated"
      -- =================================================================
      'policies_targeting_public_role', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', schemaname,
            'table_name', tablename,
            'policy_name', policyname,
            'command', cmd,
            'roles', roles
          )
          ORDER BY schemaname, tablename, policyname
        ), '[]'::json)
        FROM pg_policies
        WHERE roles @> ARRAY['public']::name[]
          AND schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ),

      -- =================================================================
      -- Tables in public schema missing specific CRUD policies
      -- =================================================================
      'tables_with_incomplete_policies', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'schema', t.schemaname,
            'table_name', t.tablename,
            'has_select', EXISTS (
              SELECT 1 FROM pg_policies p
              WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
                AND p.cmd IN ('SELECT', 'ALL')
            ),
            'has_insert', EXISTS (
              SELECT 1 FROM pg_policies p
              WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
                AND p.cmd IN ('INSERT', 'ALL')
            ),
            'has_update', EXISTS (
              SELECT 1 FROM pg_policies p
              WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
                AND p.cmd IN ('UPDATE', 'ALL')
            ),
            'has_delete', EXISTS (
              SELECT 1 FROM pg_policies p
              WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
                AND p.cmd IN ('DELETE', 'ALL')
            ),
            'policy_count', (
              SELECT COUNT(*) FROM pg_policies p
              WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
            )
          )
          ORDER BY t.schemaname, t.tablename
        ), '[]'::json)
        FROM (
          SELECT DISTINCT schemaname, tablename
          FROM pg_policies
          WHERE schemaname = 'public'
        ) t
      ),

      -- =================================================================
      -- Roles that can bypass RLS (critical security check)
      -- =================================================================
      'roles_that_bypass_rls', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'role_name', rolname,
            'is_superuser', rolsuper,
            'can_login', rolcanlogin
          )
          ORDER BY rolname
        ), '[]'::json)
        FROM pg_roles
        WHERE rolbypassrls = true
          AND rolname NOT LIKE 'pg_%'
      )
    )
  )
) as complete_database_export;

