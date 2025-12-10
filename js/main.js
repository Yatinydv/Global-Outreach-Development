// Small enhancements: form feedback, keyboard shortcut, and parallax blobs
document.addEventListener('DOMContentLoaded', function(){
  // --- Client-side auth overlay logic (name & email) ---
  const authOverlay = document.getElementById('auth-overlay');
  const authSubmit = document.getElementById('auth-submit');
  const nameInput = document.getElementById('site-name');
  const emailInput = document.getElementById('site-email');
  const loginBtn = document.getElementById('login-btn');

  function updateLoginButton(){
    try{
      if (sessionStorage.getItem('siteUnlocked') === '1'){
        const n = sessionStorage.getItem('siteUserName') || 'User';
        loginBtn.textContent = 'Hi, ' + n;
        loginBtn.classList.add('logged-in');
      } else {
        loginBtn.textContent = 'Login';
        loginBtn.classList.remove('logged-in');
      }
    }catch(e){/* ignore */}
  }

  function unlockSite(userName, userEmail){
    if (!authOverlay) return;
    authOverlay.setAttribute('aria-hidden','true');
    try{
      sessionStorage.setItem('siteUnlocked','1');
      sessionStorage.setItem('siteUserName', userName || '');
      sessionStorage.setItem('siteUserEmail', userEmail || '');
    }catch(e){}
    updateLoginButton();
  }

  function lockSite(){
    if (!authOverlay) return;
    authOverlay.setAttribute('aria-hidden','false');
    updateLoginButton();
  }

  // On load, if session indicates unlocked, hide overlay and update header
  try{
    if (sessionStorage.getItem('siteUnlocked') === '1') {
      authOverlay && authOverlay.setAttribute('aria-hidden','true');
    }
  }catch(e){}
  updateLoginButton();

  // validate email simple regex
  function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
  }

  if (authSubmit && nameInput && emailInput) {
    authSubmit.addEventListener('click', function(){
      const nm = (nameInput.value || '').trim();
      const em = (emailInput.value || '').trim();
      // basic validation
      if (!nm) {
        nameInput.classList.add('auth-error');
        nameInput.focus();
        setTimeout(()=> nameInput.classList.remove('auth-error'), 900);
        return;
      }
      if (!isValidEmail(em)) {
        emailInput.classList.add('auth-error');
        emailInput.focus();
        setTimeout(()=> emailInput.classList.remove('auth-error'), 900);
        return;
      }
      // success: store and unlock
      unlockSite(nm, em);
    });
    emailInput.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') authSubmit.click(); });
    nameInput.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') { ev.preventDefault(); emailInput.focus(); } });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', function(){
      // If already unlocked, clicking allows logout (confirm)
      try{
        if (sessionStorage.getItem('siteUnlocked') === '1'){
          const ok = confirm('Logout and lock the site?');
          if (ok) {
            try{ sessionStorage.removeItem('siteUnlocked'); sessionStorage.removeItem('siteUserName'); sessionStorage.removeItem('siteUserEmail'); }catch(e){}
            // show overlay again
            authOverlay && authOverlay.setAttribute('aria-hidden','false');
            updateLoginButton();
            return;
          }
        }
      }catch(e){}
      // open the overlay for login
      authOverlay && authOverlay.setAttribute('aria-hidden','false');
      nameInput && nameInput.focus();
    });
  }
  // --- end auth overlay logic ---
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');

  if (form) {
    form.addEventListener('submit', async function(e){
      // Prevent submission if overlay still active
      if (authOverlay && authOverlay.getAttribute('aria-hidden') !== 'true') {
        alert('Please unlock the site first using the Login button.');
        return;
      }
      e.preventDefault();
      feedback.textContent = 'Sending...';
      const endpoint = form.dataset.endpoint;
      const formData = new FormData(form);
      const emailjsService = form.dataset.emailjsService;
      const emailjsTemplate = form.dataset.emailjsTemplate;
      const emailjsUser = form.dataset.emailjsUser;

      // Try EmailJS first (client-side email delivery) if configured
      if (emailjsService && emailjsTemplate && emailjsUser) {
        try {
          // load EmailJS if not already loaded
          if (!window.emailjs) {
            await loadScript('https://cdn.emailjs.com/sdk/3.2.0/email.min.js');
            emailjs.init(emailjsUser);
          }
          const templateParams = {};
          formData.forEach((v,k)=> templateParams[k]=v);
          await emailjs.send(emailjsService, emailjsTemplate, templateParams);
          feedback.textContent = 'Message sent — thank you!';
          form.reset();
          setTimeout(()=> feedback.textContent = '', 6000);
          return;
        } catch (err) {
          console.warn('EmailJS send failed', err);
          // fallthrough to next option
        }
      }

      // Next: Formspree-style POST
      if (endpoint && endpoint.includes('formspree.io')) {
        try {
          const payload = {};
          formData.forEach((v,k)=> payload[k]=v);
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            feedback.textContent = 'Response sent — thank you!';
            form.reset();
            showModal();
          } else {
            throw new Error('Server returned ' + res.status);
          }
        } catch (err) {
          console.error(err);
          feedback.textContent = 'Error Found — please try again later.';
        }
      } else {
        // No endpoint configured
        feedback.textContent = 'No delivery endpoint configured. Please contact the site owner.';
      }
      setTimeout(()=> feedback.textContent = '', 6000);
    });
  }

  // Modal helpers
  const modal = document.getElementById('success-modal');
  const modalClose = modal && modal.querySelector('.modal-close');
  const modalOk = modal && modal.querySelector('.modal-ok');
  function showModal(){
    if (!modal) return;
    modal.setAttribute('aria-hidden','false');
    // auto-close after 4 seconds
    window.setTimeout(hideModal, 4000);
  }
  function hideModal(){
    if (!modal) return;
    modal.setAttribute('aria-hidden','true');
  }
  if(modalClose) modalClose.addEventListener('click', hideModal);
  if(modalOk) modalOk.addEventListener('click', hideModal);
  // also close when clicking outside content
  if(modal) modal.addEventListener('click', function(ev){ if(ev.target === modal) hideModal(); });

  // small helper to load external script
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Keyboard shortcut demo (press '?')
  document.addEventListener('keydown', function(ev){
    if (ev.key === '?') {
      ev.preventDefault();
      alert('Shortcut demo: no search implemented.');
    }
  });

  function openMailClient(formData){
    const to = form ? (form.getAttribute('action') || '') : '';
    const subject = encodeURIComponent(formData.get('name') ? 'Contact from ' + formData.get('name') : 'Website message');
    const body = encodeURIComponent((formData.get('message')||'') + '\n\nEmail: ' + (formData.get('email')||''));
    const mailto = `${to}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  }

  // Parallax blobs on pointer move (desktop)
  const blobs = document.querySelectorAll('.hero .blob');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (blobs.length && !prefersReduced) {
    document.addEventListener('pointermove', function(ev){
      const cx = window.innerWidth/2;
      const cy = window.innerHeight/2;
      const dx = (ev.clientX - cx)/cx;
      const dy = (ev.clientY - cy)/cy;
      blobs.forEach((b, i)=>{
        const depth = (i+1)*6; // different depth per blob
        b.style.transform = `translate3d(${dx*depth}px, ${dy*depth}px, 0)`;
      });
    });
  }
});
