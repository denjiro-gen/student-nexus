import React from 'react';
import { Link } from 'react-router-dom';
import { HiCheckCircle } from 'react-icons/hi';
import { motion } from 'framer-motion';

const SuccessPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-osas-secondary-bg dark:bg-[#0f1117] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-[#1e2430] p-8 rounded-3xl shadow-xl text-center border border-gray-100 dark:border-gray-800"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <HiCheckCircle className="text-7xl text-green-500 dark:text-green-400" />
          </motion.div>
        </div>
        
        <h1 className="text-3xl font-bold font-poppins text-gray-900 dark:text-white mb-4">
          Successful!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          Your email has been confirmed successfully. <br/>
          <span className="font-semibold text-osas-primary dark:text-osas-accent block mt-2">
            You can now login on the mobile app.
          </span>
        </p>

        <Link 
          to="/" 
          className="inline-block w-full bg-osas-primary hover:bg-osas-secondary text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-md"
        >
          Go to Website Home
        </Link>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
