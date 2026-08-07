import { query } from "@/lib/db";
import { getSeoSettings } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";

// Force dynamic rendering since we are reading from DB
export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getBlogPost(slug) {
  try {
    const posts = await query("SELECT * FROM blogs WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    return posts[0] || null;
  } catch (error) {
    console.error("Error fetching blog post from database:", error);
    return null;
  }
}

async function getPersonalInfo() {
  try {
    const rows = await query("SELECT * FROM personal_info LIMIT 1");
    return rows[0] || null;
  } catch (error) {
    console.error("Error fetching personal info:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const post = await getBlogPost(params.slug);
  const personalInfo = await getPersonalInfo();
  const seo = await getSeoSettings();

  if (!post) {
    return {
      title: "Artikel Tidak Ditemukan",
    };
  }

  const title = `${post.title} | ${personalInfo?.name || "Fatih Syauqi"}`;
  const description = post.excerpt || post.content?.substring(0, 155) || "Artikel pemrograman dan rekayasa perangkat lunak.";
  const ogImage = post.image_url || seo?.og_image || personalInfo?.avatar_url || "/images/avatar.jpg";
  const canonicalUrl = seo?.canonical_url || "https://fatihsyauqi.my.id";

  return {
    title: title,
    description: description,
    keywords: `${post.category || 'Software Engineering'}, ${post.title}, Fatih Syauqi, Blog`,
    authors: [{ name: personalInfo?.name || "Fatih Syauqi" }],
    openGraph: {
      title: post.title,
      description: description,
      url: `/blog/${post.slug}`,
      siteName: `${personalInfo?.name || "Fatih Syauqi"} Blog`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
      publishedTime: post.created_at,
      authors: [personalInfo?.name || "Fatih Syauqi"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostDetail({ params }) {
  const [post, personalInfo, seo] = await Promise.all([
    getBlogPost(params.slug),
    getPersonalInfo(),
    getSeoSettings()
  ]);

  if (!post) {
    notFound();
  }

  const authorName = personalInfo?.name || "Fatih Syauqi";
  const authorAvatar = personalInfo?.avatar_url || "/images/avatar.jpg";
  const authorAbout = personalInfo?.about_me || "";
  const authorTitle = personalInfo?.title || "Software Engineer";
  const canonicalUrl = seo?.canonical_url || "https://fatihsyauqi.my.id";

  const jsonLdBlogPost = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": [post.image_url || "/images/blog-placeholder.svg"],
    "datePublished": post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "author": [{
      "@type": "Person",
      "name": authorName,
      "url": canonicalUrl
    }],
    "description": post.excerpt || post.content?.substring(0, 150),
    "articleBody": post.content
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBlogPost) }}
      />
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
                  <i className="bi bi-person-circle me-1"></i> {authorName}
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
                  src={authorAvatar}
                  alt={authorName}
                  className="rounded-circle border border-3 border-white shadow-sm flex-shrink-0"
                  style={{ width: "80px", height: "80px", objectFit: "cover" }}
                />
                <div>
                  <h4 className="h5 fw-bold mb-1 text-dark">About {authorName}</h4>
                  <p className="small text-muted mb-0">
                    {authorAbout || `${authorTitle} passionate about building great software.`}
                  </p>
                </div>
              </div>

              {/* Navigation Back */}
              <div className="mt-5 text-center">
                <Link href="/" className="btn btn-warm-outline">
                  <i className="bi bi-arrow-left me-2"></i> Return to Portfolio &amp; CV
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer mt-5">
        <div className="container text-center text-muted-emphasis small">
          <span>&copy; {new Date().getFullYear()} {authorName}. All rights reserved. Created with Next.js &amp; Bootstrap 5.</span>
        </div>
      </footer>
    </>
  );
}
