import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing sound effects in the quiz
 * @returns {Object} Sound effect controls
 */
const useSoundEffects = () => {
  // State for tracking if sound is muted
  const [muted, setMuted] = useState(() => {
    // Check if we have a saved preference in localStorage
    const savedMuted = localStorage.getItem('quizSoundMuted');
    return savedMuted ? JSON.parse(savedMuted) : false;
  });

  // State for tracking if background music is muted (separate control)
  const [musicMuted, setMusicMuted] = useState(() => {
    // Check if we have a saved preference in localStorage
    const savedMusicMuted = localStorage.getItem('quizMusicMuted');
    return savedMusicMuted ? JSON.parse(savedMusicMuted) : false;
  });

  // State to track if sounds are loaded
  const [loaded, setLoaded] = useState(false);
  
  // Track if user has interacted with the page (needed for autoplay)
  // Check localStorage for a flag set by the QuizIntro component
  const [userInteracted, setUserInteracted] = useState(() => {
    const savedInteraction = localStorage.getItem('quizUserInteracted');
    return savedInteraction === 'true';
  });

  // Audio object references
  const [sounds, setSounds] = useState({
    correct: null,
    wrong: null,
    background: null
  });

  // Listen for user interaction to enable audio
  useEffect(() => {
    // If the user has already interacted (from localStorage), we don't need to add listeners
    if (userInteracted) {
      return;
    }
    
    const enableAudio = () => {
      setUserInteracted(true);
      localStorage.setItem('quizUserInteracted', 'true');
      
      // Try to resume audio context if it exists (for Web Audio API)
      if (window.AudioContext || window.webkitAudioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }
      
      // Remove the listeners after first interaction
      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
    
    // Add listeners for user interaction
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, enableAudio);
    });
    
    return () => {
      // Cleanup listeners
      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
  }, [userInteracted]);

  // Load sound files
  useEffect(() => {
    console.log('Loading sound files...');
    
    // Function to create audio element with fallback paths
    const createAudioWithFallback = (filename) => {
      // Try multiple possible paths to find the audio files
      const paths = [
        process.env.PUBLIC_URL + '/sounds/' + filename, // React public folder
        '/sounds/' + filename,                          // Direct request to Flask route
        'http://localhost:5001/sounds/' + filename,     // Explicit Flask URL (if running on port 5001)
        'http://localhost:5000/sounds/' + filename,     // Alternative Flask port
        '/static/sounds/' + filename,                   // Flask static folder
        '../sounds/' + filename                         // Relative path
      ];
      
      console.log(`Attempting to load ${filename} from primary path: ${paths[0]}`);
      
      // Create the audio element with the first path
      const audio = new Audio(paths[0]);
      
      // Set up error handler to try alternate paths on failure
      let pathIndex = 0;
      
      const handleLoadError = () => {
        pathIndex++;
        if (pathIndex < paths.length) {
          console.log(`Trying alternate path for ${filename}: ${paths[pathIndex]}`);
          audio.src = paths[pathIndex];
          audio.load();
        } else {
          console.error(`All paths failed for ${filename}. Audio might not play.`);
        }
      };
      
      audio.addEventListener('error', handleLoadError);
      
      return audio;
    };
    
    // Create audio elements with fallback paths
    const correctSound = createAudioWithFallback('correct.mp3');
    const wrongSound = createAudioWithFallback('wrong.mp3');
    const backgroundMusic = createAudioWithFallback('background.mp3');

    // Set volume to be classroom appropriate
    correctSound.volume = 0.75;
    wrongSound.volume = 0.75;
    backgroundMusic.volume = 0.075; // Set background music volume very low
    
    // Configure background music to loop
    backgroundMusic.loop = true;
    
    // Add error handlers to log issues
    const handleError = (e) => {
      console.error(`Error with audio file: ${e.target.src}`, e);
    };
    
    correctSound.addEventListener('error', handleError);
    wrongSound.addEventListener('error', handleError);
    backgroundMusic.addEventListener('error', handleError);

    // Preload sounds
    const preloadPromises = [
      // Using the canplaythrough event to ensure they're fully loaded
      new Promise((resolve, reject) => {
        const onCanPlay = () => {
          console.log('Loaded: correct.mp3');
          correctSound.removeEventListener('canplaythrough', onCanPlay);
          resolve();
        };
        const onError = (e) => {
          console.error('Failed to load correct.mp3', e);
          correctSound.removeEventListener('error', onError);
          reject(e);
        };
        
        correctSound.addEventListener('canplaythrough', onCanPlay, { once: true });
        correctSound.addEventListener('error', onError, { once: true });
        correctSound.load();
      }),
      new Promise((resolve, reject) => {
        const onCanPlay = () => {
          console.log('Loaded: wrong.mp3');
          wrongSound.removeEventListener('canplaythrough', onCanPlay);
          resolve();
        };
        const onError = (e) => {
          console.error('Failed to load wrong.mp3', e);
          wrongSound.removeEventListener('error', onError);
          reject(e);
        };
        
        wrongSound.addEventListener('canplaythrough', onCanPlay, { once: true });
        wrongSound.addEventListener('error', onError, { once: true });
        wrongSound.load();
      }),
      new Promise((resolve, reject) => {
        const onCanPlay = () => {
          console.log('Loaded: background.mp3');
          backgroundMusic.removeEventListener('canplaythrough', onCanPlay);
          resolve();
        };
        const onError = (e) => {
          console.error('Failed to load background.mp3', e);
          backgroundMusic.removeEventListener('error', onError);
          reject(e);
        };
        
        backgroundMusic.addEventListener('canplaythrough', onCanPlay, { once: true });
        backgroundMusic.addEventListener('error', onError, { once: true });
        backgroundMusic.load();
      })
    ];
    
    // Wait for all sounds to load or handle errors
    Promise.allSettled(preloadPromises)
      .then(results => {
        const allSucceeded = results.every(r => r.status === 'fulfilled');
        if (allSucceeded) {
          console.log('All sound files loaded successfully');
        } else {
          console.warn('Some sound files failed to load, but will continue');
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.error(`Sound ${index} failed:`, result.reason);
            }
          });
        }
        
        setSounds({
          correct: correctSound,
          wrong: wrongSound,
          background: backgroundMusic
        });
        setLoaded(true);
      })
      .catch(error => {
        console.error('Failed to load sound effects:', error);
        // Still set loaded to true so the app can function without sounds
        setLoaded(true);
      });

    // Cleanup function to release audio resources
    return () => {
      console.log('Cleaning up audio resources');
      [correctSound, wrongSound, backgroundMusic].forEach(sound => {
        // Stop playback
        sound.pause();
        
        // Remove all listeners by cloning and replacing the node
        const clone = sound.cloneNode(false);
        
        // Clear source and nullify any references
        sound.src = '';
        
        if (sound.parentNode) {
          sound.parentNode.replaceChild(clone, sound);
        }
      });
    };
  }, []);

  // Update background music state when musicMuted changes
  useEffect(() => {
    if (loaded && sounds.background) {
      if (musicMuted) {
        sounds.background.pause();
      } else if (userInteracted) {
        try {
          const playPromise = sounds.background.play();
          
          // Handle the play promise to catch any autoplay issues
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Error playing background music:', error);
            });
          }
        } catch (error) {
          console.error('Error with background music:', error);
        }
      }
    }
  }, [musicMuted, loaded, sounds.background, userInteracted]);

  // Toggle mute function for sound effects
  const toggleMute = useCallback(() => {
    setMuted(prevMuted => {
      const newMuted = !prevMuted;
      localStorage.setItem('quizSoundMuted', JSON.stringify(newMuted));
      return newMuted;
    });
  }, []);

  // Toggle mute function for background music
  const toggleMusicMute = useCallback(() => {
    setMusicMuted(prevMuted => {
      const newMuted = !prevMuted;
      localStorage.setItem('quizMusicMuted', JSON.stringify(newMuted));
      return newMuted;
    });
  }, []);

  // Start background music
  const startBackgroundMusic = useCallback(() => {
    if (loaded && sounds.background && !musicMuted) {
      try {
        console.log('Attempting to start background music, user interaction status:', userInteracted);
        
        // Force a check of localStorage in case it was updated in another component
        const storedInteraction = localStorage.getItem('quizUserInteracted') === 'true';
        
        if (userInteracted || storedInteraction) {
          const playPromise = sounds.background.play();
          
          // Handle the play promise to catch any autoplay issues
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Error starting background music:', error);
              // If we get an error, try one more time after a short delay
              if (error.name === 'NotAllowedError') {
                console.log('Autoplay prevented. Will retry after first user interaction.');
              }
            });
          }
        } else {
          console.log('Waiting for user interaction before playing audio');
        }
      } catch (error) {
        console.error('Error with background music:', error);
      }
    }
  }, [loaded, sounds.background, musicMuted, userInteracted]);

  // Stop background music
  const stopBackgroundMusic = useCallback(() => {
    if (loaded && sounds.background) {
      try {
        sounds.background.pause();
        sounds.background.currentTime = 0;
      } catch (error) {
        console.error('Error stopping background music:', error);
      }
    }
  }, [loaded, sounds.background]);

  // Play sound function
  const playSound = useCallback((soundName) => {
    if (muted || !loaded || !sounds[soundName] || soundName === 'background' || !userInteracted) return;
    
    try {
      console.log(`Playing ${soundName} sound`);
      // Stop and reset the sound first in case it's already playing
      const sound = sounds[soundName];
      sound.pause();
      sound.currentTime = 0;
      
      // Play the sound
      const playPromise = sound.play();
      
      // Handle the play promise to catch any autoplay issues
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error(`Error playing ${soundName} sound:`, error);
        });
      }
    } catch (error) {
      console.error(`Error with sound ${soundName}:`, error);
    }
  }, [muted, loaded, sounds, userInteracted]);

  return {
    playSound,
    toggleMute,
    muted,
    loaded,
    musicMuted,
    toggleMusicMute,
    startBackgroundMusic,
    stopBackgroundMusic,
    userInteracted
  };
};

export default useSoundEffects; 