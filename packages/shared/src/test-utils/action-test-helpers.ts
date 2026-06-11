/** Standard successful auth guard shape used in action tests. */
interface AuthSuccessContext<TSupabase> {
  ok: true;
  ctx: { user: { id: string }; supabase: TSupabase };
}

/** Build a successful auth context fixture for server-action unit tests. */
export function createAuthSuccessContext<TSupabase>(
  supabase: TSupabase,
  userId = "user-1"
): AuthSuccessContext<TSupabase> {
  return {
    ok: true,
    ctx: { user: { id: userId }, supabase },
  };
}

/** Minimal Supabase mock for ordered encrypted contact list reads in link tests. */
export function createOrderedContactListSupabaseMock(): {
  from: (table: string) => {
    select: (columns: string) => {
      eq: () => {
        order: () => {
          order: () => {
            limit: (n: number) => {
              overrideTypes: () => Promise<{
                data: Array<{
                  id: string;
                  encrypted_first_name: string;
                  encrypted_last_name: string;
                }>;
                error: null;
              }>;
            };
          };
        };
      };
    };
  };
  /** Column list from the most recent `select()` call. */
  getLastSelectColumns: () => string | undefined;
  /** Row cap from the most recent `.limit()` call. */
  getLastLimit: () => number | undefined;
} {
  let lastSelectColumns: string | undefined;
  let lastLimit: number | undefined;
  const contactListReturns = async () => ({
    data: [
      {
        id: "contact-1",
        encrypted_first_name: "enc",
        encrypted_last_name: "enc",
      },
    ],
    error: null,
  });

  return {
    from: (table: string) => {
      if (table !== "contacts") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select: (columns: string) => {
          lastSelectColumns = columns;
          return {
            eq: () => ({
              order: () => ({
                order: () => ({
                  limit: (n: number) => {
                    lastLimit = n;
                    return {
                      overrideTypes: contactListReturns,
                    };
                  },
                }),
              }),
            }),
          };
        },
      };
    },
    getLastSelectColumns: () => lastSelectColumns,
    getLastLimit: () => lastLimit,
  };
}

/** Fluent Supabase query mock supporting arbitrary `.order()` chains. */
type DashboardListQueryMock<TResult> = {
  order: () => DashboardListQueryMock<TResult>;
  limit: (n: number) => { overrideTypes: () => Promise<TResult> };
};

/** Builds a chainable query mock ending in `.limit().overrideTypes()`. */
function createDashboardListQueryMock<TResult>(
  result: TResult,
  onLimit?: (n: number) => void
): DashboardListQueryMock<TResult> {
  const query: DashboardListQueryMock<TResult> = {
    order: () => query,
    limit: (n: number) => {
      onLimit?.(n);
      return {
        overrideTypes: async () => result,
      };
    },
  };
  return query;
}

/** Minimal Supabase mock for dashboard list reads ending in `.limit().overrideTypes()`. */
export function createDashboardListSupabaseMock<
  TRow,
  TError extends { message: string; code?: string } | null,
>(
  tableName: string,
  result: { data: TRow[] | null; error: TError }
): {
  from: (table: string) => {
    select: () => {
      eq: () => DashboardListQueryMock<typeof result>;
    };
  };
  /** Row cap from the most recent `.limit()` call. */
  getLastLimit: () => number | undefined;
} {
  let lastLimit: number | undefined;
  return {
    from: (table: string) => {
      if (table !== tableName) {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select: () => ({
          eq: () =>
            createDashboardListQueryMock(result, (n) => {
              lastLimit = n;
            }),
        }),
      };
    },
    getLastLimit: () => lastLimit,
  };
}

/** Minimal Supabase mock for dashboard list reads where `overrideTypes()` rejects. */
export function createRejectingDashboardListSupabaseMock(
  tableName: string,
  error: Error
): {
  from: (table: string) => {
    select: () => {
      eq: () => DashboardListQueryMock<never>;
    };
  };
} {
  return {
    from: (table: string) => {
      if (table !== tableName) {
        throw new Error(`Unexpected table ${table}`);
      }

      const rejectingQuery: DashboardListQueryMock<never> = {
        order: () => rejectingQuery,
        limit: (_n: number) => ({
          overrideTypes: async () => Promise.reject(error),
        }),
      };

      return {
        select: () => ({
          eq: () => rejectingQuery,
        }),
      };
    },
  };
}
