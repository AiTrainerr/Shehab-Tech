"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

export function SplashScreen() {
  const [show, setShow] = React.useState(true)

  React.useEffect(() => {
    // Show splash screen for 2.5 seconds on initial load
    const timer = setTimeout(() => {
      setShow(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020b18] overflow-hidden"
        >
          {/* Background glowing effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#020b18]/80 to-[#020b18] pointer-events-none" />

          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <img 
                src="/icon-512.png" 
                alt="Shehab Tech Logo" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_0_25px_rgba(14,165,233,0.5)]"
              />
              
              {/* Sparkle effect on the logo */}
              <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -45 }}
                animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: 45 }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-white blur-[2px]"
                style={{ clipPath: "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)" }}
              />
            </motion.div>

            {/* Text Reveal */}
            <motion.div
              initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-6 flex flex-col items-center"
            >
              <h1 className="text-3xl md:text-4xl font-black tracking-[0.2em] text-white">
                SHEHAB<span className="text-primary ml-2">TECH</span>
              </h1>
              <motion.div 
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.8, ease: "anticipate" }}
                className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent mt-4"
              />
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="text-primary/60 text-xs tracking-widest mt-3 uppercase font-semibold"
              >
                AI Data Collection Platform
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
