const setUpPassword = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Set Up Request</title>
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
                    background-color:rgb(2, 74, 151);
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
                .reset-password-btn {
                    display: inline-block;
                    background-color: #28a745;
                    color: white;
                    font-size: 18px;
                    padding: 12px 25px;
                    border-radius: 5px;
                    text-decoration: none;
                    margin-top: 20px;
                }
                .reset-password-btn:hover {
                    background-color: #218838;
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
                    <h1>Password Set Up Request</h1>
                </div>
                <div class="email-body">
                    <p>Hello {name},</p>
                    <p>We received a request to set Up your password. You can set a new password by clicking the link below:</p>
                    <p><a href="{resetLink}" class="reset-password-btn">Set New Password</a></p>
                    <p>Thank you,</p>
                </div>
                <div class="footer">
                    <p>If you have any questions, feel free to <a href="{supportLink}">contact our admin team</a>.</p>
                </div>
            </div>
        </body>
        </html>
    `

module.exports = setUpPassword;