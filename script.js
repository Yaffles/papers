var yearRangeSlider;
window.onload = async function() {
    let data = await getData()

    // console.log(data)
    createLinks(data);



    var inputs = document.getElementsByTagName("input");
    var checkedCount = 0;
    let visibleCount = 0;
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].parentElement.style.display !== 'none') {
            visibleCount++;
        }
        inputs[i].checked = localStorage.getItem(inputs[i].id) === "true" ? true : false;
        if (inputs[i].checked) {
            checkedCount++;
        }
    }
    updateProgressBar(checkedCount, inputs.length);


    // Get past range from local storage else set to default
    currentYear = new Date().getFullYear();
    console.log("getting range")
    let range = [1990, currentYear];
    let newrange = localStorage.getItem("yearRange");
    console.log("range: ", newrange)
    if (newrange) {
        range = JSON.parse(newrange);
    }

    // Create year range slider
    var yearRange = document.getElementById('yearRange');

    noUiSlider.create(yearRange, {
        start: range, // replace with your desired start range
        connect: true,
        range: {
            'min': 1990, // replace with your desired minimum year
            'max': currentYear // replace with your desired maximum year
        },
        tooltips: [
            { to: function(value) { return '' + value; } },
            { to: function(value) { return '' + value; } }
        ],
        step: 1,
        pips: {
            mode: 'steps',
            stepped: true,
            density: 100
        }
    });

    yearRange.noUiSlider.on('update.one', function () {
        console.log('slider updated');
        let range = yearRange.noUiSlider.get();
        let minYear = parseInt(range[0]);
        let maxYear = parseInt(range[1]);

        // Get all the link wrappers
        let linkWrappers = document.querySelectorAll('.link-wrapper');

        // Loop through the link wrappers
        for (let i = 0; i < linkWrappers.length; i++) {
            // Get the link within the wrapper
            let link = linkWrappers[i].querySelector('a');

            // Get the year from the link text
            let year = parseInt(link.textContent);

            // If the year is not within the range, hide the wrapper
            if (year < minYear || year > maxYear) {
                linkWrappers[i].style.display = 'none';
            }
            // Otherwise, show the wrapper
            else {
                linkWrappers[i].style.display = '';
            }
        }

        // hide empty schools
        hideEmptySchools();

        updateProgressBar();

        let dialog = document.getElementById("notes-popup");
        dialog.addEventListener("close", (event) => {
            let dialog = document.getElementById("notes-popup")
            id = dialog.getAttribute("note-id")

            let dialogInput = document.getElementById("noteInput");
            let noteText = dialogInput.value;


            if (noteText === "") {
                localStorage.removeItem(id)
            }
            else {
                localStorage.setItem(id, noteText)
            }

            updateNotesIcon();
        });

        updateRecentFiles();

        updateSavedRange(range);
        updateNotesIcon();

    });



    function updateSavedRange(range) {
        localStorage.setItem("yearRange", JSON.stringify(range));
        let newrange = localStorage.getItem("yearRange");
        console.log("range: ", newrange)
    }


    yearRangeSlider = yearRange.noUiSlider;


    document.getElementById('signInBtn').addEventListener('click', async () => {
        const username = prompt('Please enter your username:');
        if (!username) return; // Exit if no username is entered




        let gist = await getGist(username);
        if (gist !== null) {
            // If local or remote data is newer, use that
            let remoteData = gist;
            let localData = localStorage
            console.log("remote: ", remoteData)
            console.log("local: ", localData)
            console.log("remote length: ", Object.keys(remoteData).length)
            console.log("local length: ", localData.length)
            if (localData.length > Object.keys(remoteData).length) {
                console.log("local is newer")
                updateGist(username, JSON.stringify(localData));
            }
            else {
                console.log("remote is newer")
                localStorage.clear();
                for (let key in remoteData) {
                    localStorage.setItem(key, remoteData[key]);
                }
                // reload page
            }

            console.log(content);
        }
        else {
            console.log("Creating new Gist")
            updateGist(username, JSON.stringify(localStorage));
        }

    });

    // document.getElementById('localSourceBtn').addEventListener('click', () => {
    //     // Changes the external file source to local folder
    //     // open the dialog box
    //     let dialog = document.getElementById("source-popup");
    //     dialog.showModal();

    // });

    document.getElementById('fileInput').addEventListener('change', function(e) {
        // Update the label based on the number of files selected
        const files = e.target.files;
        const directories = {};

        // Iterate through the files and organize them by directory
        for (const file of files) {
            // Assuming the file path is available (it usually isn't due to security reasons)
            // This is more illustrative than practical, as `file.webkitRelativePath` should be used
            const path = file.webkitRelativePath || file.name;
            console.log(path); // Log the path, but in practice, this might not give you the directory structure

            const directory = path.substring(path.indexOf('/')+1, path.lastIndexOf('/'));
            if (!directories[directory]) {
                directories[directory] = [];
            }
            directories[directory].push(file.name);
        }

        // Now, directories object contains an array of files for each directory
        console.log(directories);

        // If directories with name Extension 1 and Extension 2 exist display the amount of files in each of them
        if (directories['Extension 1'] && directories['Extension 2']) {
            console.log('Extension 1:', directories['Extension 1'].length, 'files');
            console.log('Extension 2:', directories['Extension 2'].length, 'files');


        }
        const path = e.target.value;
        console.log(path)
      });
};

