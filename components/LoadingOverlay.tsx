import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
      <motion.div
        animate={{
          y: [0, -15, 0],
          rotate: [0, -5, 5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Briefcase className="w-16 h-16 text-blue-600" strokeWidth={1.5} />
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 text-xl font-medium text-slate-600 text-center px-4"
      >
        {message}
      </motion.p>
    </div>
  );
};