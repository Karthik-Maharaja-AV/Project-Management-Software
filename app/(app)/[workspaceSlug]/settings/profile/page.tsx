"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/auth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileInput>({ resolver: zodResolver(updateProfileSchema) });

  useEffect(() => {
    if (session?.user) {
      reset({
        name: session.user.name ?? "",
        username: session.user.username ?? "",
      });
      fetch("/api/users/me")
        .then((res) => res.json())
        .then(({ user }) => reset({ name: user.name, username: user.username, bio: user.bio ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const onSubmit = async (data: UpdateProfileInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update profile");
      await update({ name: data.name, username: data.username });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex items-center gap-3">
          <Avatar name={watch("name") || session.user.name || "?"} src={session.user.image} size="xl" />
          <div className="text-sm text-text-tertiary">
            Avatars are generated from your name.
            <br />
            Custom avatar upload is on the roadmap.
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...register("username")} />
              {errors.username && <p className="text-xs text-danger">{errors.username.message}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={session.user.email ?? ""} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell your team about yourself" {...register("bio")} />
          </div>
          <div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
