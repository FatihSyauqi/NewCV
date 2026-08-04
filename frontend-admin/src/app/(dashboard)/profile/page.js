import { query } from "@/lib/db";
import ProfileForm from "./ProfileForm";

export const revalidate = 0;

async function getProfile() {
  try {
    const res = await query("SELECT * FROM personal_info LIMIT 1");
    return res[0] || null;
  } catch (error) {
    console.error("Error loading profile info:", error);
    return null;
  }
}

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-dark mb-1">Edit Profile Info</h1>
        <p className="text-muted mb-0">Update Fatih Syauqi's personal summary and contact details</p>
      </div>

      <div className="admin-card">
        <ProfileForm initialProfile={profile} />
      </div>
    </div>
  );
}
