import nodemailer from 'nodemailer'

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password kullanın
  },
})

// Email template'leri
const getVerificationEmailTemplate = (code: string, firstName?: string) => {
  return {
    subject: 'Planner - Email Doğrulama Kodu',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Doğrulama</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .otp-code { background-color: #f8fafc; border: 2px dashed #cbd5e0; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
            .otp-code h2 { color: #2d3748; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .footer { background-color: #f7fafc; padding: 20px 30px; text-align: center; color: #718096; font-size: 14px; }
            .warning { background-color: #fed7d7; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .warning p { color: #742a2a; margin: 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Planner</h1>
            </div>
            <div class="content">
              <h2>Merhaba${firstName ? ` ${firstName}` : ''}! 👋</h2>
              <p>Planner hesabınızı oluşturduğunuz için teşekkür ederiz. Email adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
              
              <div class="otp-code">
                <p style="margin: 0 0 10px 0; color: #4a5568; font-weight: 500;">Doğrulama Kodu</p>
                <h2>${code}</h2>
              </div>
              
              <p>Bu kod <strong>10 dakika</strong> boyunca geçerlidir. Kodu kimseyle paylaşmayın.</p>
              
              <div class="warning">
                <p><strong>Güvenlik Uyarısı:</strong> Bu email'i siz talep etmediyseniz, lütfen dikkate almayın ve kodu kimseyle paylaşmayın.</p>
              </div>
              
              <p>Herhangi bir sorunuz varsa, bizimle iletişime geçmekten çekinmeyin.</p>
              
              <p>İyi çalışmalar! 🚀<br>
              <strong>Planner Ekibi</strong></p>
            </div>
            <div class="footer">
              <p>Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
              <p>© 2024 Planner. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

// OTP kod üretici
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Email gönderme fonksiyonu
export const sendVerificationEmail = async (
  email: string, 
  code: string, 
  firstName?: string
): Promise<boolean> => {
  try {
    const template = getVerificationEmailTemplate(code, firstName)
    
    await transporter.sendMail({
      from: {
        name: 'Planner',
        address: process.env.GMAIL_USER!
      },
      to: email,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

// Email şifre sıfırlama template'i (gelecekte kullanabilirsiniz)
export const sendPasswordResetEmail = async (
  email: string, 
  code: string, 
  firstName?: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: {
        name: 'Planner',
        address: process.env.GMAIL_USER!
      },
      to: email,
      subject: 'Planner - Şifre Sıfırlama Kodu',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Şifre Sıfırlama</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
              .content { padding: 40px 30px; }
              .otp-code { background-color: #f8fafc; border: 2px dashed #cbd5e0; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
              .otp-code h2 { color: #2d3748; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace; }
              .footer { background-color: #f7fafc; padding: 20px 30px; text-align: center; color: #718096; font-size: 14px; }
              .warning { background-color: #fed7d7; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .warning p { color: #742a2a; margin: 0; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Şifre Sıfırlama</h1>
              </div>
              <div class="content">
                <h2>Merhaba${firstName ? ` ${firstName}` : ''}!</h2>
                <p>Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
                
                <div class="otp-code">
                  <p style="margin: 0 0 10px 0; color: #4a5568; font-weight: 500;">Sıfırlama Kodu</p>
                  <h2>${code}</h2>
                </div>
                
                <p>Bu kod <strong>10 dakika</strong> boyunca geçerlidir.</p>
                
                <div class="warning">
                  <p><strong>Güvenlik Uyarısı:</strong> Bu talebi siz yapmadıysanız, hesabınızın güvenliği için şifrenizi değiştirmenizi öneririz.</p>
                </div>
              </div>
              <div class="footer">
                <p>© 2024 Planner. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
    
    console.log(`Password reset email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}