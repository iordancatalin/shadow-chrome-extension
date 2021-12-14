const ICON_SOURCE = "https://i.ibb.co/zR1rj2N/output-onlinepngtools.png";
const TEXT = "OPEN IN SHADOW";

// Here we keep the sate of the application, and expose functions used to manipulate data
const dataStore = () => {
  let currentObserver = null;
  let oldLocationHref = null;
  return {
    readOldLocationHref: () => oldLocationHref,
    updateLocationHref: (newLocationHref) =>
      (oldLocationHref = newLocationHref),
    updateCurrentObserver: (newObserver) => {
      currentObserver?.disconnect();
      currentObserver = newObserver;
    },
  };
};

const logErrorAndReturnNull = (error) => {
  console.error(error);
  return null;
};

const queryDOMElementTimes = (selector, times = 20) => {
  let count = 0;

  const selectElement = (resolve, reject) => {
    count++;

    const element = document.querySelector(selector);

    if (element != null) {
      resolve(element);
      return;
    }

    if (count >= times) {
      reject(`Cannot find element for selecter -> ${selector}`);
      return;
    }

    setTimeout(() => selectElement(resolve, reject), 1000);
  };

  return new Promise(selectElement);
};

const createButton = (videoId, hiddenText = false) => {
  const image = document.createElement("img");

  image.src = ICON_SOURCE;
  image.alt = TEXT;
  image.className = "icon-img";

  const buttonText = document.createElement("span");
  buttonText.textContent = TEXT;
  buttonText.className = hiddenText === true ? "d-none" : "button-text";

  const button = document.createElement("button");
  button.appendChild(image);
  button.appendChild(buttonText);
  button.className = "open-button";
  button["data-shadow"] = "shadow-button";

  button.addEventListener("click", () =>
    window.open(
      `https://shadow-web-app.herokuapp.com/player/${videoId}`,
      "_blank"
    )
  );

  return button;
};

const addShadowButtonAndObserve = (
  target,
  hiddenText = false,
  selector = "ytd-thumbnail"
) => {
  const appendShadowButtonToThumbnail = (ytdElement) => {
    if (ytdElement.querySelector("[data-shadow=shadow-button]") == null) {
      const { href: videoURL } = ytdElement.firstElementChild;
      const [, videoId] = videoURL.split("?v=");

      ytdElement.appendChild(createButton(videoId, hiddenText));
    }
  };

  document.querySelectorAll(selector).forEach(appendShadowButtonToThumbnail);

  // No need to observe for changes if target is null
  if (target == null) {
    return null;
  }

  const config = { childList: true };

  const callback = (mutationList) => {
    for (mutation of mutationList) {
      mutation.addedNodes.forEach((element) => {
        element
          .querySelectorAll(selector)
          .forEach(appendShadowButtonToThumbnail);
      });
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(target, config);

  return observer;
};

const handleHomePage = async () => {
  const target = await queryDOMElementTimes(
    "#contents.style-scope.ytd-rich-grid-renderer"
  ).catch(logErrorAndReturnNull);
  return addShadowButtonAndObserve(target);
};

const handleWatchVideoPage = async () => {
  const target = await queryDOMElementTimes(
    "#contents.style-scope.ytd-item-section-renderer"
  ).catch(logErrorAndReturnNull);
  const observer = addShadowButtonAndObserve(target, true);

  // append a shadow button to the video player
  const ytdPlayer = await queryDOMElementTimes("ytd-player#ytd-player").catch(
    logErrorAndReturnNull
  );
  if (ytdPlayer.querySelector("[data-shadow=shadow-button]") == null) {
    const [, videoId] = location.href.split("?v=");
    ytdPlayer.appendChild(createButton(videoId));
  }

  return observer;
};

const handleSearchResultPage = async () => {
  const target = await queryDOMElementTimes(
    "#contents.style-scope.ytd-item-section-renderer"
  ).catch(logErrorAndReturnNull);

  return addShadowButtonAndObserve(target);
};

const handleChannelVideosPage = async () => {
  const target = await queryDOMElementTimes(
    "#items.style-scope.ytd-grid-renderer"
  ).catch(logErrorAndReturnNull);

  return addShadowButtonAndObserve(target);
};

const handleChannelPlaystisPage = () => {
  return addShadowButtonAndObserve(null, false, "ytd-playlist-thumbnail");
};

const addShadowButtonsForCurrentPage = async () => {
  // we are on the home page
  if (location.href === "https://www.youtube.com/") {
    return await handleHomePage();
  }

  // we are watching a video
  if (location.href.includes("watch?v") === true) {
    return await handleWatchVideoPage();
  }

  // we are on the search results page
  if (location.href.includes("/results?search_query=") === true) {
    return await handleSearchResultPage();
  }

  // we are on the videos page of a channel
  if (
    (location.href.indexOf("/c/") !== -1 ||
      location.href.indexOf("/channel/") !== -1) &&
    location.href.endsWith("/videos") === true
  ) {
    return await handleChannelVideosPage();
  }

  // we are on the playlists page of a channel
  if (
    (location.href.indexOf("/c/") !== -1 ||
      location.href.indexOf("/channel/") !== -1) &&
    location.href.endsWith("/playlists") === true
  ) {
    return handleChannelPlaystisPage();
  }

  // default case: add button for existing ytd-thumbnails
  return addShadowButtonAndObserve(null);
};

// This executes when the scprit is loaded
(async function () {
  const { updateLocationHref, readOldLocationHref, updateCurrentObserver } =
    dataStore();

  // Check every second if the url changed
  // TODO: Find a better way to check if the url changed. Maybe listen to an event instead of of checking at every second.
  setInterval(async () => {
    if (readOldLocationHref() !== location.href) {
      updateLocationHref(location.href);
      updateCurrentObserver(await addShadowButtonsForCurrentPage());
    }
  }, 1000);

  let timeoutId = null;

  window.addEventListener("resize", async () => {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(
      async () => updateCurrentObserver(await addShadowButtonsForCurrentPage()),
      300
    );
  });
})();
