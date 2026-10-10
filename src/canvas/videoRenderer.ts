import { PHOTO_AREA, POSTER_WIDTH, POSTER_HEIGHT } from './coordinates';
import type { UserData } from '../types/poster';

export const generateVideo = async (
  userData: UserData,
  templateUrl: string,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!userData.photoUrl) return reject(new Error("No video provided"));

    // 1. Load the template image
    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";
    templateImg.src = templateUrl;

    templateImg.onload = () => {
      // 2. Create the hidden video element to play the user's uploaded video
      const videoEl = document.createElement('video');
      videoEl.src = userData.photoUrl!;
      videoEl.crossOrigin = "anonymous";
      videoEl.muted = false; // We want to capture audio
      videoEl.playsInline = true;
      
      videoEl.onloadedmetadata = () => {
        // Prepare canvas
        const canvas = document.createElement('canvas');
        canvas.width = POSTER_WIDTH;
        canvas.height = POSTER_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("No canvas context"));

        // Calculate scaling for video to cover the PHOTO_AREA (like object-fit: cover)
        const baseScale = Math.max(
          PHOTO_AREA.width / videoEl.videoWidth,
          PHOTO_AREA.height / videoEl.videoHeight
        );
        const userScale = userData.videoScale || 1.0;
        const finalScale = baseScale * userScale;

        const drawWidth = videoEl.videoWidth * finalScale;
        const drawHeight = videoEl.videoHeight * finalScale;
        
        const offsetX = userData.videoOffset?.x || 0;
        const offsetY = userData.videoOffset?.y || 0;
        
        const drawX = PHOTO_AREA.x + (PHOTO_AREA.width - drawWidth) / 2 + offsetX;
        const drawY = PHOTO_AREA.y + (PHOTO_AREA.height - drawHeight) / 2 + offsetY;

        let animationId: number;
        
        // Capture stream from canvas (30fps)
        const canvasStream = canvas.captureStream(30);
        
        // Capture audio from video element
        let combinedStream = canvasStream;
        try {
          const anyVideo = videoEl as any;
          const videoAudioStream = anyVideo.captureStream ? anyVideo.captureStream() : anyVideo.mozCaptureStream ? anyVideo.mozCaptureStream() : null;
          
          if (videoAudioStream && videoAudioStream.getAudioTracks().length > 0) {
            combinedStream = new MediaStream([
              ...canvasStream.getVideoTracks(),
              ...videoAudioStream.getAudioTracks()
            ]);
          }
        } catch(e) {
          console.warn("Could not capture audio stream from video", e);
        }

        // We use webm as it is widely supported for MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
        const recorder = new MediaRecorder(combinedStream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          cancelAnimationFrame(animationId);
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };

                const startT = userData.videoStartTime || 0;
        const endT = userData.videoEndTime || videoEl.duration;
        const duration = endT - startT;

        const drawFrame = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          ctx.save();
          ctx.beginPath();
          ctx.rect(PHOTO_AREA.x, PHOTO_AREA.y, PHOTO_AREA.width, PHOTO_AREA.height);
          ctx.clip();
          ctx.drawImage(videoEl, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();

          ctx.drawImage(templateImg, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);

          if (!videoEl.ended && !videoEl.paused && videoEl.currentTime < endT) {
            animationId = requestAnimationFrame(drawFrame);
            onProgress(Math.max(0, Math.min(1, (videoEl.currentTime - startT) / duration)));
          } else {
            recorder.stop();
            videoEl.pause();
          }
        };

        videoEl.onplay = () => {
          recorder.start();
          drawFrame();
        };

        videoEl.currentTime = startT;
        // Wait for seek before playing to avoid artifacts
        videoEl.onseeked = () => {
          videoEl.onseeked = null;
          videoEl.play().catch(reject);
        };
      };
      
      videoEl.onerror = () => reject(new Error("Failed to load video."));
    };
    templateImg.onerror = () => reject(new Error("Failed to load template image."));
  });
};

