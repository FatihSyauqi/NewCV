import { query } from "@/lib/db";
import PortfolioGrid from "./components/PortfolioGrid";
import Navbar from "./components/Navbar";
import Link from "next/link";
import MarqueeScroller from "./components/MarqueeScroller";
import ContactSection from "./components/ContactSection";
import PageLoader from "./components/PageLoader";

// Force dynamic rendering since we are reading from DB
export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getCVData() {
  try {
    const personalInfo = await query("SELECT * FROM personal_info LIMIT 1");
    const experiences = await query("SELECT * FROM experiences ORDER BY sort_order ASC, id DESC");
    const education = await query("SELECT * FROM education ORDER BY sort_order ASC");
    const skills = await query("SELECT * FROM skills ORDER BY sort_order ASC, id ASC");
    const certificates = await query("SELECT * FROM certificates ORDER BY sort_order ASC");
    const portfolios = await query("SELECT * FROM portfolios ORDER BY id DESC");
    const blogs = await query("SELECT * FROM blogs WHERE status = 'published' ORDER BY created_at DESC LIMIT 3");

    return {
      personalInfo: personalInfo[0] || null,
      experiences,
      education,
      skills,
      certificates,
      portfolios,
      blogs
    };
  } catch (error) {
    console.error("Error fetching CV data from database:", error);
    return {
      personalInfo: {
        name: "Fatih Syauqi",
        title: "Software Engineer",
        email: "fatihsyqi@gmail.com",
        location: "Bogor, Jawa Barat, ID",
        linkedin: "https://www.linkedin.com/in/fatihsyauqi17",
        github: "https://github.com/fatihsyauqi17",
        about_me: "I am from Indonesia and working as a software engineer. I have 10 years of experience in developing mobile applications and websites. I am skilled in solving problems, eager to learn new technologies, and able to work effectively in a team.",
        avatar_url: "/images/avatar.jpg"
      },
      experiences: [],
      education: [],
      skills: [],
      certificates: [],
      portfolios: [],
      blogs: []
    };
  }
}

