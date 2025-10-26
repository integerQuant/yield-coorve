
export default function Footer() {
  return (
    <footer className="site-footer container" id="contact">
      <span>© {new Date().getFullYear()}       <a href="https://rmtb.dev" className="button">RMTB</a>
</span>
      <a href="mailto:rodrigomtorresb@gmail.com" className="button">get in touch</a>
    </footer>
  );
}
