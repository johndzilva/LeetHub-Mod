/* Enum for languages supported by LeetCode. */
const languages = {
  Python: '.py',
  Python3: '.py',
  'C++': '.cpp',
  C: '.c',
  Java: '.java',
  'C#': '.cs',
  JavaScript: '.js',
  Javascript: '.js',
  Ruby: '.rb',
  Swift: '.swift',
  Go: '.go',
  Kotlin: '.kt',
  Scala: '.scala',
  Rust: '.rs',
  PHP: '.php',
  TypeScript: '.ts',
  MySQL: '.sql',
  'MS SQL Server': '.sql',
  Oracle: '.sql',
};

// problem types
const NORMAL_PROBLEM = 0;
const EXPLORE_SECTION_PROBLEM = 1;

/* Difficulty of most recenty submitted question */
let difficulty = '';

/* state of upload for progress */
let uploadState = { uploading: false };

/* Get file extension for submission */
function findLanguage() {
  const tag = [
    ...document.getElementsByClassName(
      'ant-select-selection-selected-value',
    ),
    ...document.getElementsByClassName('Select-value-label'),
  ];
  if (tag && tag.length > 0) {
    for (let i = 0; i < tag.length; i += 1) {
      const elem = tag[i].textContent;
      if (elem !== undefined && languages[elem] !== undefined) {
        return languages[elem]; // should generate respective file extension
      }
    }
  }
  return null;
}

// Getting the code and commit message info
const getCodeAndMsg = async (msg) => {
  /* Get the submission details url from the submission page. */
  let submissionURL;
  const e = document.getElementsByClassName('status-column__3SUg');
  if (checkElem(e)) {
    // for normal problem submisson
    const submissionRef = e[1].innerHTML.split(' ')[1];
    submissionURL =
      'https://leetcode.com' +
      submissionRef.split('=')[1].slice(1, -1);
  } else {
    // for a submission in explore section
    const submissionRef = document.getElementById('result-state');
    submissionURL = submissionRef.href;
  }

  if (submissionURL != undefined) {
    let res = await fetch(submissionURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
      },
    });

    let respText = await res.text();

    var doc = new DOMParser().parseFromString(respText, 'text/html');
    var scripts = doc.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var text = scripts[i].innerText;
      if (text.includes('pageData')) {
        /* Considering the pageData as text and extract the substring
            which has the full code */
        var firstIndex = text.indexOf('submissionCode');
        var lastIndex = text.indexOf('editCodeUrl');
        var slicedText = text.slice(firstIndex, lastIndex);
        /* slicedText has code as like as. (submissionCode: 'Details code'). */
        /* So finding the index of first and last single inverted coma. */
        var firstInverted = slicedText.indexOf("'");
        var lastInverted = slicedText.lastIndexOf("'");
        /* Extract only the code */
        var codeUnicoded = slicedText.slice(
          firstInverted + 1,
          lastInverted,
        );
        /* The code has some unicode. Replacing all unicode with actual characters */
        var code = codeUnicoded.replace(
          /\\u[\dA-F]{4}/gi,
          function (match) {
            return String.fromCharCode(
              parseInt(match.replace(/\\u/g, ''), 16),
            );
          },
        );

        /* for a submisssion in explore section we do not get probStat beforehand
        so, parse statistics from submisson page */
        if (!msg) {
          slicedText = text.slice(
            text.indexOf('runtime'),
            text.indexOf('memory'),
          );
          const resultRuntime = slicedText.slice(
            slicedText.indexOf("'") + 1,
            slicedText.lastIndexOf("'"),
          );
          slicedText = text.slice(
            text.indexOf('memory'),
            text.indexOf('total_correct'),
          );
          const resultMemory = slicedText.slice(
            slicedText.indexOf("'") + 1,
            slicedText.lastIndexOf("'"),
          );
          msg = `Time: ${resultRuntime}, Memory: ${resultMemory}`;
        }

        if (code !== null) {
          return { code, msg };
        }
      }
    }
  }
};

