import { query } from "@/lib/db";
import InquiriesClient from "./InquiriesClient";

export const revalidate = 0;

async function getInquiries() {
  try {
    const list = await query("SELECT * FROM contact_inquiries ORDER BY created_at DESC");
    return list;
  } catch (err) {
    console.error("Failed to fetch inquiries:", err);
    return [];
  }
}

export default async function InquiriesPage() {
  const initialInquiries = await getInquiries();
  return <InquiriesClient initialInquiries={initialInquiries} />;
}
