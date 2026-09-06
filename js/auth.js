(function () {
  "use strict";

  const supabase = () =>
    window.HAMOU_SUPABASE;

  async function getUser() {
    const client = supabase();

    if (!client) {
      return null;
    }

    const {
      data: { user }
    } = await client.auth.getUser();

    return user || null;
  }

  async function getProfile(userId) {
    const client = supabase();

    if (!client || !userId) {
      return null;
    }

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async function signIn(email, password) {
    const client = supabase();

    if (!client) {
      throw new Error(
        "Supabase غير مهيأ بعد."
      );
    }

    const result =
      await client.auth.signInWithPassword({
        email,
        password
      });

    if (result.error) {
      throw result.error;
    }

    await refresh();

    return result.data;
  }

  async function signUp(email, password, fullName) {
    const client = supabase();

    if (!client) {
      throw new Error(
        "Supabase غير مهيأ بعد."
      );
    }

    const result =
      await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || ""
          }
        }
      });

    if (result.error) {
      throw result.error;
    }

    await refresh();

    return result.data;
  }

  async function signOut() {
    const client = supabase();

    if (!client) {
      return;
    }

    await client.auth.signOut();

    await refresh();
  }

  async function refresh() {
    const user = await getUser();

    let profile = null;

    if (user) {
      profile = await getProfile(user.id);
    }

    const owner =
      !!user &&
      String(user.email || "").toLowerCase() ===
        String(
          window.HAMOU_CONFIG.ownerEmail
        ).toLowerCase() &&
      profile?.role === "owner";

    window.HAMOU_AUTH_STATE = {
      user,
      profile,
      isLoggedIn: !!user,
      isOwner: owner
    };

    window.dispatchEvent(
      new CustomEvent("hamou:auth", {
        detail: window.HAMOU_AUTH_STATE
      })
    );

    return window.HAMOU_AUTH_STATE;
  }

  window.HAMOU_AUTH = {
    getUser,
    getProfile,
    signIn,
    signUp,
    signOut,
    refresh
  };

  document.addEventListener(
    "DOMContentLoaded",
    async () => {
      const client = supabase();

      if (client) {
        client.auth.onAuthStateChange(() => {
          setTimeout(refresh, 0);
        });
      }

      await refresh();
    }
  );
})();
