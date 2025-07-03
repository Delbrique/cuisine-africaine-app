// functions/mailer/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({origin: true});

admin.initializeApp();

// Configurer le transporteur d'e-mails (utilisez vos propres informations SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

exports.sendEmail = functions.https.onRequest(async (req, res) => {
  // Utilisez cors pour gérer les requêtes cross-origin
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {emails} = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).send("Bad Request: Missing or invalid \"emails\" array.");
    }

    try {
      const sendPromises = emails.map(async (emailData) => {
        const {to, subject, body, attachment} = emailData;

        if (!to || !subject || !body) {
          throw new Error("Missing email fields: to, subject, or body.");
        }

        const mailOptions = {
          from: functions.config().email.user,
          to,
          subject,
          html: body.replace(/\n/g, "<br>"), // Convertir les retours à la ligne pour HTML
        };

        if (attachment && attachment.content && attachment.filename && attachment.contentType) {
          const base64Data = attachment.content.split(",")[1];
          mailOptions.attachments = [{
            filename: attachment.filename,
            content: base64Data,
            contentType: attachment.contentType,
            encoding: "base64",
          }];
        }

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`); // Utilisation de console.log au lieu de logger pour éviter l'erreur no-unused-vars
      });

      await Promise.all(sendPromises);

      return res.status(200).json({message: "Emails sent successfully!"});
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({message: "Failed to send emails", error: error.message});
    }
  });
});

// Ancien import de logger (commenté ou supprimé si non utilisé ailleurs)
// const {logger} = require("firebase-functions");
