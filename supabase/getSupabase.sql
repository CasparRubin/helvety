-- Comprehensive Supabase Database Export
-- Returns EVERYTHING about the database in a single JSON object
-- Perfect for documentation, version control, and AI coding agents
--
-- Usage: Run this in Supabase SQL Editor and copy the JSON output
--
-- NOTE: Foreign key queries use pg_constraint (pg_catalog) instead of
-- information_schema.constraint_column_usage, because the latter filters
-- by privilege and silently drops FKs referencing restricted schemas
-- (e.g. auth.users).
--
-- The output includes:
--   - Tables: columns, primary keys, unique constraints, foreign keys (with
--     ON DELETE/UPDATE rules), check constraints, RLS status, comments
--     (each table entry is fully self-contained)
--   - Policies: all RLS policies with USING and WITH CHECK expressions
--   - Foreign Keys: relationships between tables with ON DELETE/UPDATE rules
--   - Check Constraints: validation rules on columns
--   - Indexes: all indexes with column details and definitions
--   - Functions: all custom functions with full definitions
--   - Triggers: all triggers with timing and action statements
--   - Views: all views with definitions and updatability info
--   - Sequences: all sequences with current values
--   - Custom Types: enums, composites, domains, ranges
--   - Storage: buckets, policies, tables, object summaries, functions
--   - Auth: schema info and function counts
--   - Extensions: installed PostgreSQL extensions

SELECT json_build_object(
  'export_metadata', json_build_object(
    'export_date', NOW(),
    'database_name', current_database(),
    'database_version', version(),
    'postgres_version', (SELECT setting FROM pg_settings WHERE name = 'server_version')
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
        'volatility', CASE p.provolatile
          WHEN 'i' THEN 'IMMUTABLE'
          WHEN 's' THEN 'STABLE'
          WHEN 'v' THEN 'VOLATILE'
        END,
        'is_strict', p.proisstrict,
        'returns_set', p.proretset,
        'function_comment', obj_description(p.oid, 'pg_proc')
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
        'action_condition', t.action_condition
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
        )
      )
      ORDER BY v.table_schema, v.table_name
    ), '[]'::json)
    FROM information_schema.views v
    WHERE v.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
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

  -- Auth Schema Info (if accessible)
  'auth_info', (
    SELECT json_build_object(
      'auth_schema_exists', EXISTS (
        SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
      ),
      'auth_users_table_exists', EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
          AND table_name = 'users'
      ),
      'auth_functions_count', (
        SELECT COUNT(*)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'auth'
      )
    )
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
  )
) as complete_database_export;

