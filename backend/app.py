import os
from flask import Flask, jsonify, render_template, send_from_directory
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

@app.route('/gallery')
def gallery():
    try:
        print(f"📂 Checking folder: {image_folder}")
        
        if not os.path.exists(image_folder):
            print(f"❌ Folder does not exist: {image_folder}")
            return jsonify([])
        
        files = os.listdir(image_folder)
        print(f"📁 Found {len(files)} files in folder")
        
        # Filter for image files
        images = [
            f'/Phenocamdata/{f}' for f in files
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif"))
        ]
        
        # Sort by filename (which includes date if format is consistent)
        images.sort(reverse=True)
        
        print(f"✅ Returning {len(images)} images")
        for img in images[:5]:  # Print first 5 for debugging
            print(f"  - {img}")
        
        return jsonify(images)
    except Exception as e:
        print(f"❌ Error in /gallery endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify([])

# Serve images from the Phenocamdata folder
@app.route('/Phenocamdata/<path:filename>')
def serve_image(filename):
    print(f"📷 Serving image: {filename}")
    return send_from_directory(image_folder, filename)

if __name__ == '__main__':
    print(f"📂 Image folder: {image_folder}")
    print(f"📷 Starting Flask server on http://localhost:5001")
    print(f"🌐 Access dashboard at: http://localhost:5001")
    app.run(debug=True, port=5001, host='0.0.0.0')