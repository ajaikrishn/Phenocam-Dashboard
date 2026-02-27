import os
from flask import Flask, jsonify, render_template, send_from_directory,send_file,request
from flask_cors import CORS
import json

# Absolute path to folder containing images
image_folder = '/home/ajai-krishna/work/Phenocam_d3/Phenocamdata_local'

CSV_LIST_DIR = "/home/ajai-krishna/work/Phenocam_d3/csv_lists"
NDVI_DATA_DIR = "/home/ajai-krishna/work/Phenocam_d3/ndvi"
DATE_JSON = "/home/ajai-krishna/work/Phenocam_d3/csv_lists/ndvi_file_list.json"
PATH_JSON = "/home/ajai-krishna/work/Phenocam_d3/csv_lists/ndvi_file_paths.json"

app = Flask(
    __name__,
    template_folder='/home/ajai-krishna/work/Phenocam_d3/Frontend',
    static_folder='/home/ajai-krishna/work/Phenocam_d3/Frontend',
    static_url_path=''
)

# Enable CORS - THIS IS CRITICAL
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/csv_lists/ndvi_file_list.json')
def get_csv_list():
    import json
    file_path = '/home/ajai-krishna/work/Phenocam_d3/csv_lists/ndvi_file_list.json'
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        print(f"Error loading CSV list: {e}")
        return jsonify([])



@app.route("/download-csv")
def download_csv():
    selected_date = request.args.get("date")

    if not selected_date:
        return "No date selected", 400

    # Load both JSON files
    with open(DATE_JSON) as f:
        date_list = json.load(f)

    with open(PATH_JSON) as f:
        path_list = json.load(f)

    # Find index of selected date
    index = None
    for i, item in enumerate(date_list):
        if item["date"] == selected_date:
            index = i
            break

    if index is None:
        return "Date not found", 404

    # Get corresponding file path
    file_path = path_list[index]["file_path"]

    if not os.path.exists(file_path):
        return "File not found on server", 404

    return send_file(file_path, as_attachment=True)

@app.route('/gallery')
def gallery():
    try:
        print(f"Checking folder: {image_folder}")
        
        if not os.path.exists(image_folder):
            print(f"Folder does not exist: {image_folder}")
            return jsonify([])
        
        files = os.listdir(image_folder)
        print(f"Found {len(files)} files in folder")
        
        # Filter for image files
        images = [
            f'/Phenocamdata_local/{f}' for f in files
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif"))
        ]
        
        # Sort by filename (which includes date if format is consistent)
        images.sort(reverse=True)
        
        print(f" Returning {len(images)} images")
        for img in images[:5]:  # Print first 5 for debugging
            print(f"  - {img}")
        
        return jsonify(images)
    except Exception as e:
        print(f" Error in /gallery endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify([])


@app.route('/latest')
@app.route('/api/latest')
def latest():
    """Return JSON for the latest image (path and filename)."""
    try:
        if not os.path.exists(image_folder):
            return jsonify({})

        files = [f for f in os.listdir(image_folder) if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif"))]
        if not files:
            return jsonify({})

        # Assume filenames sort lexicographically by datetime when formatted consistently
        files.sort(reverse=True)
        latest_file = files[0]
        latest_path = f'/Phenocamdata_local/{latest_file}'
        return jsonify({'path': latest_path, 'filename': latest_file})
    except Exception as e:
        print(f" Error in /latest endpoint: {e}")
        return jsonify({})

@app.route("/Plots/ndvi_plot.json")
def ndvi():
    return send_file("./Plots/ndvi_plot.json")

@app.route("/Plots/ndvi_plot.png")  
def ndvi_png():
    return send_file("/Plots/ndvi_plot.png",
                     mimetype="image/png")
@app.route("/metrics/timeseries")
def timeseries():
    import json
    # Changed from .png to .json
    with open("/home/ajai-krishna/work/Phenocam_d3/Plots/ndvi_plot.json") as f:
        raw_data = json.load(f)
    
    # Transform the data to the expected format
    timeseries_data = []
    if 'x' in raw_data and 'y' in raw_data:
        for i in range(len(raw_data['x'])):
            # Convert date format from "2024_01_15" to "2024-01-15"
            date_str = raw_data['x'][i].replace('_', '-')
            timeseries_data.append({
                'date': date_str,
                'ndvi': raw_data['y'][i]
            })
    
    return jsonify(timeseries_data)
    
    


# Serve images from the Phenocamdata folder
@app.route('/Phenocamdata_local/<path:filename>')
def serve_image(filename):
    print(f"Serving image: {filename}")
    return send_from_directory(image_folder, filename)

if __name__ == '__main__':
    print(f" Image folder: {image_folder}")
    print(f"Starting Flask server on http://localhost:5002")
    print(f"Access dashboard at: http://localhost:5002")
    app.run(debug=True, port=5002, host='0.0.0.0')