from flask import Flask, render_template, send_file, request, url_for
import requests
from io import BytesIO
from zipfile import ZipFile
import json

import pdf_scraper


app = Flask(__name__)

with open('static/data.json', 'r') as f:
    data = json.load(f)

@app.route('/', methods=["POST", "GET"])
def home():
    if request.method == "POST":
        pdf_list = pdf_scraper.get_list(data[request.form['courses']])
    else:
        #change to an arbitrary
        pdf_list = pdf_scraper.get_list(list(data.values())[0])

    return render_template("index.html", pdf_list=pdf_list)


@app.route('/download', methods=['GET'])
def download():
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
