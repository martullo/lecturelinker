from flask import Flask, render_template, send_file, request, url_for, redirect
import requests
from io import BytesIO
from zipfile import ZipFile
import json
import os

os.environ['NO_PROXY'] = '127.0.0.1'

app = Flask(__name__)

@app.route('/', methods=["POST", "GET"])
def home():
    with open('static/data.json', 'r') as f:
        data = json.load(f)
    if request.method == "POST":
        if "courses" in request.form:
            pdf_list = requests.get(f"http://localhost:3000/scrapedata?url={data[request.form['courses']]}").json()
        elif "new_url" in request.form:
            if request.form["new_url"] not in data.values() and request.form["new_url"] != "":
                data[request.form["display_name"]] = request.form["new_url"]
                with open('static/data.json', 'w') as f:
                    write = json.dumps(data, indent=4)
                    f.write(write)
            else: 
                pdf_list = requests.get(f"http://localhost:3000/scrapedata?url={list(data.values())[0]}").json()
                return render_template("index.html", courses_list = data.keys(), pdf_list=pdf_list, show_alert=True)
            return redirect(url_for('home'))
    else:
        #change to an arbitrary
        pdf_list = requests.get(f"http://localhost:3000/scrapedata?url={list(data.values())[0]}").json()

    return render_template("index.html", courses_list = data.keys(), pdf_list=pdf_list, show_alert=False)


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
    app.run(port=4000, debug=True)
