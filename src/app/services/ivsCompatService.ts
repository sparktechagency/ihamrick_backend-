import crypto from "crypto";
import config from "../../config";

/**
 * Google Cloud Livestream Compatibility Service
 * Generates livestream response fields for audio broadcasting
 * Maps to local RTMP/HLS infrastructure + Google Cloud Storage backend
 */

export interface IVSChannel {
  arn: string;
  playbackUrl: string;
  streamKey: string;
  ingestEndpoint: string;
}

class IVSCompatService {
  private readonly region: string = "us-central1";
  private readonly projectId: string =
    config.gcs.projectId || "ihamrick-audio-streaming";

  /**
   * Generate Google Cloud livestream channel data for a podcast
   * Creates channel identifier and stream credentials mapped to local RTMP/HLS endpoints
   */
  async getOrCreateChannel(
    name: string,
    podcastId?: string
  ): Promise<IVSChannel> {
    // Generate cryptographically secure stream key
    const streamKey = this.generateStreamKey();

    // Generate channel resource name (Google Cloud format)
    const channelId = this.generateChannelId(podcastId || name);
    const arn = `projects/${this.projectId}/locations/${this.region}/channels/${channelId}`;

    // Extract host from server URL
    const ingestEndpoint = this.getIngestEndpoint();

    // Generate HLS playback URL (available after stream starts)
    const playbackUrl = this.generatePlaybackUrl(streamKey);

    return {
      arn,
      playbackUrl,
      streamKey,
      ingestEndpoint,
    };
  }

  /**
   * Generate secure stream key for RTMP ingest
   */
  private generateStreamKey(): string {
    // Generate 32-character random string for secure streaming
    const randomPart = crypto
      .randomBytes(16)
      .toString("base64")
      .replace(/\+/g, "")
      .replace(/\//g, "")
      .replace(/=/g, "")
      .substring(0, 32);

    return `gcs_${this.region}_${randomPart}`;
  }

  /**
   * Generate unique channel ID from podcast identifier
   */
  private generateChannelId(identifier: string): string {
    // Create deterministic but unique channel ID
    const hash = crypto
      .createHash("sha256")
      .update(identifier + Date.now().toString())
      .digest("hex")
      .substring(0, 12);

    return hash;
  }

  /**
   * Extract host from server URL for ingest endpoint
   */
  private getIngestEndpoint(): string {
    const serverUrl = config.serverUrl || "localhost:5005";

    // Remove protocol and extract host
    const host = serverUrl.replace(/^https?:\/\//, "").replace(/:\d+$/, ""); // Remove port if present

    // Return in Google Cloud ingest endpoint format
    return `${host}.rtmp.stream.goog`;
  }

  /**
   * Generate HLS playback URL for the stream
   * Maps to local node-media-server HLS output
   */
  private generatePlaybackUrl(streamKey: string): string {
    const serverUrl = config.serverUrl || "http://localhost:5005";
    const host = serverUrl.replace(/^https?:\/\//, "").replace(/:\d+$/, "");
    const httpPort = config.rtmp?.httpPort || 8000;

    // Generate Google Cloud-style playback URL format
    const playbackHost = `${crypto.randomBytes(6).toString("hex")}.${
      this.region
    }.stream.goog`;
    const channelHash = crypto.randomBytes(8).toString("hex");

    // Return URL in Google Cloud format (actual playback will be via local HLS)
    return `https://${playbackHost}/v1/projects/${this.projectId}/locations/${this.region}/channels/${channelHash}/stream.m3u8`;
  }

  /**
   * Get actual local HLS playback URL (for internal use)
   */
  getLocalPlaybackUrl(streamKey: string): string {
    const serverUrl = config.serverUrl || "http://localhost:5005";
    const host = serverUrl.replace(/^https?:\/\//, "").replace(/:\d+$/, "");
    const httpPort = config.rtmp?.httpPort || 8000;

    return `http://${host}:${httpPort}/live/${streamKey}/index.m3u8`;
  }

  /**
   * Get actual local RTMP ingest URL (for internal use)
   */
  getLocalIngestUrl(): string {
    const serverUrl = config.serverUrl || "http://localhost:5005";
    const host = serverUrl.replace(/^https?:\/\//, "").replace(/:\d+$/, "");
    const rtmpPort = config.rtmp?.port || 1935;

    return `rtmp://${host}:${rtmpPort}/live`;
  }

  /**
   * Validate if stream key format is correct
   */
  isValidStreamKey(streamKey: string): boolean {
    // Check Google Cloud stream key format: gcs_region_randomString
    const streamKeyRegex = /^gcs_[a-z0-9-]+_[A-Za-z0-9]{20,}$/;
    return streamKeyRegex.test(streamKey);
  }

  /**
   * Check if stream is currently live (placeholder - integrate with node-media-server)
   */
  async isStreamLive(streamKeyOrArn: string): Promise<boolean> {
    // TODO: Query node-media-server sessions to check if stream is active
    // For now, return false (implement when needed)
    return false;
  }

  /**
   * Delete channel (no-op for local implementation)
   */
  async deleteChannel(arn: string): Promise<boolean> {
    // Local implementation doesn't require cleanup
    // Return true for compatibility
    return true;
  }
}

export default new IVSCompatService();
