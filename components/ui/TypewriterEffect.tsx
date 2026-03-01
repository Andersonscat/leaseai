"use client";

import React, { useState, useEffect } from "react";

interface TypewriterEffectProps {
  words: string[];
  className?: string;
  cursorClassName?: string;
}

export default function TypewriterEffect({ 
  words, 
  className = "",
  cursorClassName = "bg-blue-500"
}: TypewriterEffectProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const word = words[currentWordIndex];
    const typeSpeed = isDeleting ? 50 : 150;
    const pauseTime = 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting && currentText.length < word.length) {
        // Typing
        setCurrentText(word.substring(0, currentText.length + 1));
      } else if (isDeleting && currentText.length > 0) {
        // Deleting
        setCurrentText(word.substring(0, currentText.length - 1));
      } else if (!isDeleting && currentText.length === word.length) {
        // Finished typing, wait before deleting
        setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && currentText.length === 0) {
        // Finished deleting, move to next word
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, words, currentWordIndex]);

  return (
    <span className={className}>
      {currentText}
      <span className={`inline-block w-[3px] h-[1em] ml-1 align-middle animate-pulse ${cursorClassName}`} />
    </span>
  );
}
