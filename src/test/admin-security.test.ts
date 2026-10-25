// @vitest-environment node
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { beforeAll, describe, expect, it } from "vitest";

const env = { ...loadEnv("test", process.cwd(), ""), ...process.env };
const url = env["VITE_SUPABASE_URL"];
const key = env["VITE_SUPABASE_PUBLISHABLE_KEY"];
if (!url || !key) throw new Error("Cloud test configuration is missing");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const visitor = createClient(url, key, options);
const admin = createClient(url, key, options);
const ownerId = "1dc7ec09-9688-41cb-a143-c6ae4f31791d";

describe("Single admin security", () => {
  beforeAll(async () => {
    const password = process.env["TEST_ADMIN_PASSWORD"];
    if (!password) throw new Error("Provide the admin password privately to run security checks");
    const { data, error } = await admin.auth.signInWithPassword({ email: "sk.yaseen700@gmail.com", password });
    if (error) throw error;
    expect(data.user?.id).toBe(ownerId);
  });

  it("assigns exactly one admin role to the designated owner", async () => {
    const { data, error } = await admin.from("user_roles").select("user_id, role");
    expect(error).toBeNull();
    expect(data).toEqual([{ user_id: ownerId, role: "admin" }]);
  });

  it("authorizes the designated owner and rejects another user ID", async () => {
    const owner = await admin.rpc("has_role", { _user_id: ownerId, _role: "admin" });
    const other = await admin.rpc("has_role", { _user_id: "00000000-0000-0000-0000-000000000001", _role: "admin" });
    expect(owner.error).toBeNull();
    expect(owner.data).toBe(true);
    expect(other.error).toBeNull();
    expect(other.data).toBe(false);
  });

  it("disables public sign-up in hosted auth settings", async () => {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    expect(response.ok).toBe(true);
    expect((await response.json()).disable_signup).toBe(true);
  });

  it("allows visitor reads but rejects visitor content creation", async () => {
    const read = await visitor.from("notices").select("id").limit(1);
    const write = await visitor.from("notices").insert({ message: "Security test: unauthorized insert" });
    expect(read.error).toBeNull();
    expect(write.error?.code).toBe("42501");
  });

  it("rejects visitor image uploads", async () => {
    const { error } = await visitor.storage.from("media").upload(`security-test/${crypto.randomUUID()}.png`, new Uint8Array([137, 80, 78, 71]), { contentType: "image/png" });
    expect(error).not.toBeNull();
  });

  it("allows the sole admin to add, edit and delete content", async () => {
    const created = await admin.from("notices").insert({ message: "Temporary security check", is_active: false }).select("id").single();
    expect(created.error).toBeNull();
    if (!created.data) throw new Error("Admin notice creation failed");
    const id = created.data.id;
    try {
      const updated = await admin.from("notices").update({ message: "Updated security check" }).eq("id", id).select("message").single();
      expect(updated.error).toBeNull();
      expect(updated.data?.message).toBe("Updated security check");
    } finally {
      const removed = await admin.from("notices").delete().eq("id", id).select("id");
      expect(removed.error).toBeNull();
      expect(removed.data).toEqual([{ id }]);
    }
  });

  it("allows the sole admin to upload, replace and delete images", async () => {
    const path = `security-test/${crypto.randomUUID()}.png`;
    const image = new Uint8Array([137, 80, 78, 71]);
    try {
      const upload = await admin.storage.from("media").upload(path, image, { contentType: "image/png" });
      expect(upload.error).toBeNull();
      const replace = await admin.storage.from("media").update(path, image, { contentType: "image/png" });
      expect(replace.error).toBeNull();
    } finally {
      const removed = await admin.storage.from("media").remove([path]);
      expect(removed.error).toBeNull();
      expect(removed.data).toHaveLength(1);
    }
  });
});