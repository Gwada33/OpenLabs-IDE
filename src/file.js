  const { ipcRenderer, remote } = require('electron');
  const { dialog } = remote;
  const fs = require('fs');
  const path = require('path');
  const loader = require('monaco-loader');


  let editor;
  let currentFilePath = '';


  loader().then((monaco) => {
    const div = document.getElementById('container');
    editor = monaco.editor.create(div, {
      automaticLayout: true,
      extraEditorClassName: true,
      acceptSuggestionOnEnter: true,
      quickSuggestions: true,
      autoIndent: "brackets",
      wordBasedSuggestions: true,
      contextmenu: true,
      autoClosingOvertype: "always",
      lineNumbers: true,
      autoClosingBrackets: true,
      autoClosingTags: true,
      fontFamily: 'Fira Code',
      acceptSuggestionOnCommitCharacter: true,
      autoClosingQuotes: true,
      fontWeight: 200,
      copyWithSyntaxHighlighting: true,
    });

    // Chargez le thème personnalisé dans Monaco Editor
    monaco.editor.defineTheme('custom-theme', {
      base: "vs-dark",
        inherit: true,
        rules: [
      {
        foreground: "FFFFFF",
        background: "none", // Assurez-vous que la valeur est valide
        fontStyle: "normal",
        token: "",
      }
    ],
        "colors": {}
    })

// Appliquez le thème personnalisé à l'éditeur
    monaco.editor.setTheme('custom-theme');


    editor.onDidChangeModelContent(() => {
      if (currentFilePath) {
        const content = editor.getValue();
        saveFileContent(currentFilePath, content);
      }
    });
  });

  function fadeIn(element) {
    anime({
      targets: element,
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutQuad'
    });
  }

  const openFolder = () => {
  ipcRenderer.send('open-folder-triggered');
};

  ipcRenderer.on('folder-selected', (_, folderPath) => {
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = ''; // Clear the fileList container
  displayFolderContent(folderPath, fileList); // Add new items to the fileList
  watchFolder(folderPath);
});

  const createFolder = async () => {
  const result = await dialog.showOpenDialog({
  title: 'Create Folder',
  message: 'Enter the folder name:',
  defaultPath: currentFilePath || undefined,
  properties: ['createDirectory'],
});

  if (!result.canceled && result.filePaths.length > 0) {
  const newFolderPath = result.filePaths[0];

  fs.mkdir(newFolderPath, (err) => {
  if (err) {
  console.error(err);
  return;
}

  const fileList = document.getElementById('fileList');
  const folderItem = createFolderItem(newFolderPath);
  fileList.appendChild(folderItem);
});
}
};

  const createFile = async () => {
  const result = await dialog.showSaveDialog({
  title: 'Create File',
  message: 'Enter the file name:',
  defaultPath: currentFilePath || undefined,
  buttonLabel: 'Create',
});

  if (!result.canceled && result.filePath) {
  const newFilePath = result.filePath;

  fs.writeFile(newFilePath, '', (err) => {
  if (err) {
  console.error(err);
  return;
}

  const fileList = document.getElementById('fileList');
  const fileItem = createFileItem(newFilePath);
  fileList.appendChild(fileItem);
});
}
};

  function displayFolderContent(folderPath, container) {
  const files = fs.readdirSync(folderPath);

  const ul = document.createElement('ul');
  ul.classList.add('folder-list');

  files.forEach((file) => {
  const filePath = path.join(folderPath, file);
  const stats = fs.statSync(filePath);
  const isDirectory = stats.isDirectory();

  const li = isDirectory ? createFolderItem(filePath) : createFileItem(filePath);

  ul.appendChild(li);

  if (isDirectory) {
  const subFolderContentContainer = document.createElement('div');
  subFolderContentContainer.classList.add('sub-folder-content');
  li.appendChild(subFolderContentContainer);
  displayFolderContent(filePath, subFolderContentContainer);
}
});

  // Remove existing elements from the container
while (container.firstChild) {
  container.firstChild.remove();
}

  container.appendChild(ul);
}



  function watchFolder(folderPath) {
  fs.watch(folderPath, { recursive: true }, (event, filename) => {
    displayFolderContent(folderPath);
  });
}


  function createFolderItem(folderPath) {
    const li = document.createElement('li');
    li.classList.add('file-item');

    const icon = document.createElement('span');
    icon.classList.add('file-icon');
    icon.innerHTML = '<i class="fa-solid fa-folder"></i>';

    const name = document.createElement('span');
    name.classList.add('file-name');
    name.textContent = path.basename(folderPath);

    // Add arrow toggle element
    const arrow = document.createElement('span');
    arrow.classList.add('arrow');
    arrow.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
    li.appendChild(arrow);

    li.appendChild(icon);
    li.appendChild(name);

    li.addEventListener('click', (event) => {
      event.stopPropagation();

      const folderContentContainer = li.querySelector('.folder-content');
      const subFolderContentContainer = li.querySelector('.sub-folder-content');

      if (folderContentContainer) {
        // If the folder content container exists, toggle its visibility
        if (folderContentContainer.style.display === 'none') {
          folderContentContainer.style.display = 'block';
          arrow.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
          folderContentContainer.style.opacity = '0'; // Set initial opacity to 0
          setTimeout(() => {
            folderContentContainer.style.opacity = '1'; // Transition to opacity 1
          }, 10);
        } else {
          folderContentContainer.style.opacity = '0'; // Transition to opacity 0
          setTimeout(() => {
            folderContentContainer.style.display = 'none';
            arrow.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
          }, 200); // Wait for the transition to complete before hiding the container
        }
      } else if (subFolderContentContainer) {
        // If the sub-folder content container exists, toggle its visibility
        if (subFolderContentContainer.style.display === 'none') {
          subFolderContentContainer.style.display = 'block';
          arrow.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
          subFolderContentContainer.style.opacity = '0'; // Set initial opacity to 0
          setTimeout(() => {
            subFolderContentContainer.style.opacity = '1'; // Transition to opacity 1
          }, 10);
        } else {
          subFolderContentContainer.style.opacity = '0'; // Transition to opacity 0
          setTimeout(() => {
            subFolderContentContainer.style.display = 'none';
            arrow.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
          }, 200); // Wait for the transition to complete before hiding the container
        }
      } else {
        // If neither container exists, create and display the folder content
        const isDirectory = true; // Assuming it's always a directory for createFolderItem
        const folderContentContainer = document.createElement('div');
        folderContentContainer.classList.add('folder-content');
        displayFolderContent(folderPath, folderContentContainer);
        folderContentContainer.style.opacity = '0'; // Set initial opacity to 0
        li.appendChild(folderContentContainer);
        arrow.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';

        // Close parent folders if they are open
        let parentFolder = li.parentElement;
        while (parentFolder) {
          if (parentFolder.classList.contains('file-item')) {
            const parentArrow = parentFolder.querySelector('.arrow');
            const parentContent = parentFolder.querySelector('.folder-content');
            const parentSubContent = parentFolder.querySelector('.sub-folder-content');
            if (parentContent) {
              parentContent.style.opacity = '0'; // Transition to opacity 0
              setTimeout(() => {
                parentContent.style.display = 'none';
                parentArrow.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
              }, 200); // Wait for the transition to complete before hiding the container
            }
            if (parentSubContent) {
              parentSubContent.style.opacity = '0'; // Transition to opacity 0
              setTimeout(() => {
                parentSubContent.style.display = 'none';
                parentArrow.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
              }, 200); // Wait for the transition to complete before hiding the container
            }
          }
          parentFolder = parentFolder.parentElement;
        }

        setTimeout(() => {
          folderContentContainer.style.opacity = '1'; // Transition to opacity 1
        }, 10);
      }
    });

    return li;
  }

  function createFileItem(filePath) {
    const li = document.createElement('li');
    li.classList.add('file-item');

    const icon = document.createElement('span');
    icon.classList.add('file-icon');
    const fileExtension = path.extname(filePath).toLowerCase();

    const iconMap = {
      '.js': 'fa-brands fa-square-js',
      '.html': 'fa-brands fa-html5',
      '.css': 'fa-brands fa-css3',
      '.txt': 'fa-solid fa-file',
      '.php': 'fa-brands fa-php',
      '.swift': 'fa-brands fa-swift',
      '.py': 'fa-brands fa-python',
    };

    const defaultIcon = 'fa-solid fa-file';
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(fileExtension);
    const iconClass = isImage ? 'fa-solid fa-image' : iconMap[fileExtension] || defaultIcon;
    icon.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;

    const name = document.createElement('span');
    name.classList.add('file-name');
    name.textContent = path.basename(filePath);

    li.appendChild(icon);
    li.appendChild(name);

    li.addEventListener('click', (event) => {
      event.stopPropagation();

      // Supprime la classe "selected-file" de tous les fichiers et dossiers
      const fileList = document.getElementById('fileList');
      const items = fileList.getElementsByClassName('file-item');
      for (const item of items) {
        item.classList.remove('selected-file');
      }

      // Ajoute la classe "selected-file" au fichier sélectionné
      li.classList.add('selected-file');

      // Animer l'apparition du carré vert
      fadeIn(li);

      if (isImage) {
        showImage(filePath);
      } else {
        readFileContent(filePath);
      }
    });

    return li;
  }

  function showImage(imagePath) {
  const fullScreenImage = document.createElement('img');
  fullScreenImage.src = imagePath;
  fullScreenImage.classList.add('full-screen-image');

  document.body.appendChild(fullScreenImage);

  fullScreenImage.addEventListener('click', () => {
  document.body.removeChild(fullScreenImage);
});
}

  function readFileContent(filePath) {
  fs.readFile(filePath, 'utf-8', (err, content) => {
    if (err) {
      console.error(err);
      return;
    }

    currentFilePath = filePath;
    const fileExtension = path.extname(filePath).toLowerCase();
    const language = getLanguageFromExtension(fileExtension);

    monaco.editor.setModelLanguage(editor.getModel(), language);
    editor.setValue(content);

    const fileName = path.basename(filePath);
    document.getElementById('pageTitle').textContent = fileName + ' - OpenLabs';
  });
}

  function saveFileContent(filePath, content) {
    fs.writeFile(filePath, content, 'utf-8', (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log('Le fichier a été sauvegardé.');
    });
  }


  function getLanguageFromExtension(extension) {
  switch (extension) {
  case '.html':
  return 'html';
  case '.css':
  return 'css';
  case '.js':
  return 'javascript';
  case '.java':
  return 'java';
  case '.py':
  return 'python';
  case '.php':
  return 'php';
  case '.cpp':
  return 'cpp';
  case '.c':
  return 'c';
  case '.cs':
  return 'csharp';
  case '.go':
  return 'go';
  case '.rb':
  return 'ruby';
  case '.rs':
  return 'rust';
  case '.swift':
  return 'swift';
  default:
  return 'plaintext';
}
}



  const openFolderBtn = document.getElementById('openFolderBtn');
  openFolderBtn.addEventListener('click', openFolder);

  const createFolderBtn = document.getElementById('createFolderBtn');
  createFolderBtn.addEventListener('click', createFolder);

  const createFileBtn = document.getElementById('createFileBtn');
  createFileBtn.addEventListener('click', createFile);