function hideEmptySchools() {
    let schools = document.querySelectorAll('.school');
        for (let i = 0; i < schools.length; i++) {
            let school = schools[i];
            let links = school.querySelectorAll('.link-wrapper');
            let visibleLinks = 0;
            for (let j = 0; j < links.length; j++) {
                if (links[j].style.display !== 'none') {
                    visibleLinks++;
                }
            }
            if (visibleLinks === 0) {
                school.style.display = 'none';
            }
            else {
                school.style.display = '';
            }
        }
}

function filePathChange() {
    let filePath = document.getElementById('filePathInput').value;
    console.log(filePath);
    let testLink = document.getElementById('testLink');
    testLink.href = filePath + "\\Extension 1\\Abbotsleigh 2023 3U Trials & Solutions.pdf";
    testLink.style.display = 'block';
}

async function updateGist(username, content) {
    const token = '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'; // Securely manage this token
    const gistId = '49f3df09cdeba2de5174639beac2eb6c'; // Securely manage this Gist ID
    const response = await fetch('https://api.github.com/gists/49f3df09cdeba2de5174639beac2eb6c', {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [`${username}.json`]: {
            content: content,
          },
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Gist created:', data.html_url);
    } else {
      console.error('Failed to create Gist:', response.statusText);
    }
  };


async function getGist(username) {
    const token = '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'; // Securely manage this token
    const response = await fetch(`https://gist.githubusercontent.com/Yaffles/49f3df09cdeba2de5174639beac2eb6c/raw/${username}.json`);
    if (response.ok) {
        const gist = await response.json();
        console.log('Gist retrieved:', gist);
        return gist; // Returns the Gist object
    } else {
        console.error('Failed to retrieve Gist:', response.statusText);
        return null; // Indicates failure
    }
}


async function getData() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    // get password local
    let password = localStorage.getItem("password")
    if (!password) {
        password = prompt("Enter password")
        localStorage.setItem("password", password)
    }

    let url = `https://gist.githubusercontent.com/Yaffles/49f3df09cdeba2de5174639beac2eb6c/raw/${password}`
    if (id == "4U") {
        let nav = document.getElementById("navLinks")
        nav.children[1].style.backgroundColor = "#f00"
        url += "4U.json"
    }
    else if (id == "3U") {
        let nav = document.getElementById("navLinks")
        nav.children[0].style.backgroundColor = "#f00"
        url += "3U.json"

    }
    else {
    document.getElementById("nav").style.position = "absolute";
    document.getElementById("nav").style.top = "50%";
    document.getElementById("nav").style.left = "50%";
    document.getElementById("nav").style.transform = "translate(-50%, -50%)";
    document.getElementById("nav").style.display = "flex";
    document.getElementById("nav").style.justifyContent = "center";
    document.getElementById("nav").style.alignItems = "center";
    document.getElementById("navLinks").style.scale = 6;

    Array.from(document.body.children).forEach(element => {
        if (element.id !== "nav") {
            element.style.visibility = "hidden";
        }
    });
    return null;
    }

    var data = await fetchData(url);
    if (data) {
        return data
    }
    else {
        localStorage.removeItem("password")
        return getData()
    }

}

