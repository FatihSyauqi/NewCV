import { query } from "@/lib/db";
import BlogsClient from "./BlogsClient";

export const revalidate = 0;

async function getBlogs() {
  try {
    return await query("SELECT * FROM blogs ORDER BY id DESC");
  } catch (error) {
    console.error("Error loading blog posts:", error);
    return [];
  }
}

export default async function BlogsPage() {
  const list = await getBlogs();

  return <BlogsClient initialBlogs={list} />;
}
