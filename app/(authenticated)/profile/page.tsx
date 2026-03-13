"use client";

import { useState } from "react";
import { useAuth } from "@/components/layout/AuthGuard";
import {
  useUserProfile,
  useUpdateUserProfile,
  useCreateUserProfile,
  useActiveInjuries,
  useCreateActiveInjury,
} from "@/hooks/useAmplifyData";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { GymLocation } from "@/types";

// ─── Onboarding Wizard ──────────────────────────────────────

type OnboardingData = {
  weightLbs: string;
  heightIn: string;
  age: string;
  gymPreference: GymLocation;
  onWegovy: boolean;
  wegovyStartDate: string;
  pfStage: number;
  pfPainLevel: number;
  elbowStage: number;
  elbowPainLevel: number;
};

const GYM_OPTIONS: { value: GymLocation; label: string; desc: string }[] = [
  {
    value: "LA_FITNESS",
    label: "LA Fitness",
    desc: "Full gym with cable machines, free weights, pools",
  },
  {
    value: "PLANET_FITNESS",
    label: "Planet Fitness",
    desc: "Smith machines, dumbbells up to 75 lbs, cardio",
  },
  {
    value: "HOME",
    label: "Home Gym",
    desc: "Bodyweight, bands, dumbbells, whatever you have",
  },
  {
    value: "OTHER",
    label: "Other Gym",
    desc: "Another gym with standard equipment",
  },
];