/* Main parser function for the code */
function parseCode() {
  const e = document.getElementsByClassName('CodeMirror-code');
  if (e !== undefined && e.length > 0) {
    const elem = e[0];
    let parsedCode = '';
    const textArr = elem.innerText.split('\n');
    for (let i = 1; i < textArr.length; i += 2) {
      parsedCode += `${textArr[i]}\n`;
    }
    return parsedCode;
  }
  return null;
}

/* Util function to check if an element exists */
function checkElem(elem) {
  return elem && elem.length > 0;
}
function convertToSlug(string) {
  const a =
    'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
  const b =
    'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

function getProblemNameSlug() {
  const questionElem = document.getElementsByClassName(
    'content__u3I1 question-content__JfgR',
  );
  const questionDescriptionElem = document.getElementsByClassName(
    'question-description__3U1T',
  );
  let questionTitle = 'unknown-problem';
  if (checkElem(questionElem)) {
    let qtitle = document.getElementsByClassName('css-v3d350');
    if (checkElem(qtitle)) {
      questionTitle = qtitle[0].innerHTML;
    }
  } else if (checkElem(questionDescriptionElem)) {
    let qtitle = document.getElementsByClassName('question-title');
    if (checkElem(qtitle)) {
      questionTitle = qtitle[0].innerText;
    }
  }
  return convertToSlug(questionTitle);
}

/* Parser function for the question and tags */
function parseQuestion() {
  var questionUrl = window.location.href;
  if (questionUrl.endsWith('/submissions/')) {
    questionUrl = questionUrl.substring(
      0,
      questionUrl.lastIndexOf('/submissions/') + 1,
    );
  }
  const questionElem = document.getElementsByClassName(
    'content__u3I1 question-content__JfgR',
  );
  const questionDescriptionElem = document.getElementsByClassName(
    'question-description__3U1T',
  );
  if (checkElem(questionElem)) {
    const qbody = questionElem[0].innerHTML;

    // Problem title.
    let qtitle = document.getElementsByClassName('css-v3d350');
    if (checkElem(qtitle)) {
      qtitle = qtitle[0].innerHTML;
    } else {
      qtitle = 'unknown-problem';
    }

    // Problem difficulty, each problem difficulty has its own class.
    const isHard = document.getElementsByClassName('css-t42afm');
    const isMedium = document.getElementsByClassName('css-dcmtd5');
    const isEasy = document.getElementsByClassName('css-14oi08n');

    if (checkElem(isEasy)) {
      difficulty = 'Easy';
    } else if (checkElem(isMedium)) {
      difficulty = 'Medium';
    } else if (checkElem(isHard)) {
      difficulty = 'Hard';
    }
    // Final formatting of the contents of the README for each problem
    const markdown = `<h2><a href="${questionUrl}">${qtitle}</a></h2><h3>${difficulty}</h3><hr>${qbody}`;
    return markdown;
  } else if (checkElem(questionDescriptionElem)) {
    let questionTitle = document.getElementsByClassName(
      'question-title',
    );
    if (checkElem(questionTitle)) {
      questionTitle = questionTitle[0].innerText;
    } else {
      questionTitle = 'unknown-problem';
    }

    const questionBody = questionDescriptionElem[0].innerHTML;
    const markdown = `<h2>${questionTitle}</h2><hr>${questionBody}`;

    return markdown;
  }

  return null;
}

/* Parser function for time/space stats */
function parseStats() {
  const probStats = document.getElementsByClassName('data__HC-i');
  if (!checkElem(probStats)) {
    return null;
  }
  const time = probStats[0].textContent;
  const timePercentile = probStats[1].textContent;
  const space = probStats[2].textContent;
  const spacePercentile = probStats[3].textContent;

  // Format commit message
  return `Time: ${time} (${timePercentile}), Space: ${space} (${spacePercentile})`;
}

document.addEventListener('click', (event) => {
  const element = event.target;
  const oldPath = window.location.pathname;

  /* Act on Post button click */
  /* Complex since "New" button shares many of the same properties as "Post button */
  if (
    element.classList.contains('icon__3Su4') ||
    element.parentElement.classList.contains('icon__3Su4') ||
    element.parentElement.classList.contains(
      'btn-content-container__214G',
    ) ||
    element.parentElement.classList.contains('header-right__2UzF')
  ) {
    setTimeout(function () {
      /* Only post if post button was clicked and url changed */
      if (
        oldPath !== window.location.pathname &&
        oldPath ===
          window.location.pathname.substring(0, oldPath.length) &&
        !Number.isNaN(window.location.pathname.charAt(oldPath.length))
      ) {
        const date = new Date();
        const currentDate = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} at ${date.getHours()}:${date.getMinutes()}`;
        const addition = `[Discussion Post (created on ${currentDate})](${window.location})  \n`;
        const problemName = window.location.pathname.split('/')[2]; // must be true.

        uploadGit(
          addition,
          problemName,
          'README.md',
          discussionMsg,
          'update',
        );
      }
    }, 1000);
  }
});

/* function to get the notes if there is any
 the note should be opened atleast once for this to work
 this is because the dom is populated after data is fetched by opening the note */
const getNotesIfAny = () => {
  // there are no notes on expore
  if (document.URL.startsWith('https://leetcode.com/explore/'))
    return '';

  notes = '';
  if (
    checkElem(document.getElementsByClassName('notewrap__eHkN')) &&
    checkElem(
      document
        .getElementsByClassName('notewrap__eHkN')[0]
        .getElementsByClassName('CodeMirror-code'),
    )
  ) {
    notesdiv = document
      .getElementsByClassName('notewrap__eHkN')[0]
      .getElementsByClassName('CodeMirror-code')[0];
    if (notesdiv) {
      for (i = 0; i < notesdiv.childNodes.length; i++) {
        if (notesdiv.childNodes[i].childNodes.length == 0) continue;
        text = notesdiv.childNodes[i].childNodes[0].innerText;
        if (text) {
          notes = `${notes}\n${text.trim()}`.trim();
        }
      }
    }
  }
  return notes.trim();
};

const getMainSHA = async (hook, token) => {
  const mainRefURL = `https://api.github.com/repos/${hook}/git/refs/heads/main`;
  let mainSHA = '';

  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token}`);

  try {
    const mainRef = await fetch(mainRefURL, {
      method: 'GET',
      headers: headers,
    });
    mainSHA = (await mainRef.json()).object.sha;
  } catch (error) {
    console.error('Error fetching main ref', error);
  }

  return mainSHA;
};

// creates a blob and returns the sha of the created blob
const createBlob = async (hook, token, content, encoding) => {
  const createBlobURL = `https://api.github.com/repos/${hook}/git/blobs`;
  let blobSHA = '';

  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token}`);

  const body = {
    content: content,
    encoding: encoding,
  };

  try {
    const blob = await fetch(createBlobURL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    blobSHA = (await blob.json()).sha;
  } catch (error) {
    console.error('Error creating blob', error);
  }

  return blobSHA;
};

const uploadGitV2 = async (
  problemName,
  fileName,
  readme,
  notes,
  code,
  msg,
  callback = undefined,
) => {
  await chrome.storage.local.get(
    ['leethub_token', 'mode_type', 'leethub_hook', 'stats'],
    async (res) => {
      const token = res.leethub_token;
      const mode = res.mode_type;
      const hook = res.leethub_hook;
      const stats = res.stats;

      if (token && mode && hook) {
        let tree = [];
        let mainSHA = await getMainSHA(hook, token);
        let markdownSHA = await createBlob(
          hook,
          token,
          readme,
          'utf-8',
        );
        // btoa(unescape(encodeURIComponent(notes)))
        if (notes.length > 1) {
          let notesSHA = await createBlob(
            hook,
            token,
            notes,
            'utf-8',
          );
        }

        let codeSHA = await createBlob(hook, token, code, 'utf-8');

        tree.push(
          {
            path: `${difficulty}/${problemName}/${fileName}`,
            mode: '100644',
            type: 'blob',
            sha: codeSHA,
          },
          {
            path: `${difficulty}/${problemName}/README.md`,
            mode: '100644',
            type: 'blob',
            sha: markdownSHA,
          },
        );

        if (notes.length > 1) {
          tree.push({
            path: `${difficulty}/${problemName}/NOTES.md`,
            mode: '100644',
            type: 'blob',
            sha: notesSHA,
          });
        }

        // create tree
        const createTreeURL = `https://api.github.com/repos/${hook}/git/trees`;
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);

        const body = {
          base_tree: mainSHA,
          tree: tree,
        };

        try {
          const tree = await fetch(createTreeURL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
          });
          const treeSHA = (await tree.json()).sha;

          // create commit
          const createCommitURL = `https://api.github.com/repos/${hook}/git/commits`;
          const commitBody = {
            message: msg,
            tree: treeSHA,
            parents: [mainSHA],
          };

          const commit = await fetch(createCommitURL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(commitBody),
          });
          const commitSHA = (await commit.json()).sha;

          // update ref
          const updateRefURL = `https://api.github.com/repos/${hook}/git/refs/heads/main`;
          const updateRefBody = {
            sha: commitSHA,
          };

          const updateRef = await fetch(updateRefURL, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(updateRefBody),
          });

          if (updateRef.status === 200) {
            if (
              stats === null ||
              stats === {} ||
              stats === undefined
            ) {
              // create stats object
              stats = {};
              stats.solved = 0;
              stats.easy = 0;
              stats.medium = 0;
              stats.hard = 0;
              stats.sha = {};
            }

            stats.solved += 1;
            stats.easy += difficulty === 'Easy' ? 1 : 0;
            stats.medium += difficulty === 'Medium' ? 1 : 0;
            stats.hard += difficulty === 'Hard' ? 1 : 0;

            const filePath = problemName + fileName;
            stats.sha[filePath] = codeSHA; // update sha key.
            chrome.storage.local.set({ stats }, () => {
              console.log(
                `Successfully committed ${fileName} to github`,
              );
            });

            if (callback !== undefined) callback();
          }
        } catch (error) {
          console.error('Error creating commit', error);
        }
      }
    },
  );
};

