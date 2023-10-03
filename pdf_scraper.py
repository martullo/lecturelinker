#PDF Scraper
from playwright.sync_api import sync_playwright


def get_list(url):
    with sync_playwright() as p:
        # later the browser shouldn't be opened and closed in this function - each request would start a new browser 
        browser = p.chromium.launch()
        page = browser.new_page()

        page.goto(url)
        # page.wait not needed since most javascript which loads data runs onload
        # page.wait_for_timeout(10)

        pdf_links = []

        for link in page.eval_on_selector_all('a', 'elements => elements.map(el => el.href)'):
            if link.endswith('.pdf'):
                pdf_links.append(link)
                print(link)

        browser.close()
        return pdf_links