async function fetchData(gistUrl) {
    try {
        // Fetch the raw content of the Gist
        const response = await fetch(gistUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse the response body as JSON
        const data = await response.json();

        console.log(typeof data);
        console.log(data);

        const filesArray = Object.entries(data).map(([key, value]) => {
            const yearMatch = key.match(/\b\d{4}\b/);
            return { key, value, year: yearMatch ? parseInt(yearMatch[0], 10) : null };
          });

          // Step 2: Sort by year
          const sortedFilesArray = filesArray.sort((a, b) => a.year - b.year);

          // Step 3: Convert back to an object
          const sortedFiles = sortedFilesArray.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
          }, {});

        return sortedFiles;
      } catch (error) {
        console.error("Could not fetch IPFS data:", error);
      }
}

function groupFilesBySchool(ipfs) {
    const filesBySchool = {};

    Object.keys(ipfs).forEach((file) => {
      const schoolNameMatch = file.match(/(.+?)\s\d+/);
      if (schoolNameMatch) {
        const schoolName = schoolNameMatch[1];
        if (!filesBySchool[schoolName]) {
          filesBySchool[schoolName] = [];
        }
        filesBySchool[schoolName].push(file);
      }
    });

    // Sort by school name alphabetically
    Object.keys(filesBySchool).sort().forEach((schoolName) => {
      filesBySchool[schoolName] = filesBySchool[schoolName].sort();
    });

    return filesBySchool;
  }

  function createLinks(ipfs) {
    filesBySchool = groupFilesBySchool(ipfs);

    let htmlContent = '';

    // Sort school names alphabetically
    const sortedSchoolNames = Object.keys(filesBySchool).sort();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    sortedSchoolNames.forEach((school) => {
        const schoolFiles = filesBySchool[school];
        htmlContent += `<div class="school">\n<h2>${school}</h2>\n`;
        schoolFiles.forEach((file, i) => {
            const yearMatch = file.match(/\b\d{4}\b/);
            const year = yearMatch ? yearMatch[0] : 'Unknown Year';
            const checkboxId = `${id}-checkbox_${school}_${i}`;
            const noteId = `${id}-notes_${school}_${i}`;
            // const ipfsLink = `https://${ipfs[file]}.ipfs.nftstorage.link/`;
            // const ipfsLink = `https://ipfs.io/ipfs/${ipfs[file]}/`;
            const ipfsLink = `./${id}/${file}`;
            htmlContent += `<div class="link-wrapper"><input type="checkbox" id="${checkboxId}" onclick="updateStorage('${checkboxId}')"><button id="${noteId}" class="noteButton" onclick="openNote('${noteId}')">📄</button> <a onclick="addRecent('${checkboxId}')" href="${ipfsLink}" target="_blank">${year}</a></div>\n`;
        });
        htmlContent += '</div>\n';
    });

    console.log(htmlContent);
    document.getElementById('content').innerHTML = htmlContent;
}

function updateRecentFiles() {
    recentPapers = document.getElementById("recentPapers")
    recentPapers.innerHTML = "<h2>Recent</h2>"

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    let recentFiles = localStorage.getItem(`recentFiles${id}`)
    if (recentFiles) {
        recentFiles = JSON.parse(recentFiles)
    }
    else {
        recentFiles = []
    }

    for (let checkboxId of recentFiles) {
        console.log(checkboxId)
        try {
            let original = document.getElementById(checkboxId).parentElement;
            let link = original.cloneNode(true);
            // remove the checkbox from only the clone
            link.querySelector("input").remove();

            let year = link.querySelector("a").innerText;
            let school = original.parentElement.firstElementChild.innerText;

            link.querySelector("a").innerText = school + " - " + year

            console.log(link)
            recentPapers.appendChild(link)
        }
        catch (e) {
            // skip current iteration
            console.log(e)
            continue;
        }
    }
    hideEmptySchools();
}

async function downloadGitHubFolder() {
    const owner = 'Yaffles';
    const repo = 'papers';
    const zip = new JSZip();

    let button = document.getElementById("localSourceBtn");

    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('id');


    try {
        // Fetch the contents of the folder
        const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        console.log(contentsUrl)
        const response = await fetch(contentsUrl);
        console.log(response)
        const files = await response.json();
        console.log(files)

        for (const file of files) {
            if (file.type === 'file' && file.download_url) {
                const fileResponse = await fetch(file.download_url);
                const blob = await fileResponse.blob();
                const arrayBuffer = await blob.arrayBuffer();
                zip.file(file.name, arrayBuffer);
            }
            // update the button progress
            button.innerText = `${Math.round((files.indexOf(file) / files.length) * 100)}%`
        }

        // Generate the ZIP file and trigger download
        zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, `${folderPath.split('/').pop()}.zip`);
        });

        alert('Files downloaded successfully!');
    } catch (error) {
        console.error('Error downloading folder:', error);
    }
}

