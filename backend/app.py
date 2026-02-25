import os
from flask import Flask, jsonify, render_template, send_from_directory,send_file
from flask_cors import CORS

# Absolute path to folder containing images
image_folder = '/home/ajai-krishna/work/Phenocam_d3/Phenocamdata'

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



@app.route("/download-csv")
def download_csv():
    file_path = "/home/ajai-krishna/work/Phenocam_d3/static/images/APU_pos_01_2026_01_21_11_01_50.csv"
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
            f'/Phenocamdata/{f}' for f in files
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
        latest_path = f'/Phenocamdata/{latest_file}'
        return jsonify({'path': latest_path, 'filename': latest_file})
    except Exception as e:
        print(f" Error in /latest endpoint: {e}")
        return jsonify({})
@app.route("/Plots/ndvi_plot.json")
def ndvi():
    return send_file("../Plots/ndvi_plot.json",
                     mimetype="application/json")
@app.route("/Plots/ndvi_plot.png")  
def ndvi_png():
    return send_file("../Plots/ndvi_plot.png",
                     mimetype="image/png")

    
    


# Serve images from the Phenocamdata folder
@app.route('/Phenocamdata/<path:filename>')
def serve_image(filename):
    print(f"Serving image: {filename}")
    return send_from_directory(image_folder, filename)

if __name__ == '__main__':
    print(f" Image folder: {image_folder}")
    print(f"Starting Flask server on http://localhost:5002")
    print(f"Access dashboard at: http://localhost:5002")
    app.run(debug=True, port=5002, host='0.0.0.0')