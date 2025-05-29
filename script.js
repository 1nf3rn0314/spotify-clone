let currentSong = new Audio();
// let currentSongTitle;
let lastSetVolume;
let isHamOpen = false;
let songs;
let currFolder;

function pad(n) {
  return ("0" + n.toString()).slice(-2);
}

function prettyPrintTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  let mins = Math.floor(seconds / 60);
  let secs = Math.round(60 * ((seconds / 60) - mins));
  return pad(mins) + ":" + pad(secs);
}

async function getAlbums() {
  let albums_raw = await fetch("/songs/");
  let tmp = document.createElement("div");
  tmp.innerHTML = await albums_raw.text();
  let eles = Array.from(tmp.getElementsByTagName("a"));
  eles.shift();
  let albums = [];
  eles.forEach(album => {
    albums.push(album.innerText.slice(0, album.innerText.length-1));
  });
  return albums;
}

async function getSongs(folder) {
  currFolder = folder + "/";
  let song_req = await fetch("/songs/" + folder);
  let response = await song_req.text();
  let tmpDiv = document.createElement("div");
  tmpDiv.innerHTML = response;
  let as = tmpDiv.getElementsByTagName("a");
  let song_list = Array.from(as);
  song_list.shift();
  let songs = [];
  song_list.forEach(song => {
    if (song.innerText.endsWith(".mp3")) {
      songs.push(song.innerText);
    }
  });
  return songs;
}

function createSongCard(title) {
  let tmp = title.split(" - ");
  let song_name = tmp[0];
  let artist_name = tmp[1];
  let html = `
  <img class="" src="assets/cd.svg" width="36px" alt="music">
  <div id="song-info">
    <span id="song-info-title">${song_name}</span><br>
    <span id="song-info-artist">${artist_name.slice(0, -4)}</span>
  </div>`
  let element = document.createElement("div");
  element.setAttribute("class", "song-card");
  element.setAttribute("data-song_file", title);
  element.setAttribute("data-song_title", song_name);
  element.setAttribute("data-song_artist", artist_name.slice(0, -4));
  element.innerHTML = html;
  return element;
}

function createAlbumCard(folder) {
  let html = `
  <div id="album-cover">
    <img src="songs/${folder}/cover.jpeg" alt="cover">
    <div id="play-btn"><img style="width: 55%;" src="assets/play.svg" alt=""></div>
  </div>
  <div id="album-artists">${folder}</div>`;
  // let container = document.querySelector(".spotify-playlists");
  let album = document.createElement("div");
  album.setAttribute("class", "album-card");
  album.setAttribute("data-albumname", folder);
  album.innerHTML = html;
  return album;
}

function playSong(songCard, play=true) {
  currentSong.src = `songs/${currFolder}`.concat(songCard.dataset.song_file);
  currentSong.volume = document.getElementById("volume").value / 100;
  if (play) {
    currentSong.play();
    document.getElementById("play").src = "assets/pause.svg";
    songCard.getElementsByTagName("img")[0].classList.add("rotate");
  }
  document.getElementById("current-song-title").innerHTML = songCard.dataset.song_title;
  document.getElementById("current-song-artist").innerHTML = songCard.dataset.song_artist;
}

function changeVolumeFrom(volume) {
  let volicon = document.getElementById("vol-icon");
  if (volume == 0) {
    volicon.src = "assets/volume-mute.svg";
  } else if (volume >= 1 && volume <= 33) {
    volicon.src = "assets/volume-low.svg";
  } else if (volume >= 34 && volume <= 66) {
    volicon.src = "assets/volume-med.svg";
  } else {
    volicon.src = "assets/volume-high.svg";
  }
}

async function loadSongsFromAlbum(album) {
  songs = await getSongs(album);
  let unit = (songs.length == 1) ? "song" : "songs";
  document.getElementsByTagName("b")[0].innerHTML = `${album} (${songs.length} ${unit})`;
  let container = document.querySelector(".left-content");
  container.innerHTML = "";
  songs.forEach(song => {
    container.append(createSongCard(song));
  });
}

