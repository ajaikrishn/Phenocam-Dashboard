import os
import json
from config import *
import geopandas as gpd
from PIL import Image, ImageOps, ImageDraw,ImageFile
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from mpl_toolkits.axes_grid1 import ImageGrid
from datetime import datetime, timedelta
import numpy.ma as ma
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates


def create_image_metadata_df(file_paths):
    """
    Create a dataframe template from image file paths.
    
    Columns:
    file_path
    image_type (rgb / ir / NDVI / other)
    date_time
    date
    time
    """

    df = pd.DataFrame(file_paths, columns=['file_path'])

    # Identify image type
    df['image_type'] = df['file_path'].apply(
        lambda x: 'rgb' if x.lower().endswith('_color.jpg')
        else ('ir' if x.lower().endswith('_ir.jpg')
        else ('ndvi' if x.lower().endswith('_ndvi.jpg')
        else 'other'))
    )

    # Extract datetime string
    df['date_time'] = df['file_path'].apply(
        lambda x: os.path.basename(x).split('APU_pos_01_')[-1].rsplit('_', 1)[0]
    )

    # Extract date
    df['date'] = df['date_time'].apply(
        lambda x: "_".join(x.split('_')[0:3])
    )

    # Extract time
    df['time'] = df['date_time'].apply(
        lambda x: "".join(x.split('_')[3:5])
    )

    return df

def ndvi_calculation(ir_path, rgb_path):
    # Load images
    ir_img = np.array(Image.open(ir_path)).astype(float)
    rgb = np.array(Image.open(rgb_path)).astype(float)

    # Extract IR band
    if ir_img.ndim == 3:
        ir = ir_img[:, :, 0]   # take one channel
    else:
        ir = ir_img

    # Extract Red band
    red = rgb[:, :, 0]

    # Avoid division by zero
    denominator = ir + red
    denominator[denominator == 0] = np.nan

    # NDVI calculation
    ndvi = (ir - red) / denominator

    # Return mean NDVI
    return np.nanmean(ndvi)

def save_ndvi_plot(df, plot_dir, plot_name="ndvi_plot"):

    # Ensure date column is datetime
    # df["date"] = pd.to_datetime(df["date"])
    # df = df.sort_values("date")

    # Create plot
    fig, ax = plt.subplots(figsize=(12,4))

    df.plot(x='date', y='ndvi', marker='o', ax=ax, legend=False)

    ax.set_ylabel('NDVI')
    ax.set_xlabel('Date')
    ax.set_title('NDVI Time Series')
    ax.grid(True)

    fig.autofmt_xdate()
    plt.xticks(rotation=90, ha='right')

    plt.tight_layout()

    # Save PNG
    plot_path = os.path.join(plot_dir, plot_name + ".png")
    plt.savefig(plot_path, dpi=300, bbox_inches="tight")
    plt.close()

    # Prepare JSON data
    plot_data = {
        "title": "NDVI Time Series",
        "xlabel": "Date",
        "ylabel": "NDVI",
        "x": df["date"].astype(str).tolist(),
        "y": df["ndvi"].tolist(),
        "marker": "o",
        "grid": True
    }

    # Save JSON
    json_path = os.path.join(plot_dir, plot_name + ".json")

    with open(json_path, "w") as f:
        json.dump(plot_data, f, indent=4)

    print(f"Saved NDVI plot to: {plot_path}")
    print(f"Saved NDVI plot data to: {json_path}")

