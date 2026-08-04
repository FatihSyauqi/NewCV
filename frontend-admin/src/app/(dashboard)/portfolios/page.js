import { query } from "@/lib/db";
import PortfoliosClient from "./PortfoliosClient";

export const revalidate = 0;

async function getPortfolios() {
  try {
    return await query("SELECT * FROM portfolios ORDER BY id DESC");
  } catch (error) {
    console.error("Error loading portfolios:", error);
    return [];
  }
}

export default async function PortfoliosPage() {
  const list = await getPortfolios();

  return <PortfoliosClient initialPortfolios={list} />;
}
