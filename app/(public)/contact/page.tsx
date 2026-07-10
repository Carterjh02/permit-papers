export default function ContactPage() {
  return (
    <div className="contact-container">

      <section className="contact-hero">
        <h1 className="contact-title">Contact Us</h1>
        <p className="contact-subtitle">
          Have questions, feature requests, or need help with your workflow? We’d love to hear from you.
        </p>
      </section>

      <section className="contact-section">
        <h2 className="section-title">Send Us a Message</h2>

        <form className="contact-form">
          <label>
            Name
            <input type="text" name="name" placeholder="Your name" />
          </label>

          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" />
          </label>

          <label>
            Message
            <textarea name="message" placeholder="How can we help?" />
          </label>

          <button type="submit" className="btn-primary">
            Submit
          </button>
        </form>
      </section>

      <section className="contact-section">
        <h2 className="section-title">Other Ways to Reach Us</h2>

        <p className="contact-text">
          You can also email us directly at:
        </p>

        <p className="contact-email">
          <a href="mailto:admin@permitpapers.com">admin@permitpapers.com</a>
        </p>

        <p className="contact-text">
          For common questions and troubleshooting tips, visit our Help Center & Forums.
        </p>

        <a href="/forums" className="btn-secondary">
          View Forums
        </a>
      </section>

    </div>
  );
}
