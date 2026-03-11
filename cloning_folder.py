import subprocess

# Your folder ID
FOLDER_ID = "10Io5h-mV0HnTwJSXO2M2QyA-YmT6RWMW"

def clone_to_current_directory():
    command = [
        "rclone",
        "copy",
        f"gdrive:{FOLDER_ID}",
        "/home/ajai-krishna/work/Phenocam_d3/Phenocamdata_local",   # current working directory
        "--progress"
    ]

    print("Running:", " ".join(command))
    subprocess.run(command, check=True)
    print("✅ Clone completed.")

if __name__ == "__main__":
    clone_to_current_directory()