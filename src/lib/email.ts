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

// Assignment invitation email template'i
const getAssignmentInvitationTemplate = (
  assignmentData: {
    targetType: string
    targetName: string
    projectName?: string
    role: string
    assignerName: string
    message?: string
    acceptUrl: string
  }
) => {
  const { targetType, targetName, projectName, role, assignerName, message, acceptUrl } = assignmentData
  
  const typeLabel = targetType === 'PROJECT' ? 'Proje' : targetType === 'SECTION' ? 'Bölüm' : 'Görev'
  const roleLabel = role === 'COLLABORATOR' ? 'İş Ortağı' : 
                   role === 'VIEWER' ? 'İzleyici' : 
                   role === 'OWNER' ? 'Sorumlu' : 'Üye'

  return {
    subject: `Planner - ${typeLabel} Ataması Davetiyesi`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Atama Davetiyesi</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .assignment-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; }
            .assignment-details { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #4a5568; }
            .detail-value { color: #2d3748; }
            .role-badge { background-color: #4f46e5; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .action-buttons { text-align: center; margin: 30px 0; }
            .accept-button { background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 0 10px; }
            .message-box { background-color: #fef7e0; border-left: 4px solid #f6ad55; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .message-box p { color: #744210; margin: 0; font-style: italic; }
            .footer { background-color: #f7fafc; padding: 20px 30px; text-align: center; color: #718096; font-size: 14px; }
            .info { background-color: #e0f7fa; border-left: 4px solid #26c6da; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .info p { color: #00695c; margin: 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Atama Davetiyesi</h1>
            </div>
            <div class="content">
              <h2>Merhaba! 👋</h2>
              <p><strong>${assignerName}</strong> sizi Planner'da bir ${typeLabel.toLowerCase()}'ye davet etti!</p>
              
              <div class="assignment-card">
                <h3 style="margin-top: 0; color: #2d3748;">📋 Atama Detayları</h3>
                <div class="assignment-details">
                  <div class="detail-row">
                    <span class="detail-label">${typeLabel}:</span>
                    <span class="detail-value"><strong>${targetName}</strong></span>
                  </div>
                  ${projectName && targetType !== 'PROJECT' ? `
                  <div class="detail-row">
                    <span class="detail-label">Proje:</span>
                    <span class="detail-value">${projectName}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <span class="detail-label">Rol:</span>
                    <span class="detail-value"><span class="role-badge">${roleLabel}</span></span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Davet Eden:</span>
                    <span class="detail-value">${assignerName}</span>
                  </div>
                </div>
              </div>

              ${message ? `
              <div class="message-box">
                <p><strong>Kişisel Mesaj:</strong> "${message}"</p>
              </div>
              ` : ''}

              <div class="info">
                <p><strong>Planner Nedir?</strong> Planner, projelerinizi, görevlerinizi ve ekip çalışmanızı organize etmenizi sağlayan güçlü bir proje yönetim aracıdır.</p>
              </div>
              
              <div class="action-buttons">
                <a href="${acceptUrl}" class="accept-button">✅ Davetiyeyi Kabul Et & Hesap Oluştur</a>
              </div>
              
              <p><small><strong>Not:</strong> Bu davetiye 30 gün boyunca geçerlidir. Davetiyeyi kabul etmek için yukarıdaki butona tıklayarak Planner hesabı oluşturmanız gerekecek.</small></p>
              
              <p>Herhangi bir sorunuz varsa, bizimle iletişime geçmekten çekinmeyin.</p>
              
              <p>Hoş geldiniz! 🚀<br>
              <strong>Planner Ekibi</strong></p>
            </div>
            <div class="footer">
              <p>Bu email otomatik olarak gönderilmiştir.</p>
              <p>© 2024 Planner. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

// Assignment davetiyesi email gönderme fonksiyonu
export const sendAssignmentInvitationEmail = async (
  email: string,
  assignmentData: {
    targetType: 'PROJECT' | 'SECTION' | 'TASK'
    targetId: string
    targetName: string
    projectName?: string
    role: string
    assignerName: string
    assignmentId: string
    message?: string
  }
): Promise<boolean> => {
  try {
    // Accept URL'ini oluştur - frontend'de assignment kabul sayfasına yönlendirecek
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/assignments/accept/${assignmentData.assignmentId}`
    
    const template = getAssignmentInvitationTemplate({
      ...assignmentData,
      acceptUrl
    })
    
    await transporter.sendMail({
      from: {
        name: 'Planner',
        address: process.env.GMAIL_USER!
      },
      to: email,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Assignment invitation email sent to ${email} for ${assignmentData.targetType} assignment`)
    return true
  } catch (error) {
    console.error('Assignment invitation email sending error:', error)
    return false
  }
}

// Assignment kabul edilen bildirim email'i
export const sendAssignmentAcceptedEmail = async (
  assignerEmail: string,
  assignmentData: {
    targetType: string
    targetName: string
    accepterName: string
    role: string
  }
): Promise<boolean> => {
  try {
    const { targetType, targetName, accepterName, role } = assignmentData
    const typeLabel = targetType === 'PROJECT' ? 'Proje' : targetType === 'SECTION' ? 'Bölüm' : 'Görev'
    const roleLabel = role === 'COLLABORATOR' ? 'İş Ortağı' : 
                     role === 'VIEWER' ? 'İzleyici' : 
                     role === 'OWNER' ? 'Sorumlu' : 'Üye'

    await transporter.sendMail({
      from: {
        name: 'Planner',
        address: process.env.GMAIL_USER!
      },
      to: assignerEmail,
      subject: `Planner - ${typeLabel} Ataması Kabul Edildi`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Atama Kabul Edildi</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; }
              .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
              .content { padding: 40px 30px; }
              .success-card { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
              .footer { background-color: #f7fafc; padding: 20px 30px; text-align: center; color: #718096; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Atama Kabul Edildi</h1>
              </div>
              <div class="content">
                <div class="success-card">
                  <h2 style="color: #059669; margin-top: 0;">🎉 Harika Haber!</h2>
                  <p><strong>${accepterName}</strong> davetinizi kabul etti ve <strong>${targetName}</strong> ${typeLabel.toLowerCase()}'sine <strong>${roleLabel}</strong> rolüyle katıldı.</p>
                </div>
                
                <p>Artık ${accepterName} ile birlikte çalışmaya başlayabilirsiniz!</p>
                
                <p>İyi çalışmalar! 🚀<br>
                <strong>Planner Ekibi</strong></p>
              </div>
              <div class="footer">
                <p>© 2024 Planner. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
    
    console.log(`Assignment accepted notification sent to ${assignerEmail}`)
    return true
  } catch (error) {
    console.error('Assignment accepted email sending error:', error)
    return false
  }
}