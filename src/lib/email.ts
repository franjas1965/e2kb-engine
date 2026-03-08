import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendConversionCompleteEmail(
  to: string,
  filename: string,
  downloadUrl: string
): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not configured - SMTP_USER or SMTP_PASS missing');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"E2KB Engine" <${process.env.SMTP_USER}>`,
      to,
      subject: `✅ Tu documento "${filename}" está listo`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">¡Conversión completada!</h1>
          <p>Tu documento <strong>${filename}</strong> ha sido convertido exitosamente a Markdown.</p>
          <p style="margin: 30px 0;">
            <a href="${downloadUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Descargar archivo
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Este enlace estará disponible durante las próximas 24 horas.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            E2KB Engine - Conversión de documentos a Markdown
          </p>
        </div>
      `,
      text: `
Tu documento "${filename}" ha sido convertido exitosamente.

Descárgalo aquí: ${downloadUrl}

Este enlace estará disponible durante las próximas 24 horas.

E2KB Engine
      `,
    });
    console.log(`Email sent to ${to} for file ${filename}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendConversionErrorEmail(
  to: string,
  filename: string,
  errorMessage: string
): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"E2KB Engine" <${process.env.SMTP_USER}>`,
      to,
      subject: `❌ Error al convertir "${filename}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Error en la conversión</h1>
          <p>No se pudo convertir el documento <strong>${filename}</strong>.</p>
          <p style="background: #fef2f2; padding: 15px; border-radius: 6px; color: #991b1b;">
            ${errorMessage}
          </p>
          <p>Por favor, intenta de nuevo o contacta con soporte si el problema persiste.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            E2KB Engine - Conversión de documentos a Markdown
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send error email:', error);
    return false;
  }
}