const loader = setInterval(async () => {
  let probStatement = null;
  let probStats = null;
  let probType;
  const successTag = document.getElementsByClassName('success__3Ai7');
  const resultState = document.getElementById('result-state');
  var success = false;
  // check success tag for a normal problem
  if (
    checkElem(successTag) &&
    successTag[0].className === 'success__3Ai7' &&
    successTag[0].innerText.trim() === 'Success'
  ) {
    console.log(successTag[0]);
    success = true;
    probType = NORMAL_PROBLEM;
  }

  // check success state for a explore section problem
  else if (
    resultState &&
    resultState.className === 'text-success' &&
    resultState.innerText === 'Accepted'
  ) {
    success = true;
    probType = EXPLORE_SECTION_PROBLEM;
  }

  if (success) {
    probStatement = parseQuestion();
    probStats = parseStats();
  }

  if (probStatement !== null) {
    switch (probType) {
      case NORMAL_PROBLEM:
        successTag[0].classList.add('marked_as_success');
        break;
      case EXPLORE_SECTION_PROBLEM:
        resultState.classList.add('marked_as_success');
        break;
      default:
        console.error(`Unknown problem type ${probType}`);
        return;
    }

    const problemName = getProblemNameSlug();
    const language = findLanguage();
    if (language !== null) {
      // start upload indicator here
      startUpload();
      chrome.storage.local.get('stats', (s) => {
        const { stats } = s;
        const filePath = problemName + problemName + language;
        let sha = null;
        if (
          stats !== undefined &&
          stats.sha !== undefined &&
          stats.sha[filePath] !== undefined
        ) {
          sha = stats.sha[filePath];
        }
      });

      notes = getNotesIfAny();
      let { code, msg } = await getCodeAndMsg(probStats);

      setTimeout(function () {
        uploadGitV2(
          problemName,
          problemName + language,
          probStatement,
          notes,
          code,
          msg,
          () => {
            if (uploadState['countdown'])
              clearTimeout(uploadState['countdown']);
            delete uploadState['countdown'];
            uploadState.uploading = false;
            markUploaded();
          },
        );
      }, 4000);
    }
  }
}, 1000);

