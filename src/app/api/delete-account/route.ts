import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Allow up to 60s on Vercel (Pro plan); hobby plan caps at its own limit
export const maxDuration = 60;

let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// List every object in a bucket whose path starts with `prefix` (folder-aware).
async function listAllUnderPrefix(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;
  const limit = 100;
  // Supabase list is folder-aware. `prefix` should be a folder path like "lighters" or "".
  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error || !data || data.length === 0) break;
    for (const item of data) {
      // Ignore sub-folders (item.id === null indicates a folder)
      if (item.id) {
        out.push(prefix ? `${prefix}/${item.name}` : item.name);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseAdmin();

    // Verify the JWT and get the user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      console.error("[delete-account] Auth error:", authError?.message);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const authUuid = authUser.id;
    console.log("[delete-account] Deleting account for:", authUuid);

    // Get the user's internal user_id from the users table
    const { data: userRow } = await supabase
      .from("users")
      .select("user_id")
      .eq("uuid", authUuid)
      .maybeSingle();

    if (userRow) {
      const userId = userRow.user_id as number;

      // 1. Determine which lighters the user will orphan (solo-owned → safe to delete)
      //    One query instead of N — pull all owned lighter_ids, then one IN-query
      //    to get every ownership row for those lighters, group client-side.
      const { data: ownedRows } = await supabase
        .from("lighter_ownership")
        .select("lighter_id")
        .eq("user_id", userId);
      const ownedLighterIds = Array.from(
        new Set((ownedRows ?? []).map((r) => r.lighter_id as number))
      );

      let soloLighterIds: number[] = [];
      if (ownedLighterIds.length > 0) {
        const { data: allOwnershipRows } = await supabase
          .from("lighter_ownership")
          .select("lighter_id, user_id")
          .in("lighter_id", ownedLighterIds);
        const otherOwnerCount: Record<number, number> = {};
        for (const row of allOwnershipRows ?? []) {
          const lid = row.lighter_id as number;
          const uid = row.user_id as number;
          if (uid !== userId) {
            otherOwnerCount[lid] = (otherOwnerCount[lid] ?? 0) + 1;
          }
        }
        soloLighterIds = ownedLighterIds.filter(
          (lid) => !otherOwnerCount[lid]
        );
      }
      console.log(
        `[delete-account] Owned=${ownedLighterIds.length}, solo=${soloLighterIds.length}`
      );

      // 2. Find conversations the user is in, so we can clean up empties after removing them
      const { data: convMemberRows } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", userId);
      const userConvIds = Array.from(
        new Set((convMemberRows ?? []).map((r) => r.conversation_id as number))
      );

      // 3. Delete per-user tables in parallel — none of these depend on each other
      await Promise.all([
        supabase.from("notifications").delete().eq("user_id", userId),
        supabase.from("point_transactions").delete().eq("user_id", userId),
        supabase.from("favorite_lighters").delete().eq("user_id", userId),
        supabase.from("found_reports").delete().eq("finder_user_id", userId),
        supabase
          .from("lost_reports")
          .delete()
          .eq("reported_by_user_id", userId),
        supabase.from("reports").delete().eq("reporter_user_id", userId),
        supabase.from("user_badges").delete().eq("user_id", userId),
        supabase
          .from("blocks")
          .delete()
          .or(`blocker_user_id.eq.${userId},blocked_user_id.eq.${userId}`),
        supabase
          .from("transfer_requests")
          .delete()
          .or(`sender_user_id.eq.${userId},recipient_user_id.eq.${userId}`),
        supabase.from("conversation_members").delete().eq("user_id", userId),
        supabase.from("messages").delete().eq("sender_user_id", userId),
        supabase
          .from("friendships")
          .delete()
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
        supabase.from("report_problems").delete().eq("user_id", authUuid),
        supabase.from("support_messages").delete().eq("user_id", authUuid),
      ]);

      // 4. Clean up conversations that are now empty — batch remaining-member
      //    counts with one IN query instead of N separate counts.
      if (userConvIds.length > 0) {
        const { data: remainingMembers } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .in("conversation_id", userConvIds);
        const stillActive = new Set<number>(
          (remainingMembers ?? []).map((r) => r.conversation_id as number)
        );
        const emptyConvIds = userConvIds.filter((cid) => !stillActive.has(cid));
        if (emptyConvIds.length > 0) {
          await Promise.all([
            supabase
              .from("messages")
              .delete()
              .in("conversation_id", emptyConvIds),
            supabase
              .from("conversations")
              .delete()
              .in("conversation_id", emptyConvIds),
          ]);
        }
      }

      // 5. Lighter ownership for this user (always goes)
      await supabase.from("lighter_ownership").delete().eq("user_id", userId);

      // 6. Solo-owned lighters — fully delete along with associated rows.
      //    Use IN-queries so this stays a handful of round-trips regardless of
      //    how many solo lighters the user has.
      if (soloLighterIds.length > 0) {
        await Promise.all([
          supabase
            .from("found_reports")
            .delete()
            .in("lighter_id", soloLighterIds),
          supabase
            .from("lost_reports")
            .delete()
            .in("lighter_id", soloLighterIds),
          supabase
            .from("favorite_lighters")
            .delete()
            .in("lighter_id", soloLighterIds),
          supabase
            .from("transfer_requests")
            .delete()
            .in("lighter_id", soloLighterIds),
          supabase
            .from("lighter_codes")
            .update({ lighter_id: null, status: "unregistered" })
            .in("lighter_id", soloLighterIds),
        ]);
        // lighters row last so the above FK-dependent rows are gone first
        await supabase.from("lighters").delete().in("lighter_id", soloLighterIds);
      }

      // 8. Storage cleanup
      //    - Profile avatars: avatars/{authUuid}_*
      //    - Lighter photos for solo-owned lighters: lighters/{lighter_id}_*
      try {
        const avatarFiles = await listAllUnderPrefix(supabase, "avatars", "avatars");
        const myAvatars = avatarFiles.filter((p) =>
          p.includes(`/${authUuid}_`)
        );
        if (myAvatars.length > 0) {
          await supabase.storage.from("avatars").remove(myAvatars);
        }

        if (soloLighterIds.length > 0) {
          const lighterFiles = await listAllUnderPrefix(
            supabase,
            "avatars",
            "lighters"
          );
          const soloSet = new Set(soloLighterIds.map(String));
          const toRemove = lighterFiles.filter((p) => {
            const name = p.split("/").pop() ?? "";
            const idPart = name.split("_")[0];
            return soloSet.has(idPart);
          });
          if (toRemove.length > 0) {
            await supabase.storage.from("avatars").remove(toRemove);
          }
        }
      } catch (storageErr) {
        // Don't fail the whole deletion if storage cleanup has a hiccup
        console.error("[delete-account] Storage cleanup error:", storageErr);
      }

      // 9. Finally, the user profile row
      await supabase.from("users").delete().eq("user_id", userId);

      console.log(
        `[delete-account] Cleaned user_id=${userId}; soloLighters=${soloLighterIds.length}; emptyConvs handled=${userConvIds.length}`
      );
    }

    // Delete the Supabase auth user
    const { error: deleteAuthError } =
      await supabase.auth.admin.deleteUser(authUuid);

    if (deleteAuthError) {
      console.error(
        "[delete-account] Failed to delete auth user:",
        deleteAuthError.message
      );
      // Profile data is already gone, so still return success
    }

    console.log("[delete-account] Account fully deleted:", authUuid);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[delete-account] Exception:", msg, stack);
    // Surface the actual reason back to the client so errors are debuggable
    return NextResponse.json(
      { error: `Delete failed: ${msg}` },
      { status: 500 }
    );
  }
}