(async function main() {
  let albums = await getAlbums();
  let playlists = document.querySelector(".spotify-playlists");
  albums.forEach(album => {
    playlists.append(createAlbumCard(album));
  });

  let album_cards = document.querySelectorAll(".album-card");
  album_cards.forEach((albumCard) => {
    albumCard.addEventListener("mouseover", () => {
      albumCard.querySelector("#play-btn").style.opacity = 1;
      albumCard.querySelector("#play-btn").style.bottom = "20px";
    });
    albumCard.addEventListener("mouseout", () => {
      albumCard.querySelector("#play-btn").style.opacity = 0;
      albumCard.querySelector("#play-btn").style.bottom = "10px";
    });
    albumCard.querySelector("#play-btn").addEventListener("click", async () => {
      await loadSongsFromAlbum(albumCard.dataset.albumname);
      let songCardArr = Array.from(document.querySelector(".left-content").getElementsByClassName("song-card"));
      playSong(songCardArr[0]);
      songCardArr.forEach(songCard => {
        songCard.addEventListener("click", () => {
          playSong(songCard);
          songCard.getElementsByTagName("img")[0].classList.add("rotate");
        });
      });
    });
  });  

  await loadSongsFromAlbum(albums[0]);
  let songCardArr = Array.from(document.querySelector(".left-content").getElementsByClassName("song-card"));
  playSong(songCardArr[0], false);
  
  songCardArr.forEach(songCard => {
    songCard.addEventListener("click", () => {
      playSong(songCard);
      songCard.getElementsByTagName("img")[0].classList.add("rotate");
    });
  });

  const playPauseHandler = () => {
    if (currentSong.src != "") {
      if (currentSong.paused) {
        currentSong.play();
        document.getElementById("play").src = "assets/pause.svg";
      } else {
        currentSong.pause();
        document.getElementById("play").src = "assets/control_play.svg";
      }
    }
  }

  document.getElementById("play").addEventListener("click", () => {
    playPauseHandler();
    if (currentSong.paused) {
      document.querySelector(".rotate").classList.remove("rotate");
    } else {
      document.querySelector(".song-card").children[0].classList.add("rotate");
    }
  });

  let progressBar = document.getElementById("songPlayedDuration");

  currentSong.addEventListener("timeupdate", () => {
    document.getElementById("currentTime").innerHTML = prettyPrintTime(currentSong.currentTime);
    document.getElementById("duration").innerHTML = prettyPrintTime(currentSong.duration);
    progressBar.value = (currentSong.currentTime / currentSong.duration) * 100;
  });

  currentSong.addEventListener("ended", () => {
    document.getElementById("play").src = "assets/control_play.svg";
    document.querySelector(".rotate").classList.remove("rotate");
  });

  progressBar.addEventListener("input", () => {
    currentSong.currentTime = (progressBar.value / 100) * currentSong.duration;
    document.getElementById("currentTime").innerHTML = prettyPrintTime(currentSong.currentTime);
  });

  let vol = document.getElementById("volume");
  let volicon = document.getElementById("vol-icon");

  volicon.addEventListener("click", () => {
    if (vol.value != 0) {
      lastSetVolume = vol.value;
      volicon.src = "assets/volume-mute.svg";
      vol.value = 0;
    } else {
      vol.value = (lastSetVolume == 0 ? 0.5 : lastSetVolume);
      changeVolumeFrom(lastSetVolume);
    }
    currentSong.volume = vol.value / 100;
  });

  vol.addEventListener("input", () => {
    changeVolumeFrom(vol.value);
    currentSong.volume = vol.value / 100;
  });

  let ham = document.getElementById("ham-menu");
  ham.addEventListener("click", () => {
    if (isHamOpen) {
      document.querySelector(".left").style.left = "-100%";
      ham.src = "assets/hamburger.svg";
    } else {
      document.querySelector(".left").style.left = "0%";
      ham.src = "assets/close.svg";
    }
    isHamOpen = !isHamOpen;
  });

  document.addEventListener("keypress", event => {
    if (event.code == "Space") {
      playPauseHandler();
      if (currentSong.paused) {
        document.querySelector(".rotate").classList.remove("rotate");
      } else {
        document.querySelector(".song-card").children[0].classList.add("rotate");
      }
    } else if (event.code == "Equal") {
      if (vol.value <= 90) vol.value += 10;
      changeVolumeFrom(vol.value);
      currentSong.volume = vol.value / 100;
    } else if (event.code == "Minus") {
      if (vol.value >= 10) vol.value -= 10;
      changeVolumeFrom(vol.value);
      currentSong.volume = vol.value / 100;
    } else if (event.code == "KeyM") {
      if (vol.value != 0) {
        lastSetVolume = vol.value;
        volicon.src = "assets/volume-mute.svg";
        vol.value = 0;
      } else {
        vol.value = lastSetVolume;
        changeVolumeFrom(lastSetVolume);
      }
      currentSong.volume = vol.value / 100;
    }
  });

  prev.addEventListener("click", async () => {
    let l = currentSong.src.split("/");
    songs = await getSongs(currFolder);
    let oldSongCard = songCardArr[songs.indexOf(decodeURI(l[l.length-1]))];
    let newSongCard = songCardArr[(songs.indexOf(decodeURI(l[l.length-1])) + (songCardArr.length - 1)) % songCardArr.length];
    playSong(newSongCard);
    oldSongCard.getElementsByTagName("img")[0].classList.remove("rotate");
    newSongCard.getElementsByTagName("img")[0].classList.add("rotate");
  });

  next.addEventListener("click", async () => {
    let l = currentSong.src.split("/");
    songs = await getSongs(currFolder);
    let oldSongCard = songCardArr[songs.indexOf(decodeURI(l[l.length-1]))];
    let newSongCard = songCardArr[(songs.indexOf(decodeURI(l[l.length-1])) + 1) % songCardArr.length];
    playSong(newSongCard);
    oldSongCard.getElementsByTagName("img")[0].classList.remove("rotate");
    newSongCard.getElementsByTagName("img")[0].classList.add("rotate");
  });
})();
