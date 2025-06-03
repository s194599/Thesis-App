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

  // State to track if sounds are loaded
  const [loaded, setLoaded] = useState(false);

  // Audio object references
  const [sounds, setSounds] = useState({
    correct: null,
    wrong: null
  });

  // Load sound files
  useEffect(() => {
    const correctSound = new Audio('/sounds/correct.mp3');
    const wrongSound = new Audio('/sounds/wrong.mp3');

    // Set volume to be classroom appropriate
    correctSound.volume = 0.5;
    wrongSound.volume = 0.5;

    // Preload sounds
    Promise.all([
      // Using the canplaythrough event to ensure they're fully loaded
      new Promise(resolve => {
        correctSound.addEventListener('canplaythrough', resolve, { once: true });
        correctSound.load();
      }),
      new Promise(resolve => {
        wrongSound.addEventListener('canplaythrough', resolve, { once: true });
        wrongSound.load();
      })
    ])
    .then(() => {
      setSounds({
        correct: correctSound,
        wrong: wrongSound
      });
      setLoaded(true);
    })
    .catch(error => {
      console.error('Failed to load sound effects:', error);
    });

    // Cleanup function to release audio resources
    return () => {
      [correctSound, wrongSound].forEach(sound => {
        sound.pause();
        sound.src = '';
      });
    };
  }, []);

  // Toggle mute function
  const toggleMute = useCallback(() => {
    setMuted(prevMuted => {
      const newMuted = !prevMuted;
      localStorage.setItem('quizSoundMuted', JSON.stringify(newMuted));
      return newMuted;
    });
  }, []);

  // Play sound function
  const playSound = useCallback((soundName) => {
    if (muted || !loaded || !sounds[soundName]) return;
    
    try {
      // Stop and reset the sound first in case it's already playing
      const sound = sounds[soundName];
      sound.pause();
      sound.currentTime = 0;
      
      // Play the sound
      sound.play().catch(error => {
        console.error(`Error playing ${soundName} sound:`, error);
      });
    } catch (error) {
      console.error(`Error with sound ${soundName}:`, error);
    }
  }, [muted, loaded, sounds]);

  return {
    playSound,
    toggleMute,
    muted,
    loaded
  };
};

export default useSoundEffects; 