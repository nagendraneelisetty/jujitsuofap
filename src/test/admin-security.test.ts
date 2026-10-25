// @vitest-environment node
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { readFileSync } from "node:fs";
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
    const sessionFile = process.env["TEST_ADMIN_SESSION_FILE"];
    if (sessionFile) {
      const { session } = JSON.parse(readFileSync(sessionFile, "utf8"));
      const { data, error } = await admin.auth.setSession(session);
      if (error) throw error;
      expect(data.user?.id).toBe(ownerId);
      return;
    }
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

  it("preserves district information while saving president and secretary names", async () => {
    const row = { district_name: "Temporary leadership check", coordinator_name: "Coordinator check", phone: "1234567890", email: "test@example.com", president_name: "President check", secretary_name: "Secretary check" };
    const created = await admin.from("districts").insert(row).select("id").single();
    expect(created.error).toBeNull();
    if (!created.data) throw new Error("District creation failed");
    const id = created.data.id;
    try {
      const updated = await admin.from("districts").update({ president_name: "Updated president", secretary_name: "Updated secretary" }).eq("id", id);
      expect(updated.error).toBeNull();
      const read = await visitor.from("districts").select("district_name, coordinator_name, phone, email, president_name, secretary_name").eq("id", id).single();
      expect(read.error).toBeNull();
      expect(read.data).toEqual({ ...row, president_name: "Updated president", secretary_name: "Updated secretary" });
    } finally { await admin.from("districts").delete().eq("id", id); }
  });

  it("allows only the admin to create, edit, order and delete executive members", async () => {
    const row = { name: "Temporary committee check", role: "President", image_url: "https://example.com/test.png", sort_order: 20 };
    const denied = await visitor.from("executive_members").insert(row);
    expect(denied.error?.code).toBe("42501");
    const created = await admin.from("executive_members").insert([row, { ...row, role: "Secretary", sort_order: 10 }]).select("id, role");
    expect(created.error).toBeNull();
    if (!created.data || created.data.length !== 2) throw new Error("Committee creation failed");
    const ids = created.data.map((m) => m.id);
    try {
      const read = await visitor.from("executive_members").select("role, sort_order").in("id", ids).order("sort_order");
      expect(read.error).toBeNull();
      expect(read.data).toEqual([{ role: "Secretary", sort_order: 10 }, { role: "President", sort_order: 20 }]);
      const deniedUpdate = await visitor.from("executive_members").update({ name: "Unauthorized" }).in("id", ids).select("id");
      expect(deniedUpdate.error !== null || deniedUpdate.data?.length === 0).toBe(true);
      const deniedDelete = await visitor.from("executive_members").delete().in("id", ids).select("id");
      expect(deniedDelete.error !== null || deniedDelete.data?.length === 0).toBe(true);
      const updated = await admin.from("executive_members").update({ name: "Updated committee check", role: "Treasurer", sort_order: 5 }).eq("id", ids[0]).select("name, role, sort_order").single();
      expect(updated.error).toBeNull();
      expect(updated.data).toEqual({ name: "Updated committee check", role: "Treasurer", sort_order: 5 });
    } finally {
      const removed = await admin.from("executive_members").delete().in("id", ids).select("id");
      expect(removed.error).toBeNull();
      expect(removed.data).toHaveLength(2);
    }
  });
});