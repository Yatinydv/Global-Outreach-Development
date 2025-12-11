// Small enhancements: form feedback, keyboard shortcut, and parallax blobs
document.addEventListener('DOMContentLoaded', function(){
  // --- Client-side auth overlay logic (email verification + owner password) ---
  const authOverlay = document.getElementById('auth-overlay');
  const authSubmit = document.getElementById('auth-submit');
  const nameInput = document.getElementById('site-name');
  const emailInput = document.getElementById('site-email');
  const loginBtn = document.getElementById('login-btn');
  const ownerToggle = document.getElementById('owner-toggle');
  const ownerFlow = document.getElementById('owner-flow');
  const ownerPassword = document.getElementById('owner-password');
  const emailVerifyStep = document.getElementById('email-verify-step');
  const emailCodeInput = document.getElementById('email-code');
  const verifyCodeBtn = document.getElementById('verify-code');
  const authMessage = document.getElementById('auth-message');

  let ownerMode = false;

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
      sessionStorage.removeItem('emailVerificationCode');
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

  function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ''); }

  // Toggle between email flow and owner password flow
  if (ownerToggle) {
    ownerToggle.addEventListener('click', function(){
      ownerMode = !ownerMode;
      if (ownerMode) {
        ownerFlow.style.display = '';
        document.getElementById('email-flow').style.display = 'none';
        authMessage.textContent = 'Enter the owner password to access the site.';
        ownerPassword && ownerPassword.focus();
      } else {
        ownerFlow.style.display = 'none';
        document.getElementById('email-flow').style.display = '';
        authMessage.textContent = 'Enter your name and email to access the site.';
        nameInput && nameInput.focus();
      }
    });
  }

  // Handle initial login/submit
  if (authSubmit) {
    authSubmit.addEventListener('click', function(){
      if (ownerMode) {
        const pw = (ownerPassword && ownerPassword.value || '').trim();
        if (!pw) {
          ownerPassword.classList.add('auth-error'); ownerPassword.focus();
          setTimeout(()=> ownerPassword.classList.remove('auth-error'), 800); return;
        }
        // Owner password check (plain client-side password)
        if (pw === '6728') {
          unlockSite('Owner','');
        } else {
          authMessage.textContent = 'Incorrect owner password.';
          ownerPassword.classList.add('auth-error');
          setTimeout(()=> ownerPassword.classList.remove('auth-error'), 900);
        }
        return;
      }

      // Email flow: validate name/email and start verification
      const nm = (nameInput && nameInput.value || '').trim();
      const em = (emailInput && emailInput.value || '').trim();
      if (!nm) { nameInput.classList.add('auth-error'); nameInput.focus(); setTimeout(()=> nameInput.classList.remove('auth-error'),900); return; }
      if (!isValidEmail(em)) { emailInput.classList.add('auth-error'); emailInput.focus(); setTimeout(()=> emailInput.classList.remove('auth-error'),900); return; }

      // Generate a 6-digit verification code
      const code = ('000000' + Math.floor(Math.random()*1000000)).slice(-6);
      try { sessionStorage.setItem('emailVerificationCode', code); sessionStorage.setItem('emailPendingName', nm); sessionStorage.setItem('emailPendingAddress', em); }catch(e){}
      emailVerifyStep && (emailVerifyStep.style.display = '');

      // Attempt to send via EmailJS if configured in meta tags
      const metaUser = document.querySelector('meta[name="emailjs-user"]');
      const metaService = document.querySelector('meta[name="emailjs-service"]');
      const metaTemplate = document.querySelector('meta[name="emailjs-template"]');
      const emailjsUser = metaUser && metaUser.content || '';
      const emailjsService = metaService && metaService.content || '';
      const emailjsTemplate = metaTemplate && metaTemplate.content || '';

      if (emailjsUser && emailjsService && emailjsTemplate && emailjsUser !== 'YOUR_EMAILJS_USER_ID') {
        authMessage.textContent = 'Sending verification code to your email...';
        (async function(){
          try {
            if (!window.emailjs) {
              await loadScript('https://cdn.emailjs.com/sdk/3.2.0/email.min.js');
              emailjs.init(emailjsUser);
            }
            const templateParams = { to_email: em, code: code, name: nm };
            await emailjs.send(emailjsService, emailjsTemplate, templateParams);
            authMessage.textContent = 'Verification code sent — check your inbox.';
            emailCodeInput && emailCodeInput.focus();
          } catch (err) {
            console.warn('EmailJS send failed', err);
            // Fallback: show code in UI for demo/testing
            authMessage.textContent = 'Failed to send email; showing code for demo: ' + code;
            emailCodeInput && emailCodeInput.focus();
          }
        })();
      } else {
        // No EmailJS configured: fallback to showing code in UI for demo/testing
        authMessage.textContent = 'A verification code was generated (demo). Enter the code below.';
        authMessage.textContent += ' (Code: ' + code + ')';
        emailCodeInput && emailCodeInput.focus();
      }
    });
  }

  // Verify code handler
  if (verifyCodeBtn) {
    verifyCodeBtn.addEventListener('click', function(){
      const entered = (emailCodeInput && emailCodeInput.value || '').trim();
      const expected = (sessionStorage.getItem('emailVerificationCode') || '').toString();
      if (!entered) { emailCodeInput.classList.add('auth-error'); emailCodeInput.focus(); setTimeout(()=> emailCodeInput.classList.remove('auth-error'),900); return; }
      if (entered === expected) {
        const nm = sessionStorage.getItem('emailPendingName') || '';
        const em = sessionStorage.getItem('emailPendingAddress') || '';
        unlockSite(nm, em);
      } else {
        authMessage.textContent = 'Verification code does not match.';
        emailCodeInput.classList.add('auth-error');
        setTimeout(()=> emailCodeInput.classList.remove('auth-error'),900);
      }
    });
  }

  // Enter key handling for inputs
  if (emailInput) emailInput.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') authSubmit.click(); });
  if (nameInput) nameInput.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') { ev.preventDefault(); emailInput && emailInput.focus(); } });
  if (emailCodeInput) emailCodeInput.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') verifyCodeBtn && verifyCodeBtn.click(); });
  if (ownerPassword) ownerPassword.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') authSubmit && authSubmit.click(); });

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
