const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const SENDER_LABEL = 'Verification Board of VAMS';

const STATUS_CONTENT = {
  approved: {
    subject: 'Your VAMS registration has been approved',
    heading: 'Registration approved',
    body: (name) =>
      `Dear ${name},\n\nYour registration and submitted documents have been reviewed and approved. ` +
      `You now have full access to the veteran services available on the Uganda Veterans Affairs Management System (VAMS).`
  },
  rejected: {
    subject: 'Update on your VAMS registration',
    heading: 'Registration rejected',
    body: (name) =>
      `Dear ${name},\n\nAfter reviewing your registration and submitted documents, we are unable to approve your ` +
      `registration at this time. If you believe this is a mistake, please contact us for more details.`
  },
  info_requested: {
    subject: 'Additional information needed for your VAMS registration',
    heading: 'Additional information requested',
    body: (name, message) =>
      `Dear ${name},\n\nWe are reviewing your registration and require some additional information before we can proceed:\n\n"${message}"\n\n` +
      `Please log in to your VAMS account and provide the requested information as soon as possible.`
  }
};

/**
 * Sends a status-change notification email to a veteran.
 * @param {Object} params
 * @param {string} params.to - veteran's email address
 * @param {string} params.fullName - veteran's full name
 * @param {'approved'|'rejected'|'info_requested'} params.status
 * @param {string} [params.message] - required extra-info text when status is 'info_requested'
 */
async function sendVerificationStatusEmail({ to, fullName, status, message }) {
  const content = STATUS_CONTENT[status];
  if (!content) throw new Error(`No email template for status: ${status}`);

  const bodyText = status === 'info_requested' ? content.body(fullName, message) : content.body(fullName);
  const footer = `Message from the ${SENDER_LABEL}`;

  const mailOptions = {
    from: {
      email: process.env.SMTP_FROM,
      name: SENDER_LABEL
    },
    to,
    subject: content.subject,
    text: `${bodyText}\n\n— ${footer}`,
    html: `
      <div style="font-family: Arial, sans-serif; color:#2B2B2B; line-height:1.6; max-width:520px;">
        <h2 style="color:#3E5C3A; margin-bottom:12px;">${content.heading}</h2>
        <p style="white-space:pre-line;">${bodyText}</p>
        <hr style="border:none;border-top:1px solid #D9D7CF;margin:20px 0;" />
        <p style="color:#666666;font-size:0.85rem;">${footer} (Uganda Veterans Affairs Management System)</p>
      </div>
    `
  };

  await sgMail.send(mailOptions);
}

module.exports = { sendVerificationStatusEmail };





























