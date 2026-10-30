// The small behaviours of researchgraph.org. The site works without them.
// 1. Join the email address, which no built file holds whole.
document.querySelectorAll('.js-email').forEach((a) => {
  const address = `${a.dataset.user}@${a.dataset.domain}`;
  a.href = `mailto:${address}`;
  a.textContent = address;
});

// 2. On a phone the menu starts closed; on a wider screen it stays open.
const menu = document.querySelector('.rg-menu');
const wide = window.matchMedia('(min-width: 768px)');
const fit = () => { if (menu) menu.open = wide.matches; };
fit();
wide.addEventListener('change', fit);
// Close an open drop-down when another opens.
document.querySelectorAll('.rg-nav details').forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) document.querySelectorAll('.rg-nav details').forEach((o) => { if (o !== d) o.open = false; });
}));

// 3. The sign-up form asks the hub (Ghost) to send its confirmation email,
// and reports the outcome in place. Ghost accepts the request only with a
// one-time integrity token, which the script fetches from the hub first.
// Without this script the form takes the reader to the hub's own sign-up,
// and the address never enters a URL.
const form = document.querySelector('.signup-form');
if (form && window.fetch) {
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button');
  const notice = form.querySelector('.signup-notice');
  const say = (kind, text) => {
    notice.hidden = false;
    notice.classList.toggle('rg-notice--error', kind === 'error');
    notice.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    input.setAttribute('aria-invalid', kind === 'error' && text === notice.dataset.invalid ? 'true' : 'false');
    const p = notice.querySelector('p');
    p.textContent = '';
    const [word, rest] = text.split(/:(.*)/s);
    const b = document.createElement('strong');
    b.textContent = `${word}:`;
    p.append(b, rest);
    if (kind === 'error' && text === notice.dataset.failed) {
      const a = document.createElement('a');
      a.href = form.action;
      a.textContent = 'Subscribe on the hub';
      p.append(' ', a, '.');
    }
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('error', notice.dataset.invalid); input.focus(); return; }
    button.disabled = true;
    try {
      const token = await fetch(new URL('../integrity-token/', form.dataset.api));
      if (!token.ok) throw new Error(String(token.status));
      const res = await fetch(form.dataset.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, emailType: 'signup', integrityToken: await token.text() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      say('done', notice.dataset.done);
      form.reset();
    } catch {
      say('error', notice.dataset.failed);
    } finally {
      button.disabled = false;
    }
  });
}

// 4. A graph drawn to the metamodel guide draws itself once and answers to the
// pointer and the keyboard (public/brand/metamodel.md, section 4).
if (window.RGGraph) window.RGGraph.init();
