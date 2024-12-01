const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const htmlPdf = require('html-pdf-node');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
    origin: 'https://forum-puce-seven.vercel.app',  // Allowing the deployed frontend
}));

app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://ilyasfarkhane:ilyas123@cluster0.omcy8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define User schema and model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    validation: { type: Boolean, default: false }, // New validation field
});

const User = mongoose.model('User', userSchema);

// Route to add user and generate PDF with QR code
app.post('/api/submit', async (req, res) => {
    try {
        const { name, email } = req.body;

        // Save user data to MongoDB
        const newUser = new User({ name, email });
        await newUser.save();

        // Generate QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(`Name: ${name}, Email: ${email}`);

        // Create styled HTML
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f0f4f8;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        padding: 20px;
                        background: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    .header {
                        background-color: #4caf50;
                        color: #fff;
                        padding: 15px 0;
                        border-radius: 10px 10px 0 0;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color:#4c4cff;
                    }
                    .content {
                        padding: 20px;
                    }
                    .content p {
                        font-size: 18px;
                        line-height: 1.6;
                        margin: 10px 0;
                    }
                    .content span {
                        font-weight: bold;
                        color: #4caf50;
                    }
                    .qr-code img {
                        margin-top: 20px;
                        width: 150px;
                        height: 150px;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 14px;
                        color: #777;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>User Submission Form</h1>
                    </div>
                    <div class="content">
                        <p><span>Name:</span> ${name}</p>
                        <p><span>Email:</span> ${email}</p>
                        <div class="qr-code">
                            <img src="${qrCodeDataUrl}" alt="QR Code" />
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Convert HTML to PDF
        const file = { content: htmlContent };
        const options = { format: 'A4' };
        const pdfBuffer = await htmlPdf.generatePdf(file, options);

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="user_submission.pdf"');
        res.end(pdfBuffer);
    } catch (error) {
        console.error('Error saving user or generating PDF:', error);
        res.status(500).send('Failed to submit user data');
    }
});

// Route to update the validation field
app.post('/api/validate', async (req, res) => {
    try {
        const { email } = req.body; // Assume email is sent to identify the user

        // Find user by email and update the validation field to true
        const user = await User.findOneAndUpdate({ email }, { validation: true }, { new: true });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).json({ message: 'User validated successfully', user });
    } catch (error) {
        console.error('Error validating user:', error);
        res.status(500).send('Failed to validate user');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
