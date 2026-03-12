import os

BASE_DIR = "/home/ml_user/script/Phenocam-Dashboard/"
phenocam_dir = '/home/ml_user/script/Phenocam-Dashboard/Phenocamdata_local'
output_ndvi_list_dir = '/home/ml_user/script/Phenocam-Dashboard/csv_lists'

IMAGE_FOLDER = os.path.join(BASE_DIR, "Phenocamdata_local")
PLOTS_DIR = os.path.join(BASE_DIR, "Plots")
CSV_LIST_DIR = os.path.join(BASE_DIR, "csv_lists")
NDVI_DATA_DIR = os.path.join(BASE_DIR, "ndvi")

DATE_JSON = os.path.join(CSV_LIST_DIR, "ndvi_file_list.json")
PATH_JSON = os.path.join(CSV_LIST_DIR, "ndvi_file_paths.json")

FRONTEND_DIR = os.path.join(BASE_DIR, "Frontend")

