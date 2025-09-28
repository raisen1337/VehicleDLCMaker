const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Define input and output directories
const INPUT_DIR = 'input';
const OUTPUT_BASE_DIR = 'output';
const GTAUTIL_PATH = path.join(__dirname, 'utils', 'gtautil'); // Assuming 'gtautil' is in a 'utils' folder sibling to the script

// Define valid GTA 5 file extensions for each category
const MODEL_EXTENSIONS = new Set(['.yft', '.ytd', '.ydd', '.ybn']); // Common GTA 5 model/texture files
const AUDIO_SFX_EXTENSIONS = new Set(['.awc', '.oac']); // Audio archives that go in sfx
const AUDIO_CONFIG_EXTENSIONS = new Set(['.rel', '.dat54', '.dat151', '.dat', '.nametable']); // Audio config files (.dat, .rel, .nametable)
const META_EXTENSION = '.meta';

// XML Templates for the VEHICLE DLC
const CONTENT_XML_VEHICLE_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<CDataFileMgr__ContentsOfDataFileXml>
  <disabledFiles />
  <includedXmlFiles />
  <includedDataFiles />
  <dataFiles>
    <Item>
      <filename>DLC_NAME:/data/vehicles.meta</filename>
      <fileType>VEHICLE_METADATA_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
    <Item>
      <filename>DLC_NAME:/data/carcols.meta</filename>
      <fileType>CARCOLS_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
    <Item>
      <filename>DLC_NAME:/data/carvariations.meta</filename>
      <fileType>VEHICLE_VARIATION_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
    <Item>
      <filename>DLC_NAME:/data/dlctext.meta</filename>
      <fileType>TEXTFILE_METAFILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
    <Item>
      <filename>DLC_NAME:/data/handling.meta</filename>
      <fileType>HANDLING_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>	
    <Item>
      <filename>DLC_NAME:/%PLATFORM%/vehicles.rpf</filename>
      <fileType>RPF_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="true" />
    </Item>
    <Item>
      <filename>DLC_NAME:/%PLATFORM%/vehiclemods/MODS_RPF_NAME</filename>
      <fileType>RPF_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="true" />
    </Item>
  </dataFiles>
  <contentChangeSets>
	<Item>
	  <changeSetName>NAME_HASH_AUTOGEN</changeSetName>
	  <filesToDisable />
	  <filesToEnable>
        <Item>DLC_NAME:/data/handling.meta</Item>
        <Item>DLC_NAME:/data/vehicles.meta</Item>
        <Item>DLC_NAME:/data/carcols.meta</Item>
        <Item>DLC_NAME:/data/carvariations.meta</Item>
        <Item>DLC_NAME:/data/dlctext.meta</Item>	
        <Item>DLC_NAME:/%PLATFORM%/vehicles.rpf</Item>
        <Item>DLC_NAME:/%PLATFORM%/vehiclemods/MODS_RPF_NAME</Item>
	  </filesToEnable>
	  <txdToLoad />
	  <txdToUnload />
	  <residentResources />
	  <unregisterResources />
	</Item>
  </contentChangeSets>
  <patchFiles />
</CDataFileMgr__ContentsOfDataFileXml>`;

const SETUP2_XML_VEHICLE_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<SSetupData>
  <deviceName>DLC_NAME</deviceName>
  <datFile>content.xml</datFile>
  <timeStamp>00/00/0000 00:00:00</timeStamp>
  <nameHash>NAME_HASH</nameHash>
  <contentChangeSetGroups>
    <Item>
      <NameHash>GROUP_STARTUP</NameHash>
      <ContentChangeSets>
        <Item>NAME_HASH_AUTOGEN</Item>
      </ContentChangeSets>
    </Item>
  </contentChangeSetGroups>
  <type>EXTRACONTENT_COMPAT_PACK</type>
  <order value="9" />  
</SSetupData>`;

