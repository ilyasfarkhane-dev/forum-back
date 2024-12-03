const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(
  cors({
    origin: 'forum-2024.vercel.app', // Allowing the deployed frontend
  })
);
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(
    'mongodb+srv://ilyasfarkhane:ilyas123@cluster0.omcy8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define User schema and model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  faculty: String,
  externalInstitution: String,
  educationLevel: String,
  customEducationLevel: String,
  isGraduate: String,
  
  objectives: String,
  remarks: String,
 
});

const User = mongoose.model('User', userSchema);

// Route to add user to the database
app.post('/submit', async (req, res) => {
  try {
    const userData = req.body;

    // Save user data to MongoDB
    const newUser = new User(userData);
    await newUser.save();

    res.status(200).json({ message: 'User data saved successfully', user: newUser });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).send('Failed to submit user data');
  }
});

// Route to update the validation field
app.post('/validate', async (req, res) => {
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
