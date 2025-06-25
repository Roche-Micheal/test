const otpVerificationEmail = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .email-container {
                width: 100%;
                background-color: #ffffff;
                margin: 0 auto;
                padding: 20px;
                max-width: 600px;
                border-radius: 10px;
            }
            .email-header {
                background-color: rgb(2, 74, 151);
                padding: 20px;
                color: white;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .email-body {
                padding: 20px;
            }
            .email-body p {
                font-size: 16px;
                line-height: 1.5;
                color: #333;
            }
            .otp-code {
                display: block;
                background-color: #e9ecef;
                color: #333;
                font-size: 24px;
                font-weight: bold;
                padding: 15px;
                text-align: center;
                margin: 20px 0;
                border-radius: 5px;
                letter-spacing: 2px;
            }
            .footer {
                text-align: center;
                padding: 15px;
                font-size: 14px;
                color: #888;
            }
        </style>
    </head>
    <body> 
        <div class="email-container">
            <div class="email-header">
                <h1>OTP Verification</h1>
            </div>
            <div class="email-body">
                <p>Hello {name},</p>
                <p>Use the one-time password (OTP) below to verify your identity. This code is valid for 2 minutes only:</p>
                <span class="otp-code">{otpCode}</span>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>Thank you,</p>
            </div>
            <div class="footer">
                <p>Need help? <a href="{supportLink}">Contact our support team</a>.</p>
            </div>
        </div>
    </body>
    </html>
`;


module.exports = otpVerificationEmail;