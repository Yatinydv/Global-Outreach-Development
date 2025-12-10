Email delivery options for the static contact form

1) EmailJS (client-side, no server)
- Sign up at https://www.emailjs.com and add an email service (Gmail via OAuth or SMTP).
- Create an email template and note the Service ID, Template ID, and Public Key (User ID).
- Edit `site/contact.html` and set these attributes on the `<form id="contact-form">` element:
  - `data-emailjs-service="YOUR_SERVICE_ID"`
  - `data-emailjs-template="YOUR_TEMPLATE_ID"`
  - `data-emailjs-user="YOUR_PUBLIC_KEY"`
- When users submit the form, the page will load EmailJS SDK and send the message to your configured email address.

2) Formspree (POST to a third-party endpoint)
- Sign up at https://formspree.io and create a new form to get an endpoint (e.g. `https://formspree.io/f/abcd`).
- Set `data-endpoint="https://formspree.io/f/abcd"` on the form element.
- The page will POST JSON to Formspree which forwards to your email and keeps a copy in their dashboard.

3) Self-hosted / Serverless function
- If you prefer full control and better deliverability, create a server endpoint (Node/Express or Netlify/Vercel function) that accepts the form and uses a transactional email provider (SendGrid, Mailgun, SES) to send.
- Don't include SMTP credentials in client code.

Which option would you like me to wire up for you? If EmailJS, paste your Service ID, Template ID and Public Key and I'll add them to `site/contact.html`.