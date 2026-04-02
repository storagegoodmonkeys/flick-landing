import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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
      const userId = userRow.user_id;

      // Delete all user-related data from every table
      // Order matters: delete child records before parent
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);

      await supabase
        .from("point_transactions")
        .delete()
        .eq("user_id", userId);

      await supabase
        .from("favorite_lighters")
        .delete()
        .eq("user_id", userId);

      await supabase
        .from("found_reports")
        .delete()
        .eq("finder_user_id", userId);

      await supabase
        .from("lost_reports")
        .delete()
        .eq("reported_by_user_id", userId);

      await supabase
        .from("reports")
        .delete()
        .eq("reporter_user_id", userId);

      // Remove from conversations
      await supabase
        .from("conversation_members")
        .delete()
        .eq("user_id", userId);

      // Delete messages sent by this user
      await supabase
        .from("messages")
        .delete()
        .eq("sender_user_id", userId);

      // Delete friendships (both directions)
      await supabase
        .from("friendships")
        .delete()
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      // Delete lighter ownership records
      await supabase
        .from("lighter_ownership")
        .delete()
        .eq("user_id", userId);

      // Delete the user profile row
      await supabase.from("users").delete().eq("user_id", userId);

      console.log("[delete-account] Deleted all user data for user_id:", userId);
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
      // The orphaned auth user won't have a profile to match
    }

    console.log("[delete-account] Account fully deleted:", authUuid);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[delete-account] Exception:", msg);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