// XML Templates for the AUDIO DLC
const CONTENT_XML_AUDIO_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<CDataFileMgr__ContentsOfDataFileXml>
  <disabledFiles />
  <includedXmlFiles />
  <includedDataFiles />
  <dataFiles>
    <Item>
      <filename>DLC_AUDIO_NAME:/%PLATFORM%/audio/AUDIO_GAME_DAT_NAME</filename>
      <fileType>AUDIO_GAMEDATA</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
    <Item>
      <filename>DLC_AUDIO_NAME:/%PLATFORM%/audio/AUDIO_SOUNDS_DAT_NAME</filename>
      <fileType>AUDIO_SOUNDDATA</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
    <Item>
      <filename>DLC_AUDIO_NAME:/%PLATFORM%/audio/sfx/AUDIO_SFX_RPF_NAME</filename>
      <fileType>AUDIO_WAVEPACK</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
  </dataFiles>
  <contentChangeSets>
    <Item>
      <changeSetName>NAME_HASH_AUDIO_AUTOGEN</changeSetName>
      <filesToDisable />
      <filesToEnable>
        <Item>DLC_AUDIO_NAME:/%PLATFORM%/audio/AUDIO_GAME_DAT_NAME</Item>
        <Item>DLC_AUDIO_NAME:/%PLATFORM%/audio/AUDIO_SOUNDS_DAT_NAME</Item>
        <Item>DLC_AUDIO_NAME:/%PLATFORM%/audio/sfx/AUDIO_SFX_RPF_NAME</Item>  
      </filesToEnable>
      <txdToLoad />
      <txdToUnload />
      <residentResources />
      <unregisterResources />
    </Item>
  </contentChangeSets>
  <patchFiles />
</CDataFileMgr__ContentsOfDataFileXml>`;

const SETUP2_XML_AUDIO_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<SSetupData>
  <deviceName>DLC_AUDIO_NAME</deviceName>
  <datFile>content.xml</datFile>
  <timeStamp>00/00/0000 00:00:00</timeStamp>
  <nameHash>NAME_HASH_AUDIO</nameHash>
  <contentChangeSetGroups>
    <Item>
      <NameHash>GROUP_STARTUP</NameHash>
      <ContentChangeSets>
        <Item>NAME_HASH_AUDIO_AUTOGEN</Item>
      </ContentChangeSets>
    </Item>
  </contentChangeSetGroups>
  <type>EXTRACONTENT_COMPAT_PACK</type>
  <order value="343" />  
</SSetupData>`;


/**
 * Ensures a directory exists. If not, it creates it recursively.
 * @param {string} dirPath The path to the directory.
 * @returns {Promise<void>}
 */
async function ensureDirExists(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Copies a file to a target directory.
 * It handles potential file existence by skipping if already present.
 * @param {string} sourcePath The full path of the file to copy.
 * @param {string} destinationDir The directory where the file should be copied.
 * @returns {Promise<void>}
 */
async function copyFileToOutput(sourcePath, destinationDir) {
    const fileName = path.basename(sourcePath);
    const destinationPath = path.join(destinationDir, fileName);
    try {
        await fs.copyFile(sourcePath, destinationPath);
    } catch (error) {
        if (error.code !== 'EEXIST') { // Ignore 'file already exists' errors
            console.error(`Error copying file ${sourcePath} to ${destinationDir}:`, error);
        }
    }
}

/**
 * Recursively searches for files matching a given filename pattern (string or RegExp)
 * within a specified directory and its subdirectories.
 * @param {string} directory The starting directory for the search.
 * @param {string|RegExp|Array<string|RegExp>} filenamePattern A single pattern or an array of patterns to match against filenames.
 * @param {Set<string>} allowedExtensions A set of allowed file extensions (e.g., ['.yft', '.ytd']).
 * @returns {Promise<string[]>} A promise that resolves to an array of full file paths.
 */
async function findFiles(directory, filenamePattern, allowedExtensions = null) {
    let results = new Set(); // Use a Set to avoid duplicate paths if multiple patterns match
    const patterns = Array.isArray(filenamePattern) ? filenamePattern : [filenamePattern];

    async function traverse(currentDir) {
        try {
            const items = await fs.readdir(currentDir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(currentDir, item.name);
                if (item.isDirectory()) {
                    await traverse(fullPath);
                } else if (item.isFile()) {
                    const fileExtension = path.extname(item.name).toLowerCase();
                    // Apply extension filter if provided
                    if (allowedExtensions && !allowedExtensions.has(fileExtension)) {
                        continue;
                    }

                    for (const pattern of patterns) {
                        if (typeof pattern === 'string' && item.name.toLowerCase().includes(pattern.toLowerCase())) {
                            results.add(fullPath);
                            break; // Stop checking patterns for this file if one matches
                        } else if (pattern instanceof RegExp && pattern.test(item.name)) {
                            results.add(fullPath);
                            break; // Stop checking patterns for this file if one matches
                        }
                    }
                }
            }
        } catch (error) {
            // Silently ignore errors like permission denied or non-existent directories
        }
    }
    await traverse(directory);
    return Array.from(results);
}

/**
 * Reads a file's content and searches for matches using a given regular expression.
 * @param {string} filePath The path to the file.
 * @param {RegExp} regex The regular expression to use for searching.
 * @returns {Promise<string[]>} A promise that resolves to an array of captured groups (or full matches if no groups).
 */
async function searchFileContent(filePath, regex) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const matches = [...content.matchAll(regex)];
        return matches.map(match => match[1] || match[0]); // Return the captured group or the whole match
    } catch (error) {
        // Silently ignore errors like file not found or permission denied
        return [];
    }
}

