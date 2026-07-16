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

const APPLICATION_STATUS_CONTENT = {
  approved: {
    subject: (service) => `Your ${service} application has been approved`,
    heading: 'Application approved',
    body: (name, service, amount, coverageValue) => {
      let extra = '';
      if (amount) extra = ` Your approved amount is UGX ${amount}.`;
      if (coverageValue) extra = ` Your approved coverage: ${coverageValue}.`;
      return `Dear ${name},\n\nYour ${service} application has been reviewed and approved.${extra}\n\n` +
        `Please log in to your VAMS account for full details.`;
    }
  },
  rejected: {
    subject: (service) => `Update on your ${service} application`,
    heading: 'Application rejected',
    body: (name, service) =>
      `Dear ${name},\n\nAfter reviewing your ${service} application, we are unable to approve it at this time. ` +
      `If you believe this is a mistake, please contact us for more details.`
  }
};

/**
 * Sends a status-change notification email for a service application.
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.fullName
 * @param {string} params.serviceType - 'pension' | 'healthcare' | 'education'
 * @param {'approved'|'rejected'} params.status
 * @param {number} [params.amount]
 * @param {string} [params.coverageValue]
 */
async function sendApplicationStatusEmail({ to, fullName, serviceType, status, amount, coverageValue }) {
  const content = APPLICATION_STATUS_CONTENT[status];
  if (!content) throw new Error(`No application email template for status: ${status}`);

  const bodyText = content.body(fullName, serviceType, amount, coverageValue);
  const footer = `Message from the ${SENDER_LABEL}`;

  await sgMail.send({
    from: { email: process.env.SMTP_FROM, name: SENDER_LABEL },
    to,
    subject: content.subject(serviceType),
    text: `${bodyText}\n\n— ${footer}`,
    html: `
      <div style="font-family: Arial, sans-serif; color:#2B2B2B; line-height:1.6; max-width:520px;">
        <h2 style="color:#3E5C3A; margin-bottom:12px;">${content.heading}</h2>
        <p style="white-space:pre-line;">${bodyText}</p>
        <hr style="border:none;border-top:1px solid #D9D7CF;margin:20px 0;" />
        <p style="color:#666666;font-size:0.85rem;">${footer} (Uganda Veterans Affairs Management System)</p>
      </div>
    `
  });
}

module.exports = { sendVerificationStatusEmail, sendApplicationStatusEmail };






























