var yearRangeSlider;
window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id == "4U") {
        let nav = document.getElementById("nav")
        nav.children[1].style.backgroundColor = "#f00"
        var data = await fetchData("https://gist.githubusercontent.com/Yaffles/49f3df09cdeba2de5174639beac2eb6c/raw/4U.json")
    }
    else if (id == "3U") {
        let nav = document.getElementById("nav")
        nav.children[0].style.backgroundColor = "#f00"
        var data = await fetchData("https://gist.githubusercontent.com/Yaffles/49f3df09cdeba2de5174639beac2eb6c/raw/3U.json")
    }
    else {
        // enlarge the class nav's text size and centre the nav vertically
        document.getElementById("nav").style.transform = "scale(4)";
        document.getElementById("nav").style.marginTop = "50vh";

        Array.from(document.body.children).forEach(element => {
            if (element.id !== "nav") {
                element.style.display = "none";
            }
        });
    }
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
    console.log("getting range")
    let range = [1990, 2023];
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
            'max': 2023  // replace with your desired maximum year
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

        updateProgressBar();

        let dialog = document.getElementById("notes-popup");
        dialog.addEventListener("close", (event) => {
            let dialog = document.getElementById("notes-popup")
            id = dialog.getAttribute("note-id")

            let dialogInput = document.getElementById("noteInput");
            let noteText = dialogInput.value;


            localStorage.setItem(id, noteText)
        });

        updateRecentFiles();
        updateNotesIcon();
        updateSavedRange(range);

    });


    function updateSavedRange(range) {
        localStorage.setItem("yearRange", JSON.stringify(range));
        let newrange = localStorage.getItem("yearRange");
        console.log("range: ", newrange)
    }


    yearRangeSlider = yearRange.noUiSlider;



};


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

    return filesBySchool;
  }

function createLinks(ipfs) {
    filesBySchool = groupFilesBySchool(ipfs);

    let htmlContent = '';

    Object.entries(filesBySchool).forEach(([school, schoolFiles]) => {
        htmlContent += `<div class="school">\n<h2>${school}</h2>\n`;
        schoolFiles.forEach((file, i) => {
        const yearMatch = file.match(/\b\d{4}\b/);
        const year = yearMatch ? yearMatch[0] : 'Unknown Year';
        const checkboxId = `3U-checkbox_${school}_${i}`;
        const noteId = `3U-notes_${school}_${i}`;
        const ipfsLink = `https://${ipfs[file]}.ipfs.nftstorage.link/`;

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

    let recentFiles = localStorage.getItem("recentFiles")
    if (recentFiles) {
        recentFiles = JSON.parse(recentFiles)
    }
    else {
        recentFiles = []
    }

    for (let checkboxId of recentFiles) {
        console.log(checkboxId)
        let original = document.getElementById(checkboxId).parentElement;
        let link = original.cloneNode(true);

        recentPapers.appendChild(link)
    }
}

function addRecent(checkboxId) {
    let recentFiles = localStorage.getItem("recentFiles")
    if (recentFiles) {
        recentFiles = JSON.parse(recentFiles)
    }
    else {
        recentFiles = []
    }

    recentFiles.push(checkboxId)
    console.log(recentFiles + " added")
    if (recentFiles.length > 10) {
        recentFiles.shift()
    }

    localStorage.setItem("recentFiles", JSON.stringify(recentFiles))
    updateRecentFiles()
}

function updateNotesIcon() {
    let notes = document.getElementsByClassName("noteButton")
    for (let i = 0; i < notes.length; i++) {
        note = notes[i]
        id = note.id

        if (localStorage.getItem(id)) {
            note.innerText = "📜"
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
    var inputs = document.getElementsByTagName("input");
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
