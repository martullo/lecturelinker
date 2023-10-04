from flask import Flask, render_template, send_file, request
import requests
from io import BytesIO
import os
from zipfile import ZipFile
from random import randint

import pdf_scraper

app = Flask(__name__)

@app.route('/')
def home():
    # lecture website is now hardcoded - should be changed to what the user selects in the UI
    pdf_list = pdf_scraper.get_list(
        "https://cadmo.ethz.ch/education/lectures/HS23/DA/index.html")
    print(pdf_list)
    return render_template("index.html", pdf_list=pdf_list)


@app.route('/download', methods=['GET'])
def download():
    # function to download zip of multiple pdfs
    # not working - only returning one pdf and not in zip
    args = request.args
    files = []
    for url in args.values():
        files.append((url.rsplit('/', 1)[-1], BytesIO(requests.get(url).content)))
    
    stream = BytesIO()
    with ZipFile(stream, 'w') as zf:
        for file in files:
            zf.writestr(f'{file[0]}', file[1].getvalue())
    stream.seek(0)

    return send_file(
        stream,
        as_attachment=True,
        download_name='files.zip'
    )


if __name__ == '__main__':
    app.run(port=3000, debug=True)
