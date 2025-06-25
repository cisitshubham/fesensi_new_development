import { reusableEmailCSS } from './emailStyles';

// User Onboarding Mail
export const welcomeMail = (name: string, email: string, date: string) => {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>${reusableEmailCSS}</style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="logo">
          <img src="${process.env.APP_URL}/images/fav-icon/logo.png" alt="FESENSI Logo" />
        </div>
        <div class="heading">Hi ${name},</div>
        <div class="content-box">
          <p>Welcome to <strong>FESENSI</strong> – Your trusted IT Help Desk solution!</p>
          <p>We're excited to have you on board. Your registration was successful and you can now access the platform to raise and manage your support tickets efficiently.</p>
        </div>
        <div class="info-box">
          <h3>Login Details:</h3>
          <ul class="info-list">
            <li class="info-item">📧 Email: ${email}</li>
            <li class="info-item">📅 Registered on: ${date}</li>
          </ul>
        </div>
        <div class="warning-box">
          <p class="warning-text">Your account is pending admin activation. You'll receive a confirmation as soon as it's activated.</p>
        </div>
        <p class="text-block">If you didn't register for this account, please ignore this email or contact us immediately at <a href="mailto:support@fesensi.com">support@fesensi.com</a>.</p>
        <p class="text-block">Regards,<br/>Team FESENSI</p>
        <div class="footer">
          <a href="${process.env.APP_URL}">Website</a>
          <a href="https://fesensi.com/help">Help Center</a>
          <a href="https://fesensi.com/contact">Contact Us</a>
        </div>
      </div>
    </div>
  </body>
  </html>`;
};

// password reset mail
export const passwordResetMail = (userName: string, otp: number) => {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>${reusableEmailCSS}</style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="logo">
          <img src="${process.env.APP_URL}/images/fav-icon/logo.png" alt="FESENSI Logo" />
        </div>
        <div class="heading">Hi ${userName},</div>
		

        <div class="content-box">
          <p>We received a request to reset the password for your <strong>FESENSI</strong> account.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <p style="font-size: 20px; font-weight: bold; color: #2C3E50; text-align: center; margin: 20px 0;">
            ${otp}
          </p>
          <p>This OTP is valid for the next 10 minutes.</p>
        </div>

        <div class="warning-box">
          <p class="warning-text">If you did not initiate this request, please secure your account or contact support immediately.</p>
        </div>

        <p class="text-block">Stay secure,<br/>Team FESENSI</p>

        <div class="footer">
          <a href="${process.env.APP_URL}">Website</a>
          <a href="https://fesensi.com/help">Help Center</a>
          <a href="https://fesensi.com/contact">Contact Us</a>
        </div>
      </div>
    </div>
  </body>
  </html>`;
};

// account activated mail

export const accountActivatedMail = (userName: string) => {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>${reusableEmailCSS}</style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="logo">
          <img src="${process.env.APP_URL}/images/fav-icon/logo.png" alt="FESENSI Logo" />
        </div>
        <div class="heading">Hi ${userName},</div>

        <div class="content-box">
          <p>Great news! Your <strong>FESENSI</strong> account has been successfully activated by the administrator.</p>
          <p>You can now log in and start using the IT Help Desk system to raise support tickets and track your IT-related concerns.</p>
        </div>

        <div class="info-box">
          <h3>Next Steps:</h3>
          <ul class="info-list">
            <li class="info-item">👉 <a href="https://fesensi.hostree.in/auth/login" target="_blank">Click here to log in</a></li>
          </ul>
        </div>

        <p class="text-block">If you have any questions, feel free to reach out to our support team.</p>
        <p class="text-block">Happy to have you onboard,<br/>Team FESENSI</p>

        <div class="footer">
          <a href="${process.env.APP_URL}">Website</a>
          <a href="https://fesensi.com/help">Help Center</a>
          <a href="https://fesensi.com/contact">Contact Us</a>
        </div>
      </div>
    </div>
  </body>
  </html>`;
};


// confirmation mail contact support query resolved		

export const queryResolvedMail = (userName: string, details: string) => {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	<style>${reusableEmailCSS}</style>
	</head>
	<body>
	<div class="email-wrapper">
	<div class="email-container">
	<div class="logo">
	<img src="${process.env.APP_URL}/images/fav-icon/logo.png" alt="FESENSI Logo" />
	</div>
	<div class="heading">Hi ${userName},</div>
	<div class="content-box">
	<p>We are pleased to inform you that your query has been successfully resolved.</p>
	<p>Query Title: <strong>${details}</strong></p>
	<p>Thank you for your patience and understanding.</p>
	</div>
	<div class="info-box">
	<h3>Next Steps:</h3>
	<ul class="info-list">
	<li class="info-item">👉 <a href="https://fesensi.hostree.in/auth/login" target="_blank">Click here to log in</a></li
		</ul>
	</div>
	<p class="text-block">If you have any questions, feel free to reach out to our support team.</p>
	<p class="text-block">Happy to have you onboard,<br/>Team FESENSI</p>
	<div class="footer">
	<a href="${process.env.APP_URL}">Website</a>
	<a href="https://fesensi.com/help">Help Center</a>
	<a href="https://fesensi.com/contact">Contact Us</a>
	</div>
	</div>
	</div>
	</body>
	</html>`;
};

export const emailVerificationOTPMail = (userName: string, otp: string) => {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
	  <meta charset="UTF-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	  <style>${reusableEmailCSS}</style>
	</head>
	<body>
	  <div class="email-wrapper">
		<div class="email-container">
		  <div class="logo">
			<img src="${process.env.APP_URL}/images/fav-icon/logo.png" alt="FESENSI Logo" />
		  </div>
		  <div class="heading">Hi ${userName},</div>
  
		  <div class="content-box">
			<p>Welcome to <strong>FESENSI</strong>! To complete your registration, please verify your email address.</p>
			<p>Your One-Time Password (OTP) for email verification is:</p>
			<div style="font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; color: #2c3e50;">${otp}</div>
			<p>Please enter this OTP in the app or website to verify your email address.</p>
		  </div>
  
		  <div class="info-box">
			<h3>Need Help?</h3>
			<ul class="info-list">
			  <li class="info-item">👉 <a href="https://fesensi.com/help" target="_blank">Visit our Help Center</a></li>
			</ul>
		  </div>
  
		  <p class="text-block">This OTP is valid for a limited time. If you did not request this, please ignore this email.</p>
		  <p class="text-block">Thanks,<br/>Team FESENSI</p>
  
		  <div class="footer">
			<a href="${process.env.APP_URL}">Website</a>
			<a href="https://fesensi.com/help">Help Center</a>
			<a href="https://fesensi.com/contact">Contact Us</a>
		  </div>
		</div>
	  </div>
	</body>
	</html>`;
};
  