/**
 * Generates content.xml for the vehicle DLC.
 * @param {string} carname The model name of the car.
 * @returns {string} The generated XML content.
 */
function generateVehicleContentXml(carname) {
    const dlcName = `dlc_${carname.toLowerCase()}`; // Internal unique name
    const modsRpfName = `${carname.toLowerCase()}_mods.rpf`;

    let content = CONTENT_XML_VEHICLE_TEMPLATE;
    content = content.replace(/DLC_NAME/g, dlcName);
    content = content.replace(/MODS_RPF_NAME/g, modsRpfName);
    content = content.replace(/NAME_HASH_AUTOGEN/g, `${carname.toLowerCase()}_AUTOGEN`);
    return content;
}

/**
 * Generates setup2.xml for the vehicle DLC.
 * @param {string} carname The model name of the car.
 * @returns {string} The generated XML content.
 */
function generateVehicleSetup2Xml(carname) {
    const dlcName = `dlc_${carname.toLowerCase()}`; // Internal unique name
    const nameHash = carname.toLowerCase();

    let content = SETUP2_XML_VEHICLE_TEMPLATE;
    content = content.replace(/DLC_NAME/g, dlcName);
    content = content.replace(/NAME_HASH_AUTOGEN/g, `${nameHash}_AUTOGEN`);
    content = content.replace(/NAME_HASH/g, nameHash);
    return content;
}

/**
 * Generates content.xml for the audio DLC.
 * @param {string} carname The model name of the car.
 * @returns {string} The generated XML content.
 */
function generateAudioContentXml(carname, audioGameDatName, audioSoundsDatName, audioSfxRpfName) {
    const dlcAudioName = `dlc_${carname.toLowerCase()}_audio`; // Internal unique name
    const nameHashAudioAutogen = `${carname.toLowerCase()}_audio_AUTOGEN`;

    let content = CONTENT_XML_AUDIO_TEMPLATE;
    content = content.replace(/DLC_AUDIO_NAME/g, dlcAudioName);
    content = content.replace(/AUDIO_GAME_DAT_NAME/g, audioGameDatName);
    content = content.replace(/AUDIO_SOUNDS_DAT_NAME/g, audioSoundsDatName);
    content = content.replace(/AUDIO_SFX_RPF_NAME/g, audioSfxRpfName);
    content = content.replace(/NAME_HASH_AUDIO_AUTOGEN/g, nameHashAudioAutogen);
    return content;
}

/**
 * Generates setup2.xml for the audio DLC.
 * @param {string} carname The model name of the car.
 * @returns {string} The generated XML content.
 */
function generateAudioSetup2Xml(carname) {
    const dlcAudioName = `dlc_${carname.toLowerCase()}_audio`; // Internal unique name
    const nameHashAudio = `${carname.toLowerCase()}_audio`;
    const nameHashAudioAutogen = `${carname.toLowerCase()}_audio_AUTOGEN`;

    let content = SETUP2_XML_AUDIO_TEMPLATE;
    content = content.replace(/DLC_AUDIO_NAME/g, dlcAudioName);
    content = content.replace(/NAME_HASH_AUDIO/g, nameHashAudio);
    content = content.replace(/NAME_HASH_AUDIO_AUTOGEN/g, nameHashAudioAutogen);
    return content;
}

/**
 * Main function to orchestrate the scanning, file organization, and RPF creation process.
 */
