const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/NACHO", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Define Mongoose schema
const TokenSchema = new mongoose.Schema({
  address: { type: String, unique: true },
  balance: String,
});

const Token = mongoose.model("Token", TokenSchema);

let currentOprange = 0; // Initialize currentOprange
let oprange = 0; // Initialize oprange

// Function to initialize currentOprange using opscore
const initializeCurrentOprange = async () => {
  try {
    const url = "https://api.kasplex.org/v1/krc20/token/NACHO";
    const responses = await axios.get(url);
    const opscore = responses.data.result[0].opScoreAdd;
    currentOprange = Math.floor(parseInt(opscore) / 100000);
    console.log(`Initialized currentOprange: ${currentOprange}`);
  } catch (error) {
    console.error("Error initializing currentOprange:", error);
  }
};

// Function to fetch the latest daaScore and update oprange
const updateOprange = async () => {
  try {
    const infoResponse = await axios.get("https://api.kasplex.org/v1/info");
    const daaScore = parseInt(infoResponse.data.result.daaScore);
    oprange = Math.floor(daaScore / 10);
    console.log(`Updated oprange: ${oprange}`);
  } catch (error) {
    console.error("Error fetching daaScore:", error);
  }
};

// Function to process data for the currentOprange
const processCurrentOprange = async () => {
  if (currentOprange > oprange) {
    console.log("No new oprange to process.");
    return;
  }

  try {
    console.log(`Processing data for oprange: ${currentOprange}`);
    const apiUrl = `https://api.kasplex.org/v1/archive/oplist/${currentOprange}`;
    const response = await axios.get(apiUrl);

    const addressData = response.data.result
      .filter((item) => item.addressaffc && item.addressaffc.includes("NACHO"))
      .flatMap((item) => {
        // Split on commas to handle multiple entries
        return item.addressaffc.split(",").map((entry) => {
          const [address, balance] = entry.split(/_NACHO=|_/);
          return { address, balance: (parseInt(balance) / 100000000).toString() };
        });
      });

    for (const data of addressData) {
      if (data.balance === "0") {
        // Remove entry if balance is 0
        await Token.deleteOne({ address: data.address });
        console.log(`Removed entry with address: ${data.address}`);
      } else {
        await Token.findOneAndUpdate(
          { address: data.address }, // Find by address
          { balance: data.balance }, // Update the balance
          { upsert: true, new: true } // Create if not exists, return updated document
        );
        console.log(`Updated : ${data.address} with balance: ${data.balance}`);
      }
    }

    currentOprange++; // Increment currentOprange after processing
  } catch (error) {
    console.error("Error processing data for oprange:", error);
  }
};

// Initialize currentOprange on startup
initializeCurrentOprange();

// Periodically fetch and update oprange, and process currentOprange
setInterval(async () => {
  await updateOprange();

  while (currentOprange <= oprange) {
    await processCurrentOprange();
  }
}, 30000); // Every 30 seconds

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
