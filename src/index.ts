import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import YouTube from "youtube-sr";
import ytdl from "ytdl-core";

const app = new Hono();

app.get("/:name", async(c)  => {
  let listOfIds = [] as string[];
  const query =
    "https://www.youtube.com/playlist?list=PLNKs8mJ6MlqAx7nqsUi6tRJFDFBJxuLiV";

  let videoData = await YouTube.getPlaylist(query, { fetchAll: true });
  videoData.videos.forEach((video) => {
    listOfIds.push(video.id as string);
  });

  let currentVideoIndex = 0;
  let audio = await getAudioFromVideoId(listOfIds[currentVideoIndex]);

  setInterval(async () => {
    let videoInfo = await ytdl.getInfo(listOfIds[currentVideoIndex]);
    let videoLength = Number(videoInfo.videoDetails.lengthSeconds);

    setTimeout(async () => {
      currentVideoIndex++;
      if (currentVideoIndex >= listOfIds.length) {
        currentVideoIndex = 0; // loop back to the start
      }
      audio = await getAudioFromVideoId(listOfIds[currentVideoIndex]);
    }, videoLength * 1000); // videoLength is in seconds, so multiply by 1000 to get milliseconds
  }, 0);
  let dataBuffer = await fetch(audio as string,{
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "inline",
    },
  });
  
  c.res.headers.append("Content-Type", "audio/mpeg");
  c.res.headers.append("Content-Disposition", "inline");
  // c.response.setHeader('Content-Disposition', 'inline');
  // c.response.send(audio);
return c.body(dataBuffer.body);
});

async function getAudioFromVideoId(videoId: string) {
  let info = await ytdl.getInfo(videoId);
  let audioFormat = info.formats.find(
    (format) => format.mimeType && format.mimeType.includes("audio")
  );
  return audioFormat ? audioFormat.url : null;
}

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