function OnboardingWizard({ email }: { email: string }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const createProfile = useCreateUserProfile();
  const createInjury = useCreateActiveInjury();

  const [data, setData] = useState<OnboardingData>({
    weightLbs: "",
    heightIn: "",
    age: "",
    gymPreference: "LA_FITNESS",
    onWegovy: false,
    wegovyStartDate: "",
    pfStage: 2,
    pfPainLevel: 3,
    elbowStage: 2,
    elbowPainLevel: 3,
  });

  const update = (partial: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const canAdvance = (): boolean => {
    if (step === 1) {
      return (
        data.weightLbs !== "" &&
        data.age !== "" &&
        Number(data.weightLbs) > 0 &&
        Number(data.age) > 0
      );
    }
    return true;
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // 1. Create UserProfile
      await createProfile.mutateAsync({
        email,
        weightLbs: parseFloat(data.weightLbs),
        heightIn: data.heightIn ? parseFloat(data.heightIn) : undefined,
        age: parseInt(data.age, 10),
        gymPreference: data.gymPreference,
        onWegovy: data.onWegovy,
        wegovyStartDate: data.onWegovy && data.wegovyStartDate ? data.wegovyStartDate : undefined,
        onboardingComplete: true,
      });

      // 2. Create Plantar Fasciitis injury
      await createInjury.mutateAsync({
        injuryType: "PLANTAR_FASCIITIS",
        side: "RIGHT",
        stage: data.pfStage,
        currentPainLevel: data.pfPainLevel,
        onsetDate: new Date().toISOString().split("T")[0],
        lastAssessedAt: new Date().toISOString(),
        restrictions: JSON.stringify([]),
      });

      // 3. Create Sprained Elbow injury
      await createInjury.mutateAsync({
        injuryType: "SPRAINED_ELBOW",
        side: "LEFT",
        stage: data.elbowStage,
        currentPainLevel: data.elbowPainLevel,
        onsetDate: new Date().toISOString().split("T")[0],
        lastAssessedAt: new Date().toISOString(),
        restrictions: JSON.stringify([]),
      });

      toast.success("Profile created! Welcome to RehabTrack.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to RehabTrack
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Let&apos;s get your profile set up so we can build safe workouts for
          you.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
              s === step
                ? "bg-blue-600 text-white"
                : s < step
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            )}
          >
            {s < step ? "\u2713" : s}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>
              We use these to calibrate your workouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weight (lbs) *
                </label>
                <Input
                  type="number"
                  placeholder="185"
                  value={data.weightLbs}
                  onChange={(e) => update({ weightLbs: e.target.value })}
                  className="min-h-[48px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Height (inches)
                </label>
                <Input
                  type="number"
                  placeholder="70"
                  value={data.heightIn}
                  onChange={(e) => update({ heightIn: e.target.value })}
                  className="min-h-[48px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Age *
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  value={data.age}
                  onChange={(e) => update({ age: e.target.value })}
                  className="min-h-[48px]"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              size="lg"
              disabled={!canAdvance()}
              onClick={() => setStep(2)}
              className="min-h-[48px]"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Gym Preference */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Where Do You Work Out?</CardTitle>
            <CardDescription>
              This helps us pick exercises you can actually do.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {GYM_OPTIONS.map((gym) => (
                <button
                  key={gym.value}
                  type="button"
                  onClick={() => update({ gymPreference: gym.value })}
                  className={cn(
                    "min-h-[80px] rounded-lg border-2 p-4 text-left transition-all",
                    data.gymPreference === gym.value
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                      : "border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
                  )}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {gym.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {gym.desc}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setStep(1)}
              className="min-h-[48px]"
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={() => setStep(3)}
              className="min-h-[48px]"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Wegovy */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wegovy / GLP-1</CardTitle>
            <CardDescription>
              If you&apos;re on a GLP-1 medication, we&apos;ll factor recovery
              and energy into your plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => update({ onWegovy: true })}
                  className={cn(
                    "min-h-[48px] flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all",
                    data.onWegovy
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                      : "border-gray-200 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                  )}
                >
                  Yes, I&apos;m on Wegovy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update({ onWegovy: false, wegovyStartDate: "" })
                  }
                  className={cn(
                    "min-h-[48px] flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all",
                    !data.onWegovy
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                      : "border-gray-200 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                  )}
                >
                  No
                </button>
              </div>

              {data.onWegovy && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    When did you start?
                  </label>
                  <Input
                    type="date"
                    value={data.wegovyStartDate}
                    onChange={(e) =>
                      update({ wegovyStartDate: e.target.value })
                    }
                    className="min-h-[48px]"
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setStep(2)}
              className="min-h-[48px]"
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={() => setStep(4)}
              className="min-h-[48px]"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 4: Injury Setup */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Injury Setup</CardTitle>
            <CardDescription>
              We&apos;ll pre-fill your known injuries. Adjust stage and pain
              level as needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Plantar Fasciitis */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Plantar Fasciitis — Right Foot
                </h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                      Stage (1-4)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update({ pfStage: s })}
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-lg border-2 font-bold transition-all",
                            data.pfStage === s
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                              : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                      Current Pain (0-10): {data.pfPainLevel}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={data.pfPainLevel}
                      onChange={(e) =>
                        update({ pfPainLevel: parseInt(e.target.value, 10) })
                      }
                      className="mt-2 h-2 w-full cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Sprained Elbow */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Sprained Elbow — Left
                </h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                      Stage (1-4)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update({ elbowStage: s })}
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-lg border-2 font-bold transition-all",
                            data.elbowStage === s
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                              : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                      Current Pain (0-10): {data.elbowPainLevel}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={data.elbowPainLevel}
                      onChange={(e) =>
                        update({
                          elbowPainLevel: parseInt(e.target.value, 10),
                        })
                      }
                      className="mt-2 h-2 w-full cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setStep(3)}
              className="min-h-[48px]"
            >
              Back
            </Button>
            <Button
              size="lg"
              disabled={saving}
              onClick={handleComplete}
              className="min-h-[48px]"
            >
              {saving ? "Saving..." : "Complete Setup"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

// ─── Profile View (post-onboarding) ────────────────────────

function ProfileView() {
  const { user } = useAuth();
  const email = user?.signInDetails?.loginId || "Unknown";
  const { data: profile, isLoading } = useUserProfile();
  const { data: injuries } = useActiveInjuries();
  const updateProfile = useUpdateUserProfile();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    weightLbs: "",
    gymPreference: "" as GymLocation,
    onWegovy: false,
    wegovyStartDate: "",
  });

  const startEdit = () => {
    if (profile) {
      setEditData({
        weightLbs: profile.weightLbs?.toString() ?? "",
        gymPreference: (profile.gymPreference as GymLocation) ?? "LA_FITNESS",
        onWegovy: profile.onWegovy ?? false,
        wegovyStartDate: profile.wegovyStartDate ?? "",
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        weightLbs: parseFloat(editData.weightLbs) || undefined,
        gymPreference: editData.gymPreference,
        onWegovy: editData.onWegovy,
        wegovyStartDate:
          editData.onWegovy && editData.wegovyStartDate
            ? editData.wegovyStartDate
            : undefined,
      });
      toast.success("Profile updated.");
      setEditing(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          Loading profile...
        </div>
      </div>
    );
  }

  const gymLabel =
    GYM_OPTIONS.find((g) => g.value === profile?.gymPreference)?.label ??
    profile?.gymPreference ??
    "Not set";

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Profile
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your account and preferences.
          </p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={startEdit} className="min-h-[48px]">
            Edit Profile
          </Button>
        )}
      </div>

      {editing ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weight (lbs)
                </label>
                <Input
                  type="number"
                  value={editData.weightLbs}
                  onChange={(e) =>
                    setEditData((d) => ({ ...d, weightLbs: e.target.value }))
                  }
                  className="min-h-[48px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Gym
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {GYM_OPTIONS.map((gym) => (
                    <button
                      key={gym.value}
                      type="button"
                      onClick={() =>
                        setEditData((d) => ({
                          ...d,
                          gymPreference: gym.value,
                        }))
                      }
                      className={cn(
                        "min-h-[48px] rounded-lg border-2 px-3 py-2 text-left text-sm transition-all",
                        editData.gymPreference === gym.value
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                          : "border-gray-200 hover:border-gray-400 dark:border-gray-700"
                      )}
                    >
                      {gym.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  On Wegovy?
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditData((d) => ({ ...d, onWegovy: true }))
                    }
                    className={cn(
                      "min-h-[48px] flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-all",
                      editData.onWegovy
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditData((d) => ({
                        ...d,
                        onWegovy: false,
                        wegovyStartDate: "",
                      }))
                    }
                    className={cn(
                      "min-h-[48px] flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-all",
                      !editData.onWegovy
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    No
                  </button>
                </div>
                {editData.onWegovy && (
                  <Input
                    type="date"
                    value={editData.wegovyStartDate}
                    onChange={(e) =>
                      setEditData((d) => ({
                        ...d,
                        wegovyStartDate: e.target.value,
                      }))
                    }
                    className="mt-2 min-h-[48px]"
                  />
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              className="min-h-[48px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="min-h-[48px]"
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Email
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Age</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile?.age ?? "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Weight
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile?.weightLbs ? `${profile.weightLbs} lbs` : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Height
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile?.heightIn
                      ? `${Math.floor(profile.heightIn / 12)}'${Math.round(profile.heightIn % 12)}"`
                      : "Not set"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferences</CardTitle>
              <CardDescription>Workout and health settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Gym</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {gymLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Wegovy
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile?.onWegovy ? "Yes" : "No"}
                    {profile?.onWegovy && profile?.wegovyStartDate
                      ? ` (since ${profile.wegovyStartDate})`
                      : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {injuries && injuries.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Active Injuries</CardTitle>
                <CardDescription>
                  Current injury tracking status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {injuries.map((injury) => (
                    <div
                      key={injury.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {injury.injuryType === "PLANTAR_FASCIITIS"
                          ? "Plantar Fasciitis"
                          : "Sprained Elbow"}{" "}
                        — {injury.side}
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Stage {injury.stage}/4</span>
                        <span>Pain: {injury.currentPainLevel ?? 0}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <a
                    href="/rehab"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Manage injuries and rehab milestones &rarr;
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page Component ─────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const email = user?.signInDetails?.loginId || "Unknown";
  const { data: profile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // No profile or onboarding not complete → show wizard
  if (!profile || !profile.onboardingComplete) {
    return <OnboardingWizard email={email} />;
  }

  return <ProfileView />;
}
