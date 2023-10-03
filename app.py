from flask import Flask, render_template
import pdf_scraper

app = Flask(__name__)

@app.route('/')
def hello():
    pdf_list = pdf_scraper.get_list("https://cadmo.ethz.ch/education/lectures/HS23/DA/index.html")
    print(pdf_list)
    return render_template("index.html", pdf_list=pdf_list)



if __name__ == '__main__':
    app.run(debug=True)