# GTA V Automatic DLC Packager

This Node.js script automates the process of creating separate, properly structured vehicle and audio DLC packs for Grand Theft Auto V from a disorganized collection of mod files. It scans an input directory, identifies vehicle models and their associated files, automatically fixes common meta file issues, and generates clean, game-ready DLC archives (`dlc.rpf`).

## Key Features

-   **Automatic DLC Creation**: Scans a folder and creates a separate vehicle and audio DLC for each unique car model found.
-   **Intelligent File Sorting**: Correctly identifies and places model files (`.yft`, `.ytd`), meta files, audio files (`.awc`, `.rel`), and modkit parts into the correct DLC structure.
-   **Meta File Validation & Repair**: Automatically fixes common, game-breaking issues in meta files to ensure stability and proper functionality in-game.
-   **Dynamic XML Generation**: Creates the necessary `content.xml` and `setup2.xml` files for each DLC, ensuring the game recognizes and loads the content.
-   **Audio Handling**: Detects if a vehicle is missing its `audioNameHash` and, if audio files are present, automatically links them in the `vehicles.meta`. It then packages all audio-related files into a separate, dependent audio DLC.
-   **Modkit & Lights Synchronization**: Ensures that `carvariations.meta` correctly links to `carcols.meta` (or `dlctext.meta`). It will generate new, unique IDs for modkits and light settings if they don't exist, preventing conflicts.
-   **Clean Output**: Organizes the final `dlc.rpf` files into a clean `output` directory, ready to be added to your game's `dlcpacks` folder.

## Requirements

1.  **[Node.js](https://nodejs.org/)**: The script is written in JavaScript and requires the Node.js runtime.
2.  **`gtautil`**: This script relies on an external tool, `gtautil`, to build the final RPF archives. You must place the `gtautil` executable inside a `utils` folder.

## How to Use

1.  **Set Up Your Folders**:
    -   Create a main project folder.
    -   Inside, create an `input` folder. Place all your vehicle mod files here (e.g., `.yft`, `.ytd`, `.meta`, `.awc`). You can keep them in their original subfolders; the script will find them recursively.
    -   Create a `utils` folder and place the `gtautil` executable inside it.

    Your directory structure should look like this:

    ```
    /your-project-folder
    |-- create_dlc.js         (this script)
    |-- /input
    |   |-- /some-car-folder
    |       |-- carmodel.yft
    |       |-- carmodel.ytd
    |       |-- vehicles.meta
    |       |-- carmodel_audio.awc
    |       |-- ... (and other files)
    |-- /utils
    |   |-- gtautil             (or gtautil.exe on Windows)
    ```

2.  **Run the Script**:
    -   Open a terminal or command prompt in your main project folder.
    -   Execute the script by running the command:
        ```bash
        node create_dlc.js
        ```

3.  **Check the Output**:
    -   The script will create an `output` folder. Inside, you will find a separate folder for each vehicle and its corresponding audio pack, each containing a `dlc.rpf` file.
    -   For a car named `carmodel`, you will get:
        -   `output/carmodel/dlc.rpf` (Vehicle DLC)
        -   `output/carmodel_audio/dlc.rpf` (Audio DLC)

## Automatic Meta File Fixes

This script performs several automated corrections to prevent common crashes and bugs:

-   **`vehicles.meta`**:
    -   Checks for and adds missing `FirstPersonDriveBy...IKOffset` tags, which are a frequent cause of first-person camera crashes.
    -   If `audioNameHash` is empty but audio files for the model exist, it automatically fills in the hash to enable custom sounds.

-   **`handling.meta`**:
    -   Adds a default `<fDownforceModifier>` tag if it's missing.
    -   Standardizes the `<SubHandlingData>` section to prevent conflicts with other mods.

-   **`carvariations.meta`**:
    -   Standardizes `<liveries />` tags to a clean, self-closing format.
    -   Synchronizes `kitName` with the global `carcols.meta`, creating a new modkit entry if needed.
    -   Synchronizes `lightSettings` with the global `carcols.meta`, generating a new light profile based on a stable template if one doesn't exist.

-   **`carcols.meta` / `dlctext.meta`**:
    -   Acts as the central file for vehicle tuning info. The script reads the first one it finds and uses it to reconstruct a master list of all modkits and light settings, ensuring there are no ID conflicts.

## Disclaimer

This tool is designed for personal use in managing GTA V vehicle mods. It relies on the third-party `gtautil` executable, which is not included. Please ensure you have the correct and a functional version of `gtautil` for your operating system.
