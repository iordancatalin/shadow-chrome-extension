const constants = {
  iconSource: "https://i.ibb.co/zR1rj2N/output-onlinepngtools.png",
  buttonText: "OPEN IN SHADOW",
  shadowAppURL: "https://shadow-web-app.herokuapp.com/player/",
};

const createOnclickHandler = (videoId) => () =>
  window.open(`${constants.shadowAppURL}${videoId}`, "_blank");

const createButton = (videoId, hiddenText = false) => {
  const image = document.createElement("img");
  image.src = constants.iconSource;
  image.alt = constants.buttonText;
  image.classList.add("icon-img");

  const buttonText = document.createElement("span");
  buttonText.textContent = constants.buttonText;
  buttonText.className = hiddenText === true ? "d-none" : "button-text";

  const button = document.createElement("button");
  button.classList.add("open-button");

  button.setAttribute("data-shadow", "shadow-button");
  button.setAttribute("videoid", videoId);

  button.onclick = createOnclickHandler(videoId);

  // append childs
  button.appendChild(image);
  button.appendChild(buttonText);

  return button;
};

const findVideoIdInYtdThumbnail = (ytdThumbnail) => {
  const { href: videoURL } = ytdThumbnail.firstElementChild;
  const [, videoId] = videoURL.split("?v=");

  return videoId;
};

const appendButtonToYtdThumbnail = (ytdThumbnail) => {
  const videoId = findVideoIdInYtdThumbnail(ytdThumbnail);

  if (videoId == null) {
    return;
  }

  const existingButton = ytdThumbnail.querySelector(
    "[data-shadow=shadow-button]"
  );

  if (
    existingButton != null &&
    existingButton.getAttribute("videoid") !== videoId
  ) {
    existingButton.onclick = createOnclickHandler(videoId);
  } else if (existingButton == null) {
    const hiddenText = ytdThumbnail.classList.contains(
      "ytd-compact-video-renderer"
    );
    ytdThumbnail.appendChild(createButton(videoId, hiddenText));
  }
};

const processBatch = (elements, offset, batchSize, processor) => {
  setTimeout(() => {
    const endIndex =
      offset + batchSize <= elements.length - 1
        ? offset + batchSize
        : elements.length - 1;

    for (let index = offset; index <= endIndex; index++) {
      if (elements[index] != null) {
        processor?.(elements[index]);
      }
    }
  });
};

const processYtdThumbnails = () => {
  const ytdThumbnails =
    document.querySelectorAll("ytd-thumbnail, ytd-playlist-thumbnail") ?? [];
  const batchSize = 20;
  let offset = 0;

  while (offset < ytdThumbnails.length) {
    processBatch(ytdThumbnails, offset, batchSize, appendButtonToYtdThumbnail);

    offset += batchSize;
  }
};

const processPlayingVideo = () => {
  const youtubePlayer = document.querySelector("ytd-player#ytd-player");
  const existingButton = youtubePlayer.querySelector(
    "[data-shadow=shadow-button]"
  );
  const [, videoId] = location.href.split("?v=");

  if (
    existingButton != null &&
    existingButton.getAttribute("videoid") !== videoId
  ) {
    existingButton.onclick = createOnclickHandler(videoId);
  } else if (existingButton == null) {
    youtubePlayer.appendChild(createButton(videoId));
  }
};

(function () {
  let timeoutId = null;

  const bodyObserver = new MutationObserver(() => {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      processYtdThumbnails();

      // user is watching a video
      if (location.href.includes("watch?v") === true) {
        processPlayingVideo();
      }
    }, 500);
  });

  bodyObserver.observe(document.body, {
    subtree: true,
    childList: true,
  });
})();
