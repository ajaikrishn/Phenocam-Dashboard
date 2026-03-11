
import os
import json
from config import *
import geopandas as gpd
from PIL import Image, ImageOps, ImageDraw
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from mpl_toolkits.axes_grid1 import ImageGrid
from datetime import datetime, timedelta
import numpy.ma as ma
from datetime import datetime
import pandas as pd

def save_ndvi_file_lists(ndvi_files, output_dir):

    rows_date = []
    rows_file_path = []

    for file in ndvi_files:
        base_path = os.path.basename(file)
        name_without_ext = os.path.splitext(base_path)[0]

        date_parts = name_without_ext.split('_')[3:6]
        date = "-".join(date_parts)

        rows_date.append({
            "date": date
        })

        rows_file_path.append({
            "file_path": file
        })

    df_date = pd.DataFrame(rows_date)
    df_file_path = pd.DataFrame(rows_file_path)

    df_date.sort_values('date', inplace=True)
    df_file_path.sort_values('file_path', inplace=True)

    date_json_path = os.path.join(output_dir, "ndvi_file_list.json")
    path_json_path = os.path.join(output_dir, "ndvi_file_paths.json")

    df_date.to_json(date_json_path, orient="records", indent=4)
    df_file_path.to_json(path_json_path, orient="records", indent=4)

    print(f"Saved date list to: {date_json_path}")
    print(f"Saved file paths to: {path_json_path}")