export default async function Home() {
  const data = await getCVData();
  const { personalInfo, experiences, education, skills, certificates, portfolios, blogs } = data;
  const highlightedSkills = skills.filter((s) => s.is_highlight === 1);

  // Group skills by category
  const skillsGrouped = {};
  skills.forEach((s) => {
    if (!skillsGrouped[s.category]) {
      skillsGrouped[s.category] = [];
    }
    s.name.split(",").forEach((item) => {
      const trimmed = item.trim();
      if (trimmed && !skillsGrouped[s.category].includes(trimmed)) {
        skillsGrouped[s.category].push(trimmed);
      }
    });
  });

  return (
    <>
      {/* Full-screen Developer & Career Preloader */}
      <PageLoader />

      {/* Dynamic Navigation */}
      <Navbar brandName={personalInfo?.name} />

      {/* Hero Section */}
      <section 
        id="home" 
        className="hero-section min-vh-100 d-flex align-items-center"
        style={{ 
          backgroundImage: "linear-gradient(rgba(244, 248, 252, 0.78), rgba(244, 248, 252, 0.78)), url('/images/tech-doodles-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7 order-2 order-lg-1">
              <span className="section-subtitle">Resume & Portfolio</span>
              <h1 className="hero-title mb-3">
                {personalInfo?.name}
              </h1>
              <h2 className="h4 text-muted fw-normal mb-4">
                {personalInfo?.title}
              </h2>
              <p className="hero-lead mb-5" style={{ maxWidth: "600px" }}>
                {personalInfo?.about_me}
              </p>
              <div className="d-flex flex-wrap gap-3">
                <a href="#portfolio" className="btn-warm text-decoration-none">
                  Browse Projects <i className="bi bi-arrow-right ms-2"></i>
                </a>
                <a href="#experience" className="btn-warm-outline text-decoration-none">
                  Work Experiences
                </a>
              </div>
            </div>
            <div className="col-lg-5 order-1 order-lg-2 text-center mb-4 mb-lg-0">
              <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle p-2 shadow-lg"
                style={{ 
                  backgroundImage: "linear-gradient(rgba(244, 248, 252, 0.5), rgba(244, 248, 252, 0.5)), url('/images/tech-doodles-bg.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  width: "clamp(200px, 40vw, 286px)",
                  height: "clamp(200px, 40vw, 286px)"
                }}
              >
                <img
                  src={personalInfo?.avatar_url || "/images/avatar.jpg"}
                  alt={personalInfo?.name}
                  className="rounded-circle border border-4 border-white shadow-sm"
                  style={{ 
                    width: "clamp(175px, 36vw, 254px)", 
                    height: "clamp(175px, 36vw, 254px)", 
                    objectFit: "cover",
                    filter: "brightness(1.10) contrast(1.02)"
                  }}
                />
              </div>

              {/* Highlighted Skills */}
              {highlightedSkills && highlightedSkills.length > 0 && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-3 flex-wrap">
                  {highlightedSkills.map((skill) => (
                     <div 
                       key={skill.id}
                       className="bg-white rounded-circle shadow-sm border border-light-subtle d-flex align-items-center justify-content-center"
                       style={{ 
                         width: "clamp(50px, 12vw, 80px)", 
                         height: "clamp(50px, 12vw, 80px)", 
                         transition: "all 0.2s ease",
                         padding: "4px"
                       }}
                       title={skill.name}
                     >
                       {skill.logo_url ? (
                         <img src={skill.logo_url} alt={skill.name} style={{ width: "clamp(34px, 9vw, 64px)", height: "clamp(34px, 9vw, 64px)", objectFit: "contain" }} />
                       ) : (
                         <i className="bi bi-code-slash text-warning" style={{ fontSize: "2rem" }}></i>
                       )}
                     </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Profile / Resume details */}
      <section id="profile" className="py-5" style={{ backgroundColor: "#ffffff" }}>
        <div className="container py-5">
          <div className="row align-items-stretch">
            {/* Left side: Premium Metrics & Quick Connection */}
            <div className="col-lg-6 mb-5 mb-lg-0 d-flex flex-column justify-content-between">
              <div>
                <span className="section-subtitle">Key Highlights</span>
                <h2 className="section-title mb-4">Professional Metrics</h2>
                
                <div className="row g-3 mt-1">
                  <div className="col-6">
                    <div className="bg-light-subtle p-4 rounded-4 shadow-sm border border-light-subtle text-center h-100">
                      <div className="text-primary fs-1 fw-bold font-monospace">10+</div>
                      <div className="small text-muted fw-semibold">Years Experience</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light-subtle p-4 rounded-4 shadow-sm border border-light-subtle text-center h-100">
                      <div className="text-primary fs-1 fw-bold font-monospace">{portfolios.length}+</div>
                      <div className="small text-muted fw-semibold">Projects Build</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light-subtle p-4 rounded-4 shadow-sm border border-light-subtle text-center h-100">
                      <div className="text-primary fs-1 fw-bold font-monospace">{certificates.length}+</div>
                      <div className="small text-muted fw-semibold">Certificate</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light-subtle p-4 rounded-4 shadow-sm border border-light-subtle text-center h-100">
                      <div className="text-primary fs-1 fw-bold font-monospace">100%</div>
                      <div className="small text-muted fw-semibold">Success Delivery</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="p-4 rounded-4 bg-light-subtle border border-light-subtle shadow-sm">
                  <span className="small text-muted text-uppercase fw-bold font-monospace d-block mb-3">Instant Connect</span>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="social-icon-btn m-0 bg-primary text-white border-0">
                        <i className="bi bi-envelope-fill"></i>
                      </div>
                      <div>
                        <small className="text-muted d-block small">Email Address</small>
                        <strong className="text-dark small">{personalInfo?.email}</strong>
                      </div>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <a href={personalInfo?.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon-btn m-0">
                        <i className="bi bi-linkedin"></i>
                      </a>
                      <a href={personalInfo?.github} target="_blank" rel="noopener noreferrer" className="social-icon-btn m-0">
                        <i className="bi bi-github"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Academics & Credentials */}
            <div className="col-lg-6">
              <div className="card-custom h-100 bg-light-subtle">
                <h3 className="h5 fw-bold mb-4 text-dark">
                  <i className="bi bi-book me-2 text-primary"></i> Academic Background
                </h3>
                {education.map((edu) => (
                  <div key={edu.id} className="mb-4 d-flex align-items-start gap-3">
                    {/* School Logo */}
                    <div className="flex-shrink-0 bg-white border border-light-subtle rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "72px", height: "72px", padding: "3px" }}>
                      {edu.logo_url ? (
                        <img src={edu.logo_url} alt={edu.school} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      ) : (
                        <div className="text-primary-emphasis d-flex align-items-center justify-content-center bg-primary-subtle rounded-circle" style={{ width: "52px", height: "52px" }}>
                          <i className="bi bi-mortarboard fs-4"></i>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-grow-1">
                      <h4 className="h6 text-dark fw-bold mb-1">{edu.degree} in {edu.major}</h4>
                      <p className="small text-muted mb-0">{edu.school}</p>
                      <small className="text-muted d-block mt-1">
                        <i className="bi bi-calendar-range me-1"></i> {edu.start_date} - {edu.end_date}
                      </small>
                    </div>
                  </div>
                ))}

                <hr className="my-4 border-light-subtle" />

                <h3 className="h5 fw-bold mb-4 text-dark">
                  <i className="bi bi-patch-check me-2 text-primary"></i> Professional Credentials
                </h3>
                {certificates.map((cert) => (
                  <div key={cert.id} className="d-flex align-items-start mb-3">
                    <div className="text-primary me-3">
                      <i className="bi bi-award fs-4"></i>
                    </div>
                    <div>
                      <h4 className="h6 mb-0 text-dark fw-bold">{cert.title}</h4>
                      <p className="small text-muted mb-1">{cert.issuer} | Credential: {cert.credential_id}</p>
                      <small className="text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
                        Issued: {cert.issue_date}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Experiences Section */}
      <section 
        id="experience" 
        className="py-5" 
        style={{ 
          backgroundImage: "linear-gradient(rgba(244, 248, 252, 0.9), rgba(244, 248, 252, 0.9)), url('/images/ai-tech-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="container py-5">
          <div className="text-center">
            <span className="section-subtitle">Career Timeline</span>
            <h2 className="section-title section-title-center mb-5">Work Experiences</h2>
          </div>

          <div className="row justify-content-center">
            <div className="col-12">
              <div className="resume-section">
                {experiences.map((exp, idx) => {
                  const expSkillIds = exp.skill_ids ? exp.skill_ids.split(",").map(Number).filter(Boolean) : [];
                  const expSkills = skills.filter((s) => expSkillIds.includes(s.id));
                  return (
                    <div key={exp.id} className="resume-item">
                      <div className={idx === 0 ? "resume-dot-latest" : "resume-dot"}></div>
                      <div className="resume-content">
                        <div className="card-custom bg-white text-start">
                          {/* Header Row: Logo next to Title info */}
                          <div className="d-flex align-items-center gap-4 mb-3">
                            {/* Company Logo */}
                            <div className="flex-shrink-0 bg-white border border-light-subtle rounded-3 p-1 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
                              {exp.logo_url ? (
                                <img 
                                  src={exp.logo_url} 
                                  alt={exp.company} 
                                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} 
                                />
                              ) : (
                                <div className="text-primary-emphasis d-flex align-items-center justify-content-center bg-primary-subtle rounded-circle" style={{ width: "60px", height: "60px" }}>
                                  <i className="bi bi-building fs-3"></i>
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-grow-1">
                              <span className="resume-date d-inline-block mb-1">{exp.start_date} - {exp.end_date}</span>
                              <h3 className="resume-title mb-1">{exp.role}</h3>
                              <h4 className="resume-company mb-0 text-muted-emphasis">
                                {exp.company} - <i className="bi bi-geo-alt me-1"></i> {exp.location}
                              </h4>
                            </div>
                          </div>

                          {/* Description (aligned to the left of the card, flush with the logo) */}
                          <p className="text-muted mb-0" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>{exp.description}</p>

                          {/* Associated Skills */}
                          {expSkills.length > 0 && (
                            <div className="d-flex flex-wrap gap-3 mt-4 pt-3 border-top border-light-subtle align-items-center">
                              <small className="text-muted fw-bold me-1" style={{ fontSize: "0.8rem" }}>Skills & Tech Stack:</small>
                              {expSkills.map((s) => (
                                <div 
                                  key={s.id} 
                                  className="d-inline-flex align-items-center gap-2 px-1 py-1 bg-light border border-light-subtle rounded-3"
                                  title={s.name}
                                >
                                  {s.logo_url ? (
                                    <img src={s.logo_url} alt="" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                                  ) : (
                                    <i className="bi bi-code-slash text-primary" style={{ fontSize: "0.85rem" }}></i>
                                  )}
                                  <span className="fw-semibold text-dark" style={{ fontSize: "0.8rem" }}>{s.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Projects Section */}
      <section id="portfolio" className="py-5" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="container py-5">
          <div className="text-center">
            <span className="section-subtitle">Portfolio</span>
            <h2 className="section-title section-title-center mb-5">Featured Works</h2>
          </div>

          {portfolios.length > 0 ? (
            <PortfolioGrid initialPortfolios={portfolios} />
          ) : (
            <div className="text-center text-muted">No projects found.</div>
          )}
        </div>
      </section>

      {/* Blog Articles Section */}
      <section id="blog" className="py-5" style={{ backgroundColor: "#ffffff" }}>
        <div className="container py-5">
          <div className="text-center">
            <span className="section-subtitle">Publications</span>
            <h2 className="section-title section-title-center mb-5">Articles & Shared Knowledge</h2>
          </div>

          {blogs.length > 0 ? (
            <div className="row g-4">
              {blogs.map((post) => (
                <div key={post.id} className="col-12 col-md-6 col-lg-4 d-flex">
                  <div className="card-custom w-100 p-0 overflow-hidden d-flex flex-column justify-content-between">
                    <div>
                      <div style={{ height: "180px", position: "relative" }}>
                        <img
                          src={post.image_url || "/images/blog-placeholder.svg"}
                          alt={post.title}
                          className="w-100 h-100 object-fit-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge bg-light text-primary border border-light-subtle px-2 py-1.5 rounded">
                            {post.category}
                          </span>
                          <small className="text-muted">
                            {new Date(post.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </small>
                        </div>
                        <h3 className="h6 mb-2 text-dark fw-bold">
                          <Link href={`/blog/${post.slug}`} className="text-decoration-none text-dark hover-primary">
                            {post.title}
                          </Link>
                        </h3>
                        <p className="small text-muted mb-0">{post.excerpt}</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <Link href={`/blog/${post.slug}`} className="btn btn-sm btn-warm-outline w-100">
                        Read Full Article <i className="bi bi-book ms-1"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted">No articles found.</div>
          )}
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-5" style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-card-border)" }}>
        <div className="container py-5">
          <div className="text-center mb-5">
            <span className="section-subtitle">Technical Skillset</span>
            <h2 className="section-title section-title-center">Tech Stack & Expertise</h2>
          </div>

          {skills && skills.length > 0 ? (
            <MarqueeScroller skills={skills} />
          ) : (
            <div className="text-center text-muted">No skills found.</div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="row g-4 justify-content-between">
            <div className="col-md-5">
              <h5 className="fs-4 text-dark mb-3">Fatih Syauqi<span className="text-primary">.</span></h5>
              <p className="text-muted mb-4" style={{ maxWidth: "400px" }}>
                Software Engineer offering 10 years of robust experience in crafting mobile applications and responsive full-stack websites.
              </p>
              <div className="d-flex mb-4">
                <a href={personalInfo?.linkedin} target="_blank" rel="noopener noreferrer" className="footer-social-btn">
                  <i className="bi bi-linkedin"></i>
                </a>
                <a href={personalInfo?.github} target="_blank" rel="noopener noreferrer" className="footer-social-btn">
                  <i className="bi bi-github"></i>
                </a>
              </div>
            </div>
            <div className="col-md-3">
              <h5 className="fs-6 text-uppercase text-dark tracking-wider mb-4">Navigation</h5>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><a href="#home" className="footer-link">Home</a></li>
                <li><a href="#profile" className="footer-link">Profile Info</a></li>
                <li><a href="#experience" className="footer-link">Experiences</a></li>
                <li><a href="#portfolio" className="footer-link">Portfolio</a></li>
                <li><a href="#blog" className="footer-link">Blog</a></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5 className="fs-6 text-uppercase text-dark tracking-wider mb-4">Inquiries</h5>
              <p className="small text-muted mb-4">
                For contract inquiries, consultations, or direct recruitment, send a message or request my full resume.
              </p>
              <ContactSection email={personalInfo?.email} />
            </div>
          </div>
          <hr className="my-4 border-light-subtle" style={{ opacity: "0.1" }} />
          <div className="d-flex flex-wrap justify-content-between align-items-center text-muted small">
            <span>&copy; {new Date().getFullYear()} {personalInfo?.name}. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
