#PDF Scraper
from playwright.sync_api import sync_playwright
import time

def get_list(url):
    start = time.time()
    #browser shouldn't be opened and closed in this function
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        print(time.time()-start)


        start = time.time()
        page.goto(url)
        print(time.time()-start)

        pdf_links = []

        for link in page.eval_on_selector_all('a', 'elements => elements.map(el => el.href)'):
            if link.endswith('.pdf'):
                pdf_links.append(link)
                print(link)
        
        browser.close()

        return pdf_links