/* Since we dont yet have callbacks/promises that helps to find out if things went bad */
/* we will start 10 seconds counter and even after that upload is not complete, then we conclude its failed */
function startUploadCountDown() {
  uploadState.uploading = true;
  uploadState['countdown'] = setTimeout(() => {
    if ((uploadState.uploading = true)) {
      // still uploading, then it failed
      uploadState.uploading = false;
      markUploadFailed();
    }
  }, 10000);
}

/* we will need specific anchor element that is specific to the page you are in Eg. Explore */
function insertToAnchorElement(elem) {
  if (document.URL.startsWith('https://leetcode.com/explore/')) {
    // means we are in explore page
    action = document.getElementsByClassName('action');
    if (
      checkElem(action) &&
      checkElem(action[0].getElementsByClassName('row')) &&
      checkElem(
        action[0]
          .getElementsByClassName('row')[0]
          .getElementsByClassName('col-sm-6'),
      ) &&
      action[0]
        .getElementsByClassName('row')[0]
        .getElementsByClassName('col-sm-6').length > 1
    ) {
      target = action[0]
        .getElementsByClassName('row')[0]
        .getElementsByClassName('col-sm-6')[1];
      elem.className = 'pull-left';
      if (target.childNodes.length > 0)
        target.childNodes[0].prepend(elem);
    }
  } else {
    if (checkElem(document.getElementsByClassName('action__38Xc'))) {
      target = document.getElementsByClassName('action__38Xc')[0];
      elem.className = 'runcode-wrapper__8rXm';
      if (target.childNodes.length > 0)
        target.childNodes[0].prepend(elem);
    }
  }
}

