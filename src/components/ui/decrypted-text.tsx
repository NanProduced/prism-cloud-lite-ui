import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface DecryptedTextProps {
  text: string
  speed?: number
  maxIterations?: number
  sequential?: boolean
  revealDirection?: 'start' | 'end' | 'center'
  useOriginalCharsOnly?: boolean
  characters?: string
  className?: string    
  parentClassName?: string
  animateOn?: 'view' | 'hover' 
  [key: string]: any
}

export default function DecryptedText({
  text, 
  speed = 50, 
  maxIterations = 10, 
  sequential = false, 
  revealDirection = 'start', 
  useOriginalCharsOnly = false, 
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  animateOn = 'hover',
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string>(text)
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let interval: number
    let currentIteration = 0

    const getNextChar = (char: string) => {
      if (useOriginalCharsOnly) {
        const index = Math.floor(Math.random() * text.length)
        return text[index]
      }
      const index = Math.floor(Math.random() * characters.length)
      return characters[index]
    }

    const runAnimation = () => {
      if (currentIteration >= maxIterations) {
        setDisplayText(text)
        return
      }

      setDisplayText(prev => 
        prev.split('').map((char, index) => {
          if (char === ' ') return char
          if (text[index] === char) return char
          
          const progress = currentIteration / maxIterations
          let shouldReveal = false
          if (sequential) {
             if (revealDirection === 'start') {
                shouldReveal = index / text.length <= progress
             } else if (revealDirection === 'end') {
                shouldReveal = 1 - (index / text.length) <= progress
             } else if (revealDirection === 'center') {
                const center = Math.floor(text.length / 2)
                const dist = Math.abs(index - center)
                shouldReveal = 1 - (dist / center) <= progress
             }
          } else {
             shouldReveal = Math.random() < progress
          }

          if (shouldReveal) return text[index]
          return getNextChar(char)
        }).join('')
      )
      currentIteration++
      // @ts-ignore
      interval = setTimeout(runAnimation, speed)
    }

    if ((animateOn === 'view' && isScrolled) || (animateOn === 'hover' && isHovering)) {
        runAnimation()
    }

    return () => clearTimeout(interval)
  }, [isHovering, isScrolled, text, speed, maxIterations, sequential, revealDirection, useOriginalCharsOnly, characters, animateOn])

  useEffect(() => {
      if (animateOn === 'view') {
          const observer = new IntersectionObserver(([entry]) => {
              if (entry.isIntersecting) {
                  setIsScrolled(true)
                  observer.disconnect()
              }
          }, { threshold: 0.1 })
          
          if (containerRef.current) {
              observer.observe(containerRef.current)
          }

          return () => observer.disconnect()
      }
  }, [animateOn])


  return (
    <span 
      ref={containerRef}
      className={`inline-block whitespace-nowrap ${parentClassName}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      <span className={className}>{displayText}</span>
    </span>
  )
}
