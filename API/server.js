const express = require("express");
const { chromium } = require("playwright");
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://node_server:kXTFY4ZaSnoNXncn@cluster.zyik3jn.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// ------------------------------ New Code ------------------------------
// Create a schema for courses, pdfs, and users
const courseSchema = new mongoose.Schema({
  courseName: String,
  mainWebsite: String,
});

const pdfSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // Reference to the course
  filename: String,
  link: String,
});

const userSchema = new mongoose.Schema({
  username: String,
  attendedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
});

// Create a model from the schema
const Course = mongoose.model("Course", courseSchema);
const PDF = mongoose.model("PDF", pdfSchema);
const User = mongoose.model("User", userSchema);
// ----------------------------------------------------------------------

// ------------------------------ Old Code ------------------------------
// Create a schema for scraped data
const scrapedDataSchema = new mongoose.Schema({
  filename: String,
  link: String,
});

// Create a model from the schema
const ScrapedData = mongoose.model("ScrapedData", scrapedDataSchema);
// ----------------------------------------------------------------------

const app = express();
const port = 3000;

async function scrapeData(URL) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const targetUrl = URL;

  await page.goto(targetUrl);
  // Wait for the page to load completely
  await page.waitForLoadState("networkidle");

  // Return all links that end with ".pdf" and filename from <a> tags in a list
  const scrapedData = await page.evaluate(() => {
    const pdfLinks = Array.from(
      document.querySelectorAll("a[href$='.pdf']")
    ).map((link) => ({
      filename: link.href.substring(link.href.lastIndexOf("/") + 1),
      link: link.href,
    }));
    return pdfLinks;
  });

  await browser.close();

  return scrapedData;
}

// for links that look like this: http://localhost:3000/scrapedata?url=[URL]
app.get("/scrapedata", async (req, res) => {
  try {
    const scrapedData = await scrapeData(req.query.url);

    for (const data of scrapedData) {
      await ScrapedData.findOneAndUpdate(
        { filename: data.filename }, // The unique identifier for the document
        data, // The data you want to add/update
        { upsert: true } // Use 'upsert' to insert if not found, update if found
      );
    }
    res.json(scrapedData);
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).json({ error: "An error occurred during scraping" });
  }
});

app.get("/getscrapedata", async (req, res) => {
  try {
    const data = await ScrapedData.find().exec();

    //format data with line breaks
    const formattedData = data.map((item) => `${item.filename} - ${item.link}`);
    // Return formatted data to browser
    res.send(formattedData.join("<br/><br/>"));
  } catch (error) {
    console.error("Error while retrieving scraped data:", error);
    res.status(500).json({ error: "An error occurred while retrieving data" });
  }
});

// Endpoint to access files stored in database by course name
app.get("/getscrapedatabycourse", async (req, res) => {
  try {
    const data = await ScrapedData.find({
      filename: { $regex: req.query.course, $options: "i" },
    }).exec();

    //format data with line breaks
    const formattedData = data.map((item) => `${item.filename} - ${item.link}`);
    // Return formatted data to browser
    res.send(formattedData.join("<br/><br/>"));
  } catch (error) {
    console.error("Error while retrieving scraped data:", error);
    res.status(500).json({ error: "An error occurred while retrieving data" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
