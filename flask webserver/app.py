from flask import Flask, render_template, send_file, request, url_for, redirect
import requests
from io import BytesIO
from zipfile import ZipFile
import os

os.environ['NO_PROXY'] = '127.0.0.1'

app = Flask(__name__)


@app.route('/', methods=["POST", "GET"])
def _home():
    courses_list = requests.get("http://localhost:3000/get-courses").json()
    active_course = None
    pdf_list = []
    message_add_course = ""

    if request.method == "POST":
        # Handle different POST request sources
        match request.form["RequestType"]:
            case "course_selection":
                active_course = request.form["courses"]
                pdf_list = requests.get(
                    f"http://localhost:3000/get-links?courseName={active_course}").json()
            case "add_course":
                course_name = request.form["course_name"]
                course_url = request.form["course_url"]

                # Add course to database
                response = requests.get(
                    f"http://localhost:3000/add-course?courseName={course_name}&mainWebsite={course_url}")
                try:
                    message_add_course = response.json()["message"]
                    courses_list.append(course_name)
                    active_course = course_name
                    pdf_list = requests.get(
                        f"http://localhost:3000/get-links?courseName={active_course}").json()
                except:
                    message_add_course = "Error adding course. Check the URL or try again later."

    return render_template("index.html",
                           courses_list=courses_list,
                           active_course=active_course,
                           pdf_list=pdf_list,
                           message_add_course=message_add_course)


@app.route('/download', methods=["POST"])
def download():
    selected_files = request.form.getlist('selected_files')

    # THIS NEEDS TO BE HANDLED CLIENT SIDE LATER
    files = []
    for url in selected_files:
        files.append(
            (url.rsplit('/', 1)[-1], BytesIO(requests.get(url).content)))

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
