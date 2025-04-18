const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// CORS configuration
// Example using Express.js
app.use(cors({
  origin: [
      "https://myportfolio-oiqtkpr6g-v-r-krishnamacharyulus-projects.vercel.app",
      "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

// Handle preflight (OPTIONS) request explicitly
app.options('/contact', cors());

// Configure Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; // Brevo API key from your .env

// Contact form endpoint
app.post('/contact', async (req, res) => {
  try {
    console.log('Received contact form submission from:', req.headers.origin);
    console.log('Request body:', req.body);
    
    // Extract contact form details from the request body
    const { name, email, subject, message } = req.body;
    
    // Validate input fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Please provide all required fields (name, email, message)' });
    }
    
    // Create a new email instance using Brevo API
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    // Configure the email content
    sendSmtpEmail.subject = `Portfolio Contact: ${subject || 'New message from your website'}`;
    sendSmtpEmail.htmlContent = `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;
    
    sendSmtpEmail.sender = { 
      name: "Portfolio Contact Form", 
      email: process.env.SENDER_EMAIL  // Your sender email address
    };
    
    sendSmtpEmail.to = [{ email: process.env.RECIPIENT_EMAIL }]; // Recipient email address
    sendSmtpEmail.replyTo = { email: email, name: name }; // Set the reply-to address
    
    // Send the email using Brevo API
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', data);
    
    // Respond back with success
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Email sending error details:', error);
    if (error.response) {
      console.error('API error response:', error.response.body || error.response);
    }
    // Respond back with error message
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