async function main() {
    // Ensure the base output directory exists
    await ensureDirExists(OUTPUT_BASE_DIR);

    // Global data structures to hold information found during the initial scan
    // vehiclesMetaFilesInfo will now store parsed vehicle entries and original content
    // Map<fullPath, { vehicles: Array<{ modelName: string, audioNameHash: string|null }>, content: string }>
    const vehiclesMetaFilesInfo = new Map();
    const carcolsMetaFilesInfo = new Map();    // Key: full path to carcols.meta, Value: Set of modelNames/mods
    const allUniqueCarNames = new Set();       // All unique modelNames found in any vehicles.meta, used for top-level car folders

    console.log(`Starting initial recursive meta scan from input directory: ${INPUT_DIR}`);

    /**
     * Recursively scans directories to find and process 'vehicles.meta' and 'carcols.meta' files.
     * Populates global data structures.
     * @param {string} currentDir The current directory being scanned.
     * @returns {Promise<void>}
     */
    async function recursiveMetaScan(currentDir) {
        try {
            const items = await fs.readdir(currentDir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(currentDir, item.name);
                if (item.isDirectory()) {
                    await recursiveMetaScan(fullPath);
                } else if (item.isFile()) {
                    if (item.name === 'vehicles.meta') {
                        const content = await fs.readFile(fullPath, 'utf8'); // Read content here
                        const vehicleItems = [];
                        const itemRegex = /<Item>[\s\S]*?<\/Item>/gi; // Regex to find each <Item> block

                        let match;
                        while ((match = itemRegex.exec(content)) !== null) {
                            const itemBlock = match[0];
                            const modelNameMatch = /<modelName>(.*?)<\/modelName>/i.exec(itemBlock);
                            const audioNameHashMatch = /<audioNameHash>(.*?)<\/audioNameHash>/i.exec(itemBlock);
                            const emptyAudioNameHashMatch = /<audioNameHash\s*\/>/i.exec(itemBlock);

                            const modelName = modelNameMatch ? modelNameMatch[1] : null;
                            let audioNameHash = null;

                            if (audioNameHashMatch) {
                                audioNameHash = audioNameHashMatch[1];
                            } else if (emptyAudioNameHashMatch) {
                                audioNameHash = ""; // Represent empty self-closing tag as an empty string
                            }

                            if (modelName) {
                                vehicleItems.push({ modelName: modelName, audioNameHash: audioNameHash });
                                allUniqueCarNames.add(modelName);
                            }
                        }
                        vehiclesMetaFilesInfo.set(fullPath, { vehicles: vehicleItems, content: content }); // Store content
                    } else if (item.name === 'carcols.meta') {
                        const content = await fs.readFile(fullPath, 'utf8');
                        const mods = [...content.matchAll(/<modelName>(.*?)<\/modelName>/gi)].map(match => match[1]).filter(Boolean);
                        const currentMods = new Set();
                        mods.forEach(m => {
                            if (m) currentMods.add(m);
                        });
                        carcolsMetaFilesInfo.set(fullPath, currentMods);
                    }
                }
            }
        } catch (error) {
            // Silently ignore errors during meta file processing (e.g., permission issues)
        }
    }

    // Perform the initial global scan to find all meta files and their content
    await recursiveMetaScan(INPUT_DIR);

    console.log('\n--- Identified Global Items from Meta Files ---');
    console.log('All unique car names (from vehicles.meta modelNames):', [...allUniqueCarNames]);

    // Map to store associated mods for each carname, based on proximity to vehicles.meta
    const carnameToAssociatedMods = new Map();

    // Associate carcols.meta mods with specific car names based on their directory
    for (const [vehiclesMetaPath, vehiclesInfo] of vehiclesMetaFilesInfo.entries()) {
        const parentDir = path.dirname(vehiclesMetaPath);
        const carcolsMetaPath = path.join(parentDir, 'carcols.meta');

        if (carcolsMetaFilesInfo.has(carcolsMetaPath)) {
            const modsInThisDir = carcolsMetaFilesInfo.get(carcolsMetaPath);
            for (const vehicleEntry of vehiclesInfo.vehicles) {
                if (!carnameToAssociatedMods.has(vehicleEntry.modelName)) {
                    carnameToAssociatedMods.set(vehicleEntry.modelName, new Set());
                }
                modsInThisDir.forEach(mod => carnameToAssociatedMods.get(vehicleEntry.modelName).add(mod));
            }
        }
    }

    console.log('\n--- Processing Each Car Name for RPF Package Creation ---');

    // Process each unique car name to create its specific output structure and RPF
    for (const carname of allUniqueCarNames) {
        // --- 1. Prepare Vehicle DLC Package ---
        console.log(`\n--- Creating Vehicle RPF package for car: ${carname} ---`);

        const vehicleOutputBaseDir = path.join(OUTPUT_BASE_DIR, carname); // Output: output/carname/dlc.rpf
        const vehicleDlcTempInputFolder = path.join(vehicleOutputBaseDir, `${carname.toLowerCase()}_vehicle_dlc_temp`);

        const vehicleDlcDataDir = path.join(vehicleDlcTempInputFolder, 'data');
        const vehicleDlcX64Dir = path.join(vehicleDlcTempInputFolder, 'x64');
        const vehicleDlcX64DataLangDir = path.join(vehicleDlcX64Dir, 'data', 'lang');
        const vehicleDlcVehicleModsRpfFolder = path.join(vehicleDlcX64Dir, 'vehiclemods', `${carname.toLowerCase()}_mods.rpf`); // Re-added underscore for RPF conversion
        const vehicleDlcVehiclesRpfFolder = path.join(vehicleDlcX64Dir, 'vehicles.rpf'); // Re-added underscore for RPF conversion

        await ensureDirExists(vehicleDlcDataDir);
        await ensureDirExists(vehicleDlcX64DataLangDir);
        await ensureDirExists(vehicleDlcVehicleModsRpfFolder);
        await ensureDirExists(vehicleDlcVehiclesRpfFolder);

        const vehicleSpecificCopiedFiles = new Set();

        // Generate and Save content.xml and setup2.xml for VEHICLE DLC
        const vehicleContentXml = generateVehicleContentXml(carname);
        await fs.writeFile(path.join(vehicleDlcTempInputFolder, 'content.xml'), vehicleContentXml);
        const vehicleSetup2Xml = generateVehicleSetup2Xml(carname);
        await fs.writeFile(path.join(vehicleDlcTempInputFolder, 'setup2.xml'), vehicleSetup2Xml);
        console.log(`  Generated vehicle content.xml and setup2.xml for ${carname}`);

        // Copy Meta Files to vehicle DLC data folder
        for (const [metaPath, info] of vehiclesMetaFilesInfo.entries()) {
            // Find the specific vehicle entry for the current carname in this meta file
            const relevantVehicleEntry = info.vehicles.find(v => v.modelName === carname);

            if (relevantVehicleEntry) {
                let metaContentToWrite = info.content; // Start with original content

                // Check if the relevant vehicle entry has an empty audioNameHash
                if (relevantVehicleEntry.audioNameHash === "") {
                    // Check if audio files exist for this carname
                    const audioSfxSearchPatterns = [new RegExp(`^${carname}`, 'i')];
                    const foundAudioSfxFiles = await findFiles(INPUT_DIR, audioSfxSearchPatterns, AUDIO_SFX_EXTENSIONS);
                    const foundAudioConfigFiles = await findFiles(INPUT_DIR, audioSfxSearchPatterns, AUDIO_CONFIG_EXTENSIONS);

                    if (foundAudioSfxFiles.length > 0 || foundAudioConfigFiles.length > 0) {
                        console.log(`  Found empty audioNameHash for '${carname}' in '${path.basename(metaPath)}' and found associated audio files. Updating.`);

                        // Regex to find the *specific* <Item> block for this carname
                        const itemBlockForCarRegex = new RegExp(
                            `(<Item>[\\s\\S]*?<modelName>${carname}<\\/modelName>[\\s\\S]*?)` + // Prefix up to modelName
                            `(<audioNameHash\\s*\\/>)` + // The empty audioNameHash tag
                            `([\\s\\S]*?<\\/Item>)`, // Suffix to the end of the Item block
                            'i'
                        );

                        metaContentToWrite = metaContentToWrite.replace(itemBlockForCarRegex, (match, prefix, emptyTag, suffix) => {
                            const replacementTag = `<audioNameHash>${carname.toLowerCase()}</audioNameHash>`;
                            // Ensure proper indentation if the original empty tag was indented
                            return prefix + '\n      ' + replacementTag + suffix;
                        });

                        // Update the stored info for consistency, though not strictly needed as we write the modified content
                        relevantVehicleEntry.audioNameHash = carname.toLowerCase();
                    }
                }

                const metaParentDir = path.dirname(metaPath);
                const allMetaFilesInDir = await findFiles(metaParentDir, new RegExp(`\\${META_EXTENSION}$`, 'i'), new Set([META_EXTENSION]));

                for (const metaFile of allMetaFilesInDir) {
                    if (metaFile === metaPath) { // If it's the vehicles.meta we just processed
                        const destinationPath = path.join(vehicleDlcDataDir, path.basename(metaFile));
                        await fs.writeFile(destinationPath, metaContentToWrite); // Write modified content
                        vehicleSpecificCopiedFiles.add(metaFile);
                    } else { // For other meta files in the same directory (e.g., carcols.meta, handling.meta)
                        if (!vehicleSpecificCopiedFiles.has(metaFile)) {
                            await copyFileToOutput(metaFile, vehicleDlcDataDir);
                            vehicleSpecificCopiedFiles.add(metaFile);
                        }
                    }
                }
            }
        }
        console.log(`  Copied .meta files to ${vehicleDlcDataDir}`);

        // Copy Model Files to vehicle DLC vehicles.rpf folder
        const modelSearchPatterns = [
            new RegExp(`^${carname}(?![_+]hi|\\_interior)`, 'i'),
            new RegExp(`^${carname}_hi`, 'i'),
            new RegExp(`^${carname}\\+hi`, 'i'),
            new RegExp(`^vehicles_${carname}_interior`, 'i')
        ];
        const foundModelFiles = await findFiles(INPUT_DIR, modelSearchPatterns, MODEL_EXTENSIONS);
        for (const file of foundModelFiles) {
            if (!vehicleSpecificCopiedFiles.has(file)) {
                await copyFileToOutput(file, vehicleDlcVehiclesRpfFolder);
                vehicleSpecificCopiedFiles.add(file);
            }
        }
        console.log(`  Copied model files to ${vehicleDlcVehiclesRpfFolder}`);

        // Copy Mod Files to vehicle DLC vehiclemods folder
        const specificModsForCar = carnameToAssociatedMods.get(carname) || new Set();
        if (specificModsForCar.size > 0) {
            const modSearchPatterns = Array.from(specificModsForCar).map(modName => new RegExp(`^${modName}`, 'i'));
            const foundModFiles = await findFiles(INPUT_DIR, modSearchPatterns, MODEL_EXTENSIONS);
            for (const file of foundModFiles) {
                const destinationPathInMods = path.join(vehicleDlcVehicleModsRpfFolder, path.basename(file));
                try {
                    await fs.copyFile(file, destinationPathInMods);
                } catch (error) {
                    if (error.code !== 'EEXIST') {
                        console.error(`Error copying mod file ${file} to ${vehicleDlcVehicleModsRpfFolder}:`, error);
                    }
                }
            }
            console.log(`  Copied mod files to ${vehicleDlcVehicleModsRpfFolder}`);
        } else {
            console.log(`  No specific mod files found for ${carname} for vehicle DLC.`);
        }

        // Execute gtautil for Vehicle DLC
        const vehicleGtautilCommand = `${GTAUTIL_PATH} createarchive --input "${vehicleDlcTempInputFolder}" --output "${vehicleOutputBaseDir}" --name dlc`;
        console.log(`  Executing: ${vehicleGtautilCommand}`);
        try {
            const { stdout, stderr } = await execPromise(vehicleGtautilCommand);
            if (stdout) console.log(`  gtautil stdout: ${stdout}`);
            if (stderr) console.error(`  gtautil stderr: ${stderr}`);
            console.log(`  Successfully created Vehicle RPF archive for ${carname}.`);
        } catch (error) {
            console.error(`  Error creating Vehicle RPF archive for ${carname}:`, error);
        }

        // Clean up temporary vehicle DLC folder
        try {
            await fs.rm(vehicleDlcTempInputFolder, { recursive: true, force: true });
            console.log(`  Cleaned up temporary vehicle DLC folder: ${vehicleDlcTempInputFolder}`);
        } catch (error) {
            console.error(`  Error cleaning up temporary vehicle DLC folder ${vehicleDlcTempInputFolder}:`, error);
        }

        // --- 2. Prepare Audio DLC Package ---
        console.log(`\n--- Creating Audio RPF package for car: ${carname} ---`);

        const audioOutputBaseDir = path.join(OUTPUT_BASE_DIR, `${carname.toLowerCase()}_audio`); // Output: output/carname_audio/dlc.rpf
        const audioDlcTempInputFolder = path.join(audioOutputBaseDir, `${carname.toLowerCase()}_audio_dlc_temp`);

        const audioDlcX64Dir = path.join(audioDlcTempInputFolder, 'x64');
        const audioDlcX64AudioDir = path.join(audioDlcX64Dir, 'audio');
        // MODIFIED: sfx folder must be inside audio folder
        const audioDlcX64SfxDir = path.join(audioDlcX64AudioDir, 'sfx');
        const audioDlcX64SfxCarnameDir = path.join(audioDlcX64SfxDir, `dlc_${carname.toLowerCase()}`); // Re-added underscore for RPF conversion

        await ensureDirExists(audioDlcX64AudioDir);
        await ensureDirExists(audioDlcX64SfxCarnameDir);

        const audioSpecificCopiedFiles = new Set();
        const relevantAudioHashesForCar = new Set();

        // Collect audio hashes from relevant vehicles.meta files
        // Iterate through all vehicles.meta files to find audio hashes associated with this carname
        for (const [, info] of vehiclesMetaFilesInfo.entries()) {
            for (const vehicleEntry of info.vehicles) {
                if (vehicleEntry.modelName === carname && vehicleEntry.audioNameHash && vehicleEntry.audioNameHash !== "") {
                    relevantAudioHashesForCar.add(vehicleEntry.audioNameHash);
                }
            }
        }

        // Determine audio specific file names for content.xml
        let audioGameDatName = '';
        let audioSoundsDatName = '';
        const audioSfxRpfName = `dlc_${carname.toLowerCase()}`; // This is the name of the RPF created by gtautil from dlc_carname_ folder

        // Search for relevant audio config files (e.g., gbadmiral_game.dat, gbadmiral_sounds.dat)
        const audioConfigPatterns = Array.from(relevantAudioHashesForCar).map(hash => new RegExp(`^${hash}_(game|sounds)\\.dat`, 'i'));
        audioConfigPatterns.push(new RegExp(`^${carname}_(game|sounds)\\.dat`, 'i'));

        const foundSpecificAudioConfigDats = await findFiles(INPUT_DIR, audioConfigPatterns, new Set(['.dat']));

        for (const file of foundSpecificAudioConfigDats) {
            const baseName = path.basename(file).toLowerCase();
            if (baseName.includes('_game.dat')) {
                audioGameDatName = path.basename(file);
            } else if (baseName.includes('_sounds.dat')) {
                audioSoundsDatName = path.basename(file);
            }
        }

        // Fallback or default names if not found
        if (!audioGameDatName) audioGameDatName = `${carname.toLowerCase()}_game.dat`;
        if (!audioSoundsDatName) audioSoundsDatName = `${carname.toLowerCase()}_sounds.dat`;


        // Generate and Save content.xml and setup2.xml for AUDIO DLC
        const audioContentXml = generateAudioContentXml(carname, audioGameDatName, audioSoundsDatName, audioSfxRpfName);
        await fs.writeFile(path.join(audioDlcTempInputFolder, 'content.xml'), audioContentXml);
        const audioSetup2Xml = generateAudioSetup2Xml(carname);
        await fs.writeFile(path.join(audioDlcTempInputFolder, 'setup2.xml'), audioSetup2Xml);
        console.log(`  Generated audio content.xml and setup2.xml for ${carname}`);

        // Copy Audio Archives (.awc, .oac) to audio DLC sfx folder
        const audioSfxSearchPatterns = Array.from(relevantAudioHashesForCar).map(hash => new RegExp(`^${hash}`, 'i'));
        audioSfxSearchPatterns.push(new RegExp(`^${carname}`, 'i'));

        const foundAudioSfxFiles = await findFiles(INPUT_DIR, audioSfxSearchPatterns, AUDIO_SFX_EXTENSIONS);
        for (const file of foundAudioSfxFiles) {
            if (!audioSpecificCopiedFiles.has(file)) {
                await copyFileToOutput(file, audioDlcX64SfxCarnameDir);
                audioSpecificCopiedFiles.add(file);
            }
        }
        console.log(`  Copied audio archives (.awc, .oac) to ${audioDlcX64SfxCarnameDir}`);

        // Copy Audio Config files (.rel, .dat, .nametable) to audio DLC audio folder
        const audioConfigPatternsForCopy = [
            new RegExp(`^${carname}_game\\.dat`, 'i'),
            new RegExp(`^${carname}_sounds\\.dat`, 'i'),
            new RegExp(`^${carname}\\.rel`, 'i'), // Specific .rel for carname
            new RegExp(`^${carname}\\.nametable`, 'i') // Specific .nametable for carname
        ];
        // Also include any .rel or .nametable files directly matching audio hashes
        Array.from(relevantAudioHashesForCar).forEach(hash => {
            audioConfigPatternsForCopy.push(new RegExp(`^${hash}\\.rel`, 'i'));
            audioConfigPatternsForCopy.push(new RegExp(`^${hash}\\.nametable`, 'i'));
        });

        const foundAudioConfigFiles = await findFiles(INPUT_DIR, audioConfigPatternsForCopy, AUDIO_CONFIG_EXTENSIONS);
        for (const file of foundAudioConfigFiles) {
            if (!audioSpecificCopiedFiles.has(file)) {
                await copyFileToOutput(file, audioDlcX64AudioDir);
                audioSpecificCopiedFiles.add(file);
            }
        }
        console.log(`  Copied audio config files (.rel, .dat, .nametable) to ${audioDlcX64AudioDir}`);

        // Execute gtautil for Audio DLC
        const audioGtautilCommand = `${GTAUTIL_PATH} createarchive --input "${audioDlcTempInputFolder}" --output "${audioOutputBaseDir}" --name dlc`;
        console.log(`  Executing: ${audioGtautilCommand}`);
        try {
            const { stdout, stderr } = await execPromise(audioGtautilCommand);
            if (stdout) console.log(`  gtautil stdout: ${stdout}`);
            if (stderr) console.error(`  gtautil stderr: ${stderr}`);
            console.log(`  Successfully created Audio RPF archive for ${carname}.`);
        } catch (error) {
            console.error(`  Error creating Audio RPF archive for ${carname}:`, error);
        }

        // Clean up temporary audio DLC folder
        try {
            await fs.rm(audioDlcTempInputFolder, { recursive: true, force: true });
            console.log(`  Cleaned up temporary audio DLC folder: ${audioDlcTempInputFolder}`);
        } catch (error) {
            console.error(`  Error cleaning up temporary audio DLC folder ${audioDlcTempInputFolder}:`, error);
        }
    }

    console.log('\nAll RPF packages created and organized. Check the "output" folder.');
}

