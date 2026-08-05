import { query } from "@/lib/db";
import CVSectionsClient from "./CVSectionsClient";

export const revalidate = 0;

async function getData() {
  try {
    const experiences = await query("SELECT * FROM experiences ORDER BY sort_order ASC, id DESC");
    const education = await query("SELECT * FROM education ORDER BY sort_order ASC, id DESC");
    const certificates = await query("SELECT * FROM certificates ORDER BY sort_order ASC, id DESC");
    const skills = await query("SELECT * FROM skills ORDER BY id DESC");

    return { experiences, education, certificates, skills };
  } catch (error) {
    console.error("Error loading CV sections data:", error);
    return { experiences: [], education: [], certificates: [], skills: [] };
  }
}

export default async function CVSectionsPage() {
  const { experiences, education, certificates, skills } = await getData();

  return (
    <CVSectionsClient
      initialExperiences={experiences}
      initialEducation={education}
      initialCertificates={certificates}
      initialSkills={skills}
    />
  );
}
