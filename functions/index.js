// functions/index.js (dans votre dossier Firebase Functions)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer'); // Nécessite 'nodemailer' package
const cors = require('cors')({ origin: true }); // Pour gérer les requêtes cross-origin

admin.initializeApp();

// Configurer le transporteur d'e-mails (utilisez vos propres informations SMTP)
// C'est un exemple avec Gmail, mais il est recommandé d'utiliser un service dédié comme SendGrid ou Mailgun pour la production.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user, // Configuré via `firebase functions:config:set email.user="your_email@gmail.com"`
    pass: functions.config().email.pass, // Configuré via `firebase functions:config:set email.pass="your_app_password"`
  },
});

exports.sendEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { emails } = req.body; // Attendez un tableau d'e-mails à envoyer

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).send('Bad Request: Missing or invalid "emails" array.');
    }

    try {
      const sendPromises = emails.map(async (emailData) => {
        const { to, subject, body, attachment } = emailData;

        if (!to || !subject || !body) {
          throw new Error('Missing email fields: to, subject, or body.');
        }

        const mailOptions = {
          from: functions.config().email.user,
          to,
          subject,
          html: body.replace(/\n/g, '<br>'), // Convertir les retours à la ligne pour HTML
        };

        if (attachment && attachment.content && attachment.filename && attachment.contentType) {
          // Le contenu Base64 est généralement au format "data:application/pdf;base64,JVBERi..."
          // Nous devons extraire la partie Base64 réelle.
          const base64Data = attachment.content.split(',')[1];
          mailOptions.attachments = [{
            filename: attachment.filename,
            content: base64Data,
            contentType: attachment.contentType,
            encoding: 'base64', // Spécifier que le contenu est en base64
          }];
        }

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
      });

      await Promise.all(sendPromises);

      return res.status(200).json({ message: 'Emails sent successfully!' });

    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
  });
});