const express = require("express");
const { chromium } = require("playwright");
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://node_server:NI59osE4nRLch3T2@cluster.zyik3jn.mongodb.net/?retryWrites=true&w=majority",
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

app.get("/get-file-links", async (req, res) => {
  try {
    // Query parameter
    const courseName = req.query.courseName;

    // Find the corresponding course ID in the courses collection
    const course = await Course.findOne({
      courseName: { $regex: new RegExp(courseName, "i") },
    }).exec();

    if (course) {
      // Use the course ID to retrieve related PDFs
      const pdfs = await PDF.find({ course: course._id }).exec();

      // Extract filename and link from the PDFs
      const formattedData = pdfs.map(
        (item) => `${item.filename} - ${item.link}`
      );

      // Return the formatted data to the browser
      res.send(formattedData.join("<br/><br/>"));
    } else {
      // If the course is not found, return a message indicating that
      res.status(404).json({ error: "Course not found" });
    }
  } catch (error) {
    console.error("Error while retrieving scraped data:", error);
    res.status(500).json({ error: "An error occurred while retrieving data" });
  }
});

app.get("/fill-db", async (req, res) => {
  try {
    // Query parameters
    const courseName = req.query.courseName;
    const mainWebsite = req.query.mainWebsite;

    // Create a new course
    const newCourse = new Course({
      courseName: courseName,
      mainWebsite: mainWebsite,
    });

    // Save the course to the database
    await newCourse.save();

    // Scrape the data from the main website
    const scrapedData = await scrapeData(mainWebsite);

    // Create a new PDF document for each scraped PDF
    for (const data of scrapedData) {
      const newPDF = new PDF({
        course: newCourse._id,
        filename: data.filename,
        link: data.link,
      });

      // Save the PDF to the database
      await newPDF.save();
    }

    // Return a success message to the browser
    res.send("Successfully filled database");
  } catch (error) {
    console.error("Error while filling database:", error);
    res.status(500).json({ error: "An error occurred while filling database" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
