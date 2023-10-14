const express = require("express");
const { chromium } = require("playwright");

const app = express();
const port = 3000;

async function scrapeData(URL) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const targetUrl = URL;

  await page.goto(targetUrl);

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
    const data = await scrapeData(req.query.url);
    res.json(data);

  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).json({ error: "An error occurred during scraping" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
