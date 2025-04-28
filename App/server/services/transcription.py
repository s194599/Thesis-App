import os
import whisper_timestamped as whisper
import logging
from config.app_config import logger


def transcribe_video(video_path):
    """
    Transcribe a video file using Whisper-Timestamped

    Args:
        video_path (str): Path to the video file

    Returns:
        str: Transcribed text from the video

    Raises:
        FileNotFoundError: If the video file doesn't exist
        Exception: For other transcription errors
    """
    try:
        logger.info(f"Starting transcription of video: {video_path}")

        # First check if we can access the file
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        try:
            # Load Whisper model - using 'base' for a balance of speed and accuracy
            # Options: 'tiny', 'base', 'small', 'medium', 'large'
            logger.info("Starting transcription with whisper-timestamped...")

            # Transcribe the video - whisper-timestamped handles audio extraction automatically
            result = whisper.transcribe(model="base", audio=video_path, language="en")

            # Extract the text from segments
            if "segments" in result:
                segments = result["segments"]
                transcription = " ".join([segment["text"] for segment in segments])

                # Log some timing information
                duration = result.get("duration", 0)
                num_segments = len(segments)
                logger.info(
                    f"Transcription completed: {len(transcription)} characters, {num_segments} segments, {duration:.2f} seconds of audio"
                )

                return transcription
            else:
                logger.warning("No segments found in transcription result")
                return "No transcription segments were produced."
        except FileNotFoundError as e:
            if "ffmpeg" in str(e).lower() or "avconv" in str(e).lower():
                logger.error(
                    "FFmpeg not found. Please install FFmpeg to enable video transcription."
                )
                return "[VIDEO TRANSCRIPTION ERROR] FFmpeg not found. Please install FFmpeg to enable video transcription."
            else:
                raise

    except Exception as e:
        logger.error(f"Error transcribing video: {str(e)}")
        return f"[VIDEO TRANSCRIPTION ERROR] {str(e)}"
