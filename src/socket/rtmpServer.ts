// @ts-ignore - node-media-server types not available
import NodeMediaServer from "node-media-server";
import config from "../config";
import Podcast, { PodcastStatus } from "../app/modules/podcast/podcast.model";
import audioStreamService from "../app/modules/podcast/audioStreamService";
import fs from "fs";
import path from "path";

/**
 * RTMP Media Server Configuration for OBS Streaming
 * Allows broadcasters to use OBS Studio to stream audio/video
 */
export function initializeRTMPServer(io: any): NodeMediaServer {
  // Ensure media directory exists
  const mediaRoot = path.join(process.cwd(), "media");
  if (!fs.existsSync(mediaRoot)) {
    fs.mkdirSync(mediaRoot, { recursive: true });
    console.log("[RTMP] Created media directory:", mediaRoot);
  }

  const rtmpConfig = {
    rtmp: {
      port: config.rtmp.port,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    },
    http: {
      port: config.rtmp.httpPort,
      allow_origin: "*",
      mediaroot: mediaRoot,
    },
    trans: {
      ffmpeg: config.rtmp.ffmpegPath,
      tasks: [
        {
          app: "live",
          hls: true,
          hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
          dash: false,
          // For audio-only streams, add a black video track
          mp4: false,
          mp4Flags: "",
        },
      ],
    },
    logType: 3, // Enable detailed logging
  };

  const nms = new NodeMediaServer(rtmpConfig);

  // Handle stream publish (when OBS starts streaming)
  nms.on("prePublish", async (id: any, streamPath: any, args: any) => {
    // node-media-server passes session object as first param when using event emitter
    const sessionId = typeof id === "string" ? id : id?.id;
    const actualStreamPath =
      typeof id === "string" ? streamPath : id?.streamPath;

    console.log("[RTMP] Pre-publish:", {
      sessionId,
      streamPath: actualStreamPath,
    });

    // Extract stream key from path: /live/STREAM_KEY
    const streamKey = actualStreamPath?.split("/").pop();

    if (!streamKey) {
      console.error("[RTMP] Invalid stream path:", actualStreamPath);
      return;
    }

    try {
      // Find podcast by stream key (check both liveSessionId and ivsStreamKey)
      const podcast = await Podcast.findOne({
        $or: [
          { liveSessionId: streamKey, status: PodcastStatus.LIVE },
          { ivsStreamKey: streamKey, status: PodcastStatus.LIVE },
        ],
      });

      if (!podcast) {
        console.error("[RTMP] Unauthorized stream key:", streamKey);

        // Debug: Check if podcast exists with this key but wrong status
        const anyPodcast = await Podcast.findOne({
          $or: [{ liveSessionId: streamKey }, { ivsStreamKey: streamKey }],
        });

        if (anyPodcast) {
          console.error(
            `[RTMP] Found podcast "${anyPodcast.title}" but status is "${anyPodcast.status}" (needs to be "live")`
          );
          console.error(
            "[RTMP] Please call POST /api/v1/podcasts/:id/start endpoint first"
          );
        } else {
          console.error(
            "[RTMP] No podcast found with this stream key in database"
          );
        }

        // Reject unauthorized streams by closing the session
        if (typeof id === "object" && id?.close) {
          id.close();
        }
        return;
      }

      console.log(`[RTMP] Stream authorized for podcast: ${podcast.title}`);

      // Start recording if enabled
      if (podcast.isRecording) {
        audioStreamService.startRecording(streamKey, "mp3");
      }

      // Notify listeners via Socket.IO
      if (io) {
        io.of("/podcast").emit("stream-started", {
          podcastId: (podcast._id as any).toString(),
          title: podcast.title,
          streamKey,
        });
      }
    } catch (error) {
      console.error("[RTMP] Error during pre-publish:", error);
    }
  });

  // Handle stream publish done (when OBS stops streaming)
  nms.on("donePublish", async (id: any, streamPath: any, args: any) => {
    // node-media-server passes session object as first param
    const sessionId = typeof id === "string" ? id : id?.id;
    const actualStreamPath =
      typeof id === "string" ? streamPath : id?.streamPath;

    console.log("[RTMP] Done publish:", {
      sessionId,
      streamPath: actualStreamPath,
    });

    const streamKey = actualStreamPath?.split("/").pop();

    if (!streamKey) return;

    try {
      const podcast = await Podcast.findOne({
        $or: [
          { liveSessionId: streamKey, status: PodcastStatus.LIVE },
          { ivsStreamKey: streamKey, status: PodcastStatus.LIVE },
        ],
      });

      if (podcast) {
        console.log(`[RTMP] Stream ended for podcast: ${podcast.title}`);

        // Upload recording to GCS
        if (podcast.isRecording) {
          try {
            const uploadResult =
              await audioStreamService.stopRecordingAndUpload(
                streamKey,
                (podcast._id as any).toString(),
                podcast.title
              );

            podcast.recordedAudioUrl = uploadResult.publicUrl;
            podcast.recordedFileName = uploadResult.fileName;
            podcast.audioSize = uploadResult.fileSize;
          } catch (error) {
            console.error("[RTMP] Error uploading recording:", error);
          }
        }

        // Update podcast status
        podcast.status = PodcastStatus.ENDED;
        podcast.actualEnd = new Date();
        if (podcast.actualStart) {
          podcast.duration = Math.round(
            (podcast.actualEnd.getTime() - podcast.actualStart.getTime()) /
              60000
          );
        }
        await podcast.save();

        // Notify listeners
        if (io) {
          io.of("/podcast").emit("stream-ended", {
            podcastId: (podcast._id as any).toString(),
            recordedUrl: podcast.recordedAudioUrl,
          });
        }
      }
    } catch (error) {
      console.error("[RTMP] Error during done-publish:", error);
    }
  });

  // Log connections
  nms.on("preConnect", (id: string, args: any) => {
    console.log("[RTMP] Client connecting:", id);
  });

  nms.on("postConnect", (id: string, args: any) => {
    console.log("[RTMP] Client connected:", id);
  });

  nms.on("doneConnect", (id: string, args: any) => {
    console.log("[RTMP] Client disconnected:", id);
  });

  // Log transcoding events
  nms.on("transStart", (id: any, streamPath: any, args: any) => {
    const actualPath = typeof id === "string" ? streamPath : id?.streamPath;
    console.log("[RTMP] ✓ HLS Transcoding started for:", actualPath);
  });

  nms.on("transDone", (id: any, streamPath: any, args: any) => {
    const actualPath = typeof id === "string" ? streamPath : id?.streamPath;
    console.log("[RTMP] HLS Transcoding ended for:", actualPath);
  });

  return nms;
}

/**
 * Generate RTMP stream URLs for OBS configuration
 */
export function generateRTMPUrls(streamKey: string): {
  rtmpUrl: string;
  streamKey: string;
  hlsPlaybackUrl: string;
} {
  const serverUrl = config.serverUrl.replace(/^https?:\/\//, "");
  const rtmpPort = config.rtmp.port;
  const httpPort = config.rtmp.httpPort;

  return {
    rtmpUrl: `rtmp://${serverUrl}:${rtmpPort}/live`,
    streamKey: streamKey,
    hlsPlaybackUrl: `http://${serverUrl}:${httpPort}/live/${streamKey}/index.m3u8`,
  };
}
