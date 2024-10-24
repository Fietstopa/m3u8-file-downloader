const fs = require("fs");
const path = require("path");
const axios = require("axios");
const m3u8Parser = require("m3u8-parser");
const m3u8URL =
  "https://ashdi.vip/video28/1/serials/pustitisya_berega_s1/breaking.bad.s01e01.720p.bdrip.ukr.eng_4851/hls/720/AamXiXSRmeNCmw8=/index.m3u8";

const outputPath = path.join(__dirname, "downloaded_video.ts");

async function downloadVideo(m3u8URL, outputPath) {
  try {
    const response = await axios.get(m3u8URL);
    const playlistData = response.data;

    const parser = new m3u8Parser.Parser();
    parser.push(playlistData);
    parser.end();

    const segments = parser.manifest.segments.map((segment) => {
      if (segment.uri.startsWith("http")) {
        return segment.uri;
      } else {
        return new URL(segment.uri, m3u8URL).href;
      }
    });

    console.log(`Found ${segments.length} segments. Starting download...`);

    const writer = fs.createWriteStream(outputPath);
    for (const [index, segmentURL] of segments.entries()) {
      const segmentResponse = await axios({
        method: "get",
        url: segmentURL,
        responseType: "stream",
      });

      segmentResponse.data.pipe(writer, { end: false });

      await new Promise((resolve, reject) => {
        segmentResponse.data.on("end", () => {
          console.log(`Downloaded segment ${index + 1}`);
          resolve();
        });
        segmentResponse.data.on("error", reject);
      });
    }

    writer.end(() => {
      console.log(`All segments downloaded successfully`);
    });
  } catch (error) {
    console.error("Error downloading video:", error.message);
  }
}

downloadVideo(m3u8URL, outputPath);
