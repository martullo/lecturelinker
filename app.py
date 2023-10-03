from flask import Flask, render_template, send_file
import requests, io

import pdf_scraper

app = Flask(__name__)

@app.route('/')
def home():
    # lecture website is now hardcoded - should be changed to what the user selects in the UI
    pdf_list = pdf_scraper.get_list("https://cadmo.ethz.ch/education/lectures/HS23/DA/index.html")
    print(pdf_list)
    return render_template("index.html", pdf_list=pdf_list)

@app.route('/download')
def download():
    #function to download zip of multiple pdfs
    #not working - only returning one pdf and not in zip
    r = requests.get('https://cadmo.ethz.ch/education/lectures/HS23/DA/lectures/ad21-01.pdf')

    return send_file(
                     io.BytesIO(r.content),
                     download_name='FILE.pdf',
                     mimetype='application/pdf'
               )


if __name__ == '__main__':
    app.run(port=3000, debug=True)