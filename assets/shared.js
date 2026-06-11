(function () {
  const nav = document.querySelector('nav.top');
  if (nav) nav.innerHTML = `
    <div class="container row">
      <a href="/" class="brand"><img src="/assets/logo_120_transparent.svg" alt="" width="1024" height="1024"> Freedom Clock</a>
      <div class="links">
        <a href="/#calculator">Calculator</a>
        <a href="/build/">Build it</a>
        <a href="/privacy/">Privacy</a>
        <a href="/faq/">FAQ</a>
        <a href="https://github.com/mr21free/freedom-clock" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>`;

  const footer = document.querySelector('footer');
  if (footer) footer.innerHTML = `
    <div class="container row">
      <div class="footer-tagline"><b>Built openly. MIT licensed. Make it yours.</b></div>
      <div class="footer-links">
        <a href="https://miroremias.com/projects/from-bitcoin-block-clock-to-freedom-clock/" target="_blank" rel="noopener">The story</a>
        <a href="/#calculator">Calculator</a>
        <a href="/build/">Build guide</a>
        <a href="/privacy/">Privacy</a>
        <a href="/freedom-time/">Freedom time</a>
        <a href="/use-freedom-time/">Use freedom time</a>
        <a href="/sell-vs-borrow/">Sell vs borrow</a>
        <a href="/faq/">FAQ</a>
        <a href="/about/">About</a>
        <a href="https://github.com/mr21free/freedom-clock" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>`;
}());
