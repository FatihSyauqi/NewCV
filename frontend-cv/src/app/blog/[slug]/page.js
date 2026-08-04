import { query } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

// Force dynamic rendering since we are reading from DB
export const revalidate = 0;

async function getBlogPost(slug) {
  try {
    const posts = await query("SELECT * FROM blogs WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    return posts[0] || null;
  } catch (error) {
    console.error("Error fetching blog post from database:", error);
    return null;
  }
}

export default async function BlogPostDetail({ params }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg fixed-top custom-nav">
        <div className="container">
          <Link href="/" className="navbar-brand font-serif fw-bold text-dark fs-4">
            FS<span className="text-warning">.</span>
          </Link>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link href="/" className="nav-link-custom">
                  <i className="bi bi-arrow-left me-1"></i> Back to CV
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="min-vh-100 py-5" style={{ marginTop: "5rem" }}>
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Breadcrumbs / Category */}
              <div className="d-flex align-items-center mb-3">
                <Link href="/" className="text-warning text-decoration-none fw-semibold text-uppercase small letter-spacing-1">
                  Home
                </Link>
                <span className="mx-2 text-muted">/</span>
                <span className="text-muted small text-uppercase letter-spacing-1">{post.category}</span>
              </div>

              {/* Title */}
              <h1 className="font-serif fw-bold text-dark display-5 mb-3">
                {post.title}
              </h1>

              {/* Meta information */}
              <div className="d-flex align-items-center gap-3 text-muted small mb-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-person-circle me-1"></i> Fatih Syauqi
                </div>
                <div>•</div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-calendar-event me-1"></i>
                  {new Date(post.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </div>
              </div>

              {/* Cover Image */}
              <div className="rounded-4 overflow-hidden mb-5 shadow-sm" style={{ maxHeight: "450px" }}>
                <img
                  src={post.image_url || "/images/blog-placeholder.svg"}
                  alt={post.title}
                  className="w-100 h-100 object-fit-cover"
                  style={{ minHeight: "300px" }}
                />
              </div>

              {/* Blog Content body */}
              <div 
                className="blog-post-content text-dark-emphasis"
                style={{
                  fontSize: "1.15rem",
                  lineHeight: "1.8",
                  whiteSpace: "pre-line"
                }}
              >
                {post.content}
              </div>

              <hr className="my-5 border-light-subtle" />

              {/* Author Box */}
              <div className="card-custom p-4 bg-light border-0 d-flex flex-sm-row align-items-center gap-4">
                <img
                  src="/images/avatar.jpg"
                  alt="Fatih Syauqi"
                  className="rounded-circle border border-3 border-white shadow-sm"
                  style={{ width: "80px", height: "80px", objectFit: "cover" }}
                />
                <div>
                  <h4 className="h5 fw-bold mb-1 text-dark">About Fatih Syauqi</h4>
                  <p className="small text-muted mb-0">
                    A Senior Software Engineer with 9 years of expertise in fullstack web and mobile application engineering. Passionate about microservices, mobile UX, and clean architecture.
                  </p>
                </div>
              </div>

              {/* Navigation Back */}
              <div className="mt-5 text-center">
                <Link href="/" className="btn btn-warm-outline">
                  <i className="bi bi-arrow-left me-2"></i> Return to Portfolio & CV
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer mt-5">
        <div className="container text-center text-muted-emphasis small">
          <span>© {new Date().getFullYear()} Fatih Syauqi. All rights reserved. Created with Next.js & Bootstrap 5.</span>
        </div>
      </footer>
    </>
  );
}
