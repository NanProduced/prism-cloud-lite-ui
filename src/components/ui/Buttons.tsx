import React from "react";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const ButtonPrimary: React.FC<ButtonProps> = ({
  children,
  onClick,
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="bg-[#5552ff] text-white px-8 py-3 rounded-full font-medium text-sm md:text-base shadow-[0_10px_20px_rgba(85,82,255,0.3)] transition-colors hover:bg-[#4542cc]"
  >
    {children}
  </motion.button>
);

export const ButtonSecondary: React.FC<ButtonProps> = ({ children }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="border border-[#5a5a5a] text-[#dadada] px-8 py-3 rounded-full font-medium text-sm md:text-base hover:border-white hover:text-white transition-colors"
  >
    {children}
  </motion.button>
);