/* start upload will inject a spinner on left side to the "Run Code" button */
function startUpload() {
  try {
    elem = document.getElementById('leethub_progress_anchor_element');
    if (!elem) {
      elem = document.createElement('span');
      elem.id = 'leethub_progress_anchor_element';
      elem.style = 'margin-right: 20px;padding-top: 2px;';
    }
    elem.innerHTML = `<div id="leethub_progress_elem" class="leethub_progress"></div>`;
    target = insertToAnchorElement(elem);
    // start the countdown
    startUploadCountDown();
  } catch (error) {
    // generic exception handler for time being so that existing feature doesnt break but
    // error gets logged
    console.log(error);
  }
}

/* This will create a tick mark before "Run Code" button signalling LeetHub has done its job */
function markUploaded() {
  elem = document.getElementById('leethub_progress_elem');
  if (elem) {
    elem.className = '';
    style =
      'display: inline-block;transform: rotate(45deg);height:24px;width:12px;border-bottom:7px solid #78b13f;border-right:7px solid #78b13f;';
    elem.style = style;
  }
}

/* This will create a failed tick mark before "Run Code" button signalling that upload failed */
function markUploadFailed() {
  elem = document.getElementById('leethub_progress_elem');
  if (elem) {
    elem.className = '';
    style =
      'display: inline-block;transform: rotate(45deg);height:24px;width:12px;border-bottom:7px solid red;border-right:7px solid red;';
    elem.style = style;
  }
}

/* Sync to local storage */
chrome.storage.local.get('isSync', (data) => {
  keys = [
    'leethub_token',
    'leethub_username',
    'pipe_leethub',
    'stats',
    'leethub_hook',
    'mode_type',
  ];
  if (!data || !data.isSync) {
    keys.forEach((key) => {
      chrome.storage.sync.get(key, (data) => {
        chrome.storage.local.set({ [key]: data[key] });
      });
    });
    chrome.storage.local.set({ isSync: true }, (data) => {
      console.log('LeetHub Synced to local values');
    });
  } else {
    console.log('LeetHub Local storage already synced!');
  }
});

// inject the style
injectStyle();

/* inject css style required for the upload progress feature */
function injectStyle() {
  const style = document.createElement('style');
  style.textContent =
    '.leethub_progress {pointer-events: none;width: 2.0em;height: 2.0em;border: 0.4em solid transparent;border-color: #eee;border-top-color: #3E67EC;border-radius: 50%;animation: loadingspin 1s linear infinite;} @keyframes loadingspin { 100% { transform: rotate(360deg) }}';
  document.head.append(style);
}
