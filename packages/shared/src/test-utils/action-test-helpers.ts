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
    select: () => {
      eq: () => {
        order: () => {
          order: () => {
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
} {
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
        select: () => ({
          eq: () => ({
            order: () => ({
              order: () => ({
                overrideTypes: contactListReturns,
              }),
            }),
          }),
        }),
      };
    },
  };
}