async function downloadGitHubFolderAsZip() {
    const owner = 'yaffles';
    const repo = 'papers';
    const folderPath = '4U';
    const zip = new JSZip();

    try {
        // Fetch the contents of the folder
        const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}`;
        const response = await fetch(contentsUrl);
        const files = await response.json();

        // Create an array of promises for downloading files
        const downloadPromises = files.map(file => {
            if (file.type === 'file' && file.download_url) {
                return fetch(file.download_url)
                    .then(fileResponse => fileResponse.blob())
                    .then(blob => blob.arrayBuffer())
                    .then(arrayBuffer => {
                        zip.file(file.name, arrayBuffer);
                        console.log(`Downloaded: ${file.name}`);
                    });
            } else {
                console.log(`Skipped: ${file.name} (type: ${file.type})`);
                return Promise.resolve();
            }
        });

        // Wait for all downloads to complete
        await Promise.all(downloadPromises);
        console.log('All files downloaded!');

        // Generate the ZIP file and trigger download
        const zipContent = await zip.generateAsync({ type: 'blob' });
        saveAs(zipContent, `${folderPath.split('/').pop()}.zip`);
        console.log('ZIP file generated and saved!');
    } catch (error) {
        console.error('Error downloading folder:', error);
    }
}

function addRecent(checkboxId) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    let recentFiles = localStorage.getItem(`recentFiles${id}`)
    if (recentFiles) {
        recentFiles = JSON.parse(recentFiles)
    }
    else {
        recentFiles = []
    }

    if (recentFiles.includes(checkboxId)) {
        recentFiles = recentFiles.filter(e => e !== checkboxId)
    }
    // add to the start of the list
    recentFiles.unshift(checkboxId)
    console.log(recentFiles + " added")
    while (recentFiles.length > 5) {
        recentFiles.pop()
    }

    localStorage.setItem(`recentFiles${id}`, JSON.stringify(recentFiles))
    updateRecentFiles()
}

function updateNotesIcon() {
    console.log("updating notes icon")
    let notes = document.getElementsByClassName("noteButton")
    for (let i = 0; i < notes.length; i++) {
        note = notes[i]
        id = note.id

        if (localStorage.getItem(id)) {
            note.innerText = "📜"
        }
        else {
            note.innerText = "📄"
        }
    }
}

function updateStorage(id) {
    var checkbox = document.getElementById(id);
    localStorage.setItem(id, checkbox.checked);

    updateProgressBar();
};

function openNote(id) {
    let noteElement = document.getElementById(id)
    let dialog = document.getElementById("notes-popup")

    dialog.setAttribute("note-id", id)

    let school = noteElement.parentElement.parentElement.firstElementChild.innerText

    let inputId = id.replace("notes", "checkbox")
    let year = noteElement.nextElementSibling.innerText


    dialog.showModal()
    let dialogTitle = document.getElementById("dialogTitle")
    dialogTitle.innerText = school + " " + year

    let stored = localStorage.getItem(id)

    let dialogInput = document.getElementById("noteInput");
    console.log("stored: ", stored)
    if (stored) {

        dialogInput.value = stored;
    }
    else {
        dialogInput.value = "";
    }

}


function updateProgressBar() {
    var inputs = document.querySelector("#content").getElementsByTagName("input");
    var checkedCount = 0;
    var visibleCount = 0;
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].parentElement.style.display !== 'none') {
            visibleCount++;
            if (inputs[i].checked) {
                checkedCount++;
            }
        }
    }

    var progressBar = document.getElementById("progressBarInner");
    progressBar.style.width = (checkedCount / visibleCount) * 100 + "%";
    var progressText = document.getElementById("progressText");
    progressText.textContent = ((checkedCount / visibleCount) * 100).toFixed(1) + "% (" + checkedCount + "/" + visibleCount + ")";
};
