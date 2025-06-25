'use client';

import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  words: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export default function TypingAnimation({
  words,
  className = '',
  typingSpeed = 60,
  deletingSpeed = 20,
  pauseDuration = 1500,
}: TypingAnimationProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;

    const currentWord = words[currentWordIndex];

    const timeout = setTimeout(
      () => {
        if (isWaiting) {
          setIsWaiting(false);
          setIsDeleting(true);
          return;
        }

        if (!isDeleting) {
          // Escribiendo
          if (currentText.length < currentWord.length) {
            setCurrentText(currentWord.slice(0, currentText.length + 1));
          } else {
            // Palabra completada, esperar antes de borrar
            setIsWaiting(true);
          }
        } else {
          // Borrando
          if (currentText.length > 0) {
            setCurrentText(currentText.slice(0, -1));
          } else {
            // Borrado completado, pasar a la siguiente palabra
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isWaiting ? pauseDuration
      : isDeleting ? deletingSpeed
      : typingSpeed,
    );

    return () => clearTimeout(timeout);
  }, [currentText, currentWordIndex, isDeleting, isWaiting, words, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
