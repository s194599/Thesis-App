import subprocess
import sys
import os


def check_ffmpeg():
    """Check if FFmpeg is installed and accessible"""
    try:
        # Run ffmpeg -version command
        subprocess.run(
            ["ffmpeg", "-version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )
        print("✅ FFmpeg is installed and accessible")
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        print("❌ FFmpeg is not installed or not in PATH")
        return False


def setup_video_transcription():
    """Setup video transcription dependencies"""
    # Check Python version
    python_version = sys.version.split()[0]
    print(f"Python version: {python_version}")

    # Check for FFmpeg
    ffmpeg_installed = check_ffmpeg()

    if not ffmpeg_installed:
        print(
            "\nFFmpeg is required for video transcription. Installation instructions:"
        )

        if sys.platform == "win32":
            print(
                """
Windows Installation:
1. Download FFmpeg from https://www.gyan.dev/ffmpeg/builds/ (get the "release full" build)
2. Extract the ZIP file
3. Add the bin folder to your PATH environment variable
4. Restart your terminal/command prompt
            """
            )
        elif sys.platform == "darwin":
            print(
                """
macOS Installation:
1. Using Homebrew: brew install ffmpeg
2. Or download from https://evermeet.cx/ffmpeg/
            """
            )
        else:
            print(
                """
Linux Installation:
- Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg
- Fedora: sudo dnf install ffmpeg
- Arch Linux: sudo pacman -S ffmpeg
            """
            )

    # Check for Python packages
    print("\nChecking Python packages:")
    required_packages = ["whisper-timestamped", "pydub"]

    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package} is installed")
        except ImportError:
            print(f"❌ {package} is not installed")
            print(f"   Install with: pip install {package}")

    if ffmpeg_installed:
        print("\n✅ Your system is ready for video transcription!")
        print("To install everything at once: pip install pydub whisper-timestamped")
    else:
        print("\n❌ Please install FFmpeg before using video transcription features")


if __name__ == "__main__":
    setup_video_transcription()
