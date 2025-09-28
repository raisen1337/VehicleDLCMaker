
# GTA V Vehicle & Audio DLC Packager

A powerful Node.js script that automates the creation of Grand Theft Auto V add-on vehicle DLC packs. This tool intelligently scans a folder of unorganized vehicle mod files, correctly separates vehicle and audio components, automatically fixes common metadata issues, and packages them into two distinct, game-ready `.rpf` archives.

This script streamlines the development and packaging process, eliminating the tedious manual work of structuring folders, writing meta files, and creating archives, ensuring a clean and correct installation for any add-on vehicle.

## ✨ Key Features

-   **Automatic DLC Structuring**: Creates the entire folder and sub-folder structure required for both vehicle and audio DLCs from scratch.
-   **Intelligent File Sorting**: Scans your input directory and automatically identifies and sorts models (`.yft`, `.ytd`), metadata (`.meta`), audio files (`.awc`, `.dat`, `.rel`), and mod parts for each vehicle.
-   **Dynamic XML Generation**: Generates valid `content.xml` and `setup2.xml` for both the vehicle and audio packages, tailored specifically to each vehicle's file names and hashes.
-   **Automatic `audioNameHash` Correction**: Intelligently detects if a `vehicles.meta` file has an empty `<audioNameHash />` tag. If corresponding audio files are found for that vehicle, it automatically populates the tag (e.g., `<audioNameHash>carname</audioNameHash>`), fixing a common issue that causes add-on vehicles to have no sound.
-   **Batch Processing**: Processes every unique vehicle found in the input folder, creating separate, organized DLC packages for each one.
-   **Nested RPF Creation**: Uses the included `gtautil.exe` to correctly build nested `.rpf` archives (e.g., `vehicles.rpf`, `carname_mods.rpf`) inside the main `dlc.rpf`.
-   **Clean & Tidy**: Automatically creates and deletes temporary working directories, keeping your project folder clean.

## ⚙️ How It Works

The script performs a multi-pass process for each unique vehicle identified:

1.  **Initial Scan**: It first recursively scans the entire `input` directory to locate all `vehicles.meta` files. It parses these files to build a master list of all unique vehicle model names (e.g., "sentinel", "turismo").
2.  **Vehicle Package Creation**:
    *   For each vehicle, it creates a temporary folder structure for a vehicle DLC (e.g., `output/sentinel/sentinel_vehicle_dlc_temp`).
    *   It generates the necessary `content.xml` and `setup2.xml`.
    *   It finds all relevant files for that vehicle (models, textures, `handling.meta`, `carcols.meta`, etc.) based on file naming conventions and copies them into the correct temporary sub-folders (`/data`, `/x64/vehicles.rpf/`, `/x64/vehiclemods/sentinel_mods.rpf/`).
    *   It performs the `audioNameHash` check and modification during this step.
3.  **Audio Package Creation**:
    *   It then creates a separate temporary folder structure for an audio DLC (e.g., `output/sentinel_audio/sentinel_audio_dlc_temp`).
    *   It generates a unique `content.xml` and `setup2.xml` for the audio components.
    *   It locates all associated audio files (`.awc` archives, `_game.dat`, `_sounds.dat`, `.rel` config files) based on the vehicle name and its `audioNameHash`. These are copied into the correct temporary sub-folders (`/x64/audio/`, `/x64/audio/sfx/dlc_sentinel/`).
4.  **Archive Creation**: The script calls `gtautil.exe` to compile the contents of each temporary folder into a final, properly structured `dlc.rpf` file.
5.  **Cleanup**: The temporary folders are deleted, leaving only the final `.rpf` archives in the `output` directory.

## 📦 Prerequisites

-   [Node.js](https://nodejs.org/) (v14 or higher recommended)
-   Windows operating system (as the script relies on `gtautil.exe`)

## 📂 Required Directory Structure

Before running the script, your project folder must be organized as follows:
```
/your-project-folder/
├── input/
│   ├── some_car_folder/
│   │   ├── vehicles.meta
│   │   ├── handling.meta
│   │   ├── carcols.meta
│   │   ├── carvariations.meta
│   │   ├── mycar.yft
│   │   ├── mycar.ytd
│   │   └── mycar_hi.yft
│   ├── some_other_car/
│   │   └── ... (more car files)
│   └── ... (place all your unsorted mod files and folders here)
│
├── utils/
│   └── gtautil.exe  <-- (Included in this repository)
│
└── index.js  <-- (The script file)
```

**Note:** The `input` folder can contain any number of sub-folders. The script will scan through all of them to find the files it needs.

## 🚀 Installation & Usage

1.  **Clone the Repository**:
    ```sh
    git clone https://github.com/raisen1337/VehicleDLCMaker.git
    cd VehicleDLCMaker
    ```

2.  **Install Dependencies**: This script uses only built-in Node.js modules, so no `npm install` is required.

3.  **Populate the `input` Folder**: Place all your vehicle mod files and folders into the `input` directory.

4.  **Run the Script**: Open a terminal or command prompt in the project's root directory and execute the script:
    ```sh
    node create_gta_dlc_rpfs.js
    ```

5.  **Check the Output**: The script will log its progress in the console. Once finished, you will find your generated DLC packs in the `output` folder.

## ✅ Expected Output

After the script successfully completes, your `output` folder will be structured like this:
```
/your-project-folder/
├── output/
│ ├── mycar/
│ │ └── dlc.rpf <-- Vehicle DLC Pack
│ ├── mycar_audio/
│ │ └── dlc.rpf <-- Audio DLC Pack
│ │
│ ├── anothercar/
│ │ └── dlc.rpf
│ └── anothercar_audio/
│ └── dlc.rpf
│
└── ... (other files)
```
Each pair of `dlc.rpf` files is ready to be added to your `dlcpacks` folder in Grand Theft Auto V.

## 🛠️ Included Utility: gtautil

This project includes `gtautil.exe` in the `/utils` directory. This is a command-line tool developed as part of the OpenIV toolset, essential for creating and manipulating Rockstar's `.rpf` archive format. The script calls this executable to perform the final packaging step. Ensure it remains in the `utils` folder for the script to function correctly.
