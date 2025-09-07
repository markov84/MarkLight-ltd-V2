import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    // Configure transporter (use your SMTP credentials in .env)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'marklaitood@gmail.com',
      subject: `[Mark Light LTD] Ново съобщение от контактна форма: ${subject}`,
      text: `Име: ${name}\nИмейл: ${email}\nТелефон: ${phone || '-'}\n\nСъобщение:\n${message}`,
      html: `<p><b>Име:</b> ${name}</p><p><b>Имейл:</b> ${email}</p><p><b>Телефон:</b> ${phone || '-'}</p><p><b>Съобщение:</b><br>${message.replace(/\n/g, '<br>')}</p>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: 'Съобщението е изпратено успешно!' });
  } catch (error) {
    console.error('Contact form email error:', error);
    res.status(500).json({ msg: 'Грешка при изпращане на съобщението.' });
  }
});

export default router;
