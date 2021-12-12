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
      reject(`Cannot fine element for selecter -> ${selector}`);
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

const addShadowButtonAndObserve = (target, hiddenText = false) => {
  const appendShadowButtonToThunbnail = (ytdThumbnail) => {
    if (ytdThumbnail.querySelector("[data-shadow=shadow-button]") == null) {
      const { href: videoURL } = ytdThumbnail.firstElementChild;
      const [, videoId] = videoURL.split("?v=");

      ytdThumbnail.appendChild(createButton(videoId, hiddenText));
    }
  };

  document
    .querySelectorAll("ytd-thumbnail")
    .forEach(appendShadowButtonToThunbnail);

  const config = { childList: true };

  const callback = (mutationList) => {
    for (mutation of mutationList) {
      mutation.addedNodes.forEach((element) => {
        element
          .querySelectorAll("ytd-thumbnail")
          .forEach(appendShadowButtonToThunbnail);
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
  );
  return addShadowButtonAndObserve(target);
};

const handleWatchVideoPage = async () => {
  const target = await queryDOMElementTimes(
    "#contents.style-scope.ytd-item-section-renderer"
  );
  const observer = addShadowButtonAndObserve(target, true);

  // append a shadow button to the video player
  const ytdPlayer = await queryDOMElementTimes("ytd-player#ytd-player");
  if (ytdPlayer.querySelector("[data-shadow=shadow-button]") == null) {
    const [, videoId] = location.href.split("?v=");
    ytdPlayer.appendChild(createButton(videoId));
  }

  return observer;
};

const handleSearchResultPage = async () => {
  const target = await queryDOMElementTimes(
    "#contents.style-scope.ytd-item-section-renderer"
  );

  return addShadowButtonAndObserve(target);
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

  return null;
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