// Execute the main function
main().catch(console.error);

/*
To use this script:
1. Save the code as a .js file (e.g., `create_gta_dlc_rpfs.js`).
2. Create an 'input' folder in the same directory as the script. Place all your GTA 5 vehicle modification files (including subfolders) inside this 'input' folder.
3. Create a 'utils' folder in the same directory as the script. Place the `gtautil` executable inside this 'utils' folder.
   The `gtautil` executable must be named `gtautil` (or `gtautil.exe` on Windows; the script will handle this if the executable is correctly placed and has execution permissions).
4. Open your terminal or command prompt.
5. Navigate to the directory where you saved the script.
6. Run the script using Node.js:
   node create_gta_dlc_rpfs.js

The script will:
- Scan your 'input' folder for `vehicles.meta` and `carcols.meta` files.
- For each unique car model found:
    - **If a `vehicles.meta` has an empty `<audioNameHash />` for a vehicle model, and corresponding audio files are found for that model, the script will update the `<audioNameHash />` tag to `<audioNameHash>vehiclemodel</audioNameHash>` (using the lowercase vehicle model name) before writing the `vehicles.meta` to the output.**
    - **Create a Vehicle DLC Package:**
        - Creates `output/[carname]/` folder.
        - Generates `content.xml` and `setup2.xml` for the vehicle DLC at the root of a temporary folder (e.g., `output/[carname]/[carname]_vehicle_dlc_temp/`).
        - Creates `data/`, `x64/`, `x64/data/lang/` folders inside the temporary folder.
        - Creates `x64/vehiclemods/carname_mods.rpf_` (for mod parts) and `x64/vehicles.rpf_` (for main models) as *temporary folders with underscores*, which `gtautil` will convert into nested `.rpf` archives.
        - Copies `.meta` files (potentially modified) into `data/`.
        - Copies model files into `vehicles.rpf_`.
        - Copies mod files into `carname_mods.rpf_`.
        - Executes `gtautil` to create the vehicle `dlc.rpf` in `output/[carname]/`.
        - Cleans up the temporary vehicle DLC folder.
    - **Create an Audio DLC Package:**
        - Creates `output/[carname]_audio/` folder.
        - Generates `content.xml` and `setup2.xml` for the audio DLC at the root of a temporary folder (e.g., `output/[carname]_audio/[carname]_audio_dlc_temp/`), dynamically referencing the audio files.
        - Creates `x64/`, `x64/audio/` folders inside the temporary folder.
        - Creates `x64/audio/sfx/dlc_[carname]_` as a *temporary folder with an underscore*, which `gtautil` will convert into a nested `.rpf` archive (this will contain `.awc` files).
        - Copies `.awc` and `.oac` (audio archives) into `x64/audio/sfx/dlc_[carname]_`.
        - Copies `.rel`, `.dat` (e.g., `_game.dat`, `_sounds.dat`), and `.nametable` (audio config files) into `x64/audio/`.
        - Executes `gtautil` to create the audio `dlc.rpf` in `output/[carname]_audio/`.
        - Cleans up the temporary audio DLC folder.

This will result in two separate and correctly structured DLC packages per car, ensuring proper loading of both the vehicle and its audio in GTA 5.
